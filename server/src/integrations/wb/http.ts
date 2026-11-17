import type { Logger } from "../../logger";
import {
  WbAuthError,
  WbRateLimitError,
  WbRequestError,
  WbUnavailableError,
} from "./errors";

export interface RetryPolicy {
  /** Retries after the first attempt (0 = no retries). */
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface HttpDeps {
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  random: () => number;
  log: Logger;
}

export interface WbRequest {
  url: string;
  method?: "GET" | "POST";
  apiKey: string;
  body?: unknown;
  timeoutMs: number;
  retry: RetryPolicy;
}

export const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Exponential backoff with "full jitter": a random delay in [0, base * 2^attempt],
 * capped. Jitter spreads retries of many clients so they do not hit WB in lockstep.
 */
export function backoffDelay(
  attempt: number,
  policy: RetryPolicy,
  random: () => number,
): number {
  const ceiling = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** attempt);
  return Math.floor(random() * ceiling);
}

/** Retry-After is either delta-seconds or an HTTP date (RFC 9110). */
export function parseRetryAfter(
  header: string | null,
  now = Date.now(),
): number | undefined {
  if (!header) {
    return undefined;
  }
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
}

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

/**
 * Performs a request to the WB API and returns the parsed JSON body.
 * - every attempt has its own timeout (AbortSignal.timeout)
 * - 429, 5xx, network errors and timeouts are retried with backoff + jitter
 * - for 429 the server-provided Retry-After wins over the computed backoff
 * - 401/403 and other 4xx fail immediately with a domain error
 */
export async function wbRequest(req: WbRequest, deps: HttpDeps): Promise<unknown> {
  const method = req.method ?? "GET";
  const log = deps.log.child({ wbUrl: req.url.split("?")[0], method });

  for (let attempt = 0; ; attempt++) {
    const isLastAttempt = attempt >= req.retry.retries;
    let retryDelay: number;
    let failure: Error;

    try {
      const response = await deps.fetch(req.url, {
        method,
        headers: {
          Accept: "application/json",
          Authorization: req.apiKey,
          ...(req.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
        signal: AbortSignal.timeout(req.timeoutMs),
      });

      if (response.ok) {
        const text = await response.text();
        return text ? (JSON.parse(text) as unknown) : null;
      }
      if (response.status === 401 || response.status === 403) {
        throw new WbAuthError(
          `WB rejected the API key (${response.status})`,
          response.status,
        );
      }
      if (!isRetryableStatus(response.status)) {
        throw new WbRequestError(
          `WB request failed with ${response.status}`,
          response.status,
        );
      }

      const retryAfter =
        response.status === 429
          ? parseRetryAfter(response.headers.get("retry-after"))
          : undefined;
      failure =
        response.status === 429
          ? new WbRateLimitError("WB rate limit exceeded", retryAfter)
          : new WbUnavailableError(
              `WB responded with ${response.status}`,
              response.status,
            );
      retryDelay = retryAfter ?? backoffDelay(attempt, req.retry, deps.random);
    } catch (err) {
      if (err instanceof WbAuthError || err instanceof WbRequestError) {
        throw err;
      }
      if (err instanceof SyntaxError) {
        throw new WbUnavailableError("WB returned malformed JSON", undefined, {
          cause: err,
        });
      }
      // network error or AbortSignal timeout
      const timedOut = err instanceof DOMException && err.name === "TimeoutError";
      failure = new WbUnavailableError(
        timedOut ? `WB did not respond within ${req.timeoutMs} ms` : "WB request failed",
        undefined,
        { cause: err },
      );
      retryDelay = backoffDelay(attempt, req.retry, deps.random);
    }

    // Waiting longer than the policy allows would block the caller: fail fast instead.
    if (isLastAttempt || retryDelay > req.retry.maxDelayMs) {
      log.warn({ attempt, err: failure }, "WB request failed, no retries left");
      throw failure;
    }
    log.info(
      { attempt, delayMs: retryDelay, reason: failure.message },
      "retrying WB request",
    );
    await deps.sleep(retryDelay);
  }
}

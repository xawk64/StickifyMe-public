import { describe, expect, it, vi } from "vitest";
import {
  WbAuthError,
  WbRateLimitError,
  WbRequestError,
  WbUnavailableError,
} from "../src/integrations/wb/errors";
import {
  backoffDelay,
  parseRetryAfter,
  wbRequest,
  type RetryPolicy,
} from "../src/integrations/wb/http";
import { logger } from "../src/logger";

const policy: RetryPolicy = { retries: 3, baseDelayMs: 100, maxDelayMs: 5_000 };

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers });

function setup(responses: (Response | Error)[]) {
  const fetch = vi.fn(async () => {
    const next = responses.shift();
    if (!next) throw new Error("unexpected extra request");
    if (next instanceof Error) throw next;
    return next;
  });
  const sleep = vi.fn(async (_ms: number) => {});
  const request = () =>
    wbRequest(
      { url: "https://wb.test/api", apiKey: "key", timeoutMs: 1_000, retry: policy },
      {
        fetch: fetch as unknown as typeof globalThis.fetch,
        sleep,
        random: () => 0.5,
        log: logger,
      },
    );
  return { fetch, sleep, request };
}

describe("backoffDelay", () => {
  it("grows exponentially, applies full jitter and respects the cap", () => {
    expect(backoffDelay(0, policy, () => 1)).toBe(100);
    expect(backoffDelay(3, policy, () => 1)).toBe(800);
    expect(backoffDelay(3, policy, () => 0.5)).toBe(400);
    expect(backoffDelay(20, policy, () => 1)).toBe(5_000);
  });
});

describe("parseRetryAfter", () => {
  it("supports delta-seconds and HTTP dates", () => {
    expect(parseRetryAfter("3")).toBe(3_000);
    const now = Date.parse("2026-01-01T00:00:00Z");
    expect(parseRetryAfter("Thu, 01 Jan 2026 00:00:10 GMT", now)).toBe(10_000);
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("soon")).toBeUndefined();
  });
});

describe("wbRequest", () => {
  it("returns the parsed body on success without retrying", async () => {
    const { request, fetch } = setup([json(200, { ok: true })]);
    await expect(request()).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries 5xx with exponential backoff and succeeds", async () => {
    const { request, sleep } = setup([json(502, {}), json(503, {}), json(200, [1])]);
    await expect(request()).resolves.toEqual([1]);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([50, 100]);
  });

  it("waits for Retry-After on 429 instead of the computed backoff", async () => {
    const { request, sleep } = setup([
      json(429, {}, { "Retry-After": "2" }),
      json(200, "ok"),
    ]);
    await expect(request()).resolves.toBe("ok");
    expect(sleep).toHaveBeenCalledWith(2_000);
  });

  it("fails fast when Retry-After exceeds the maximum delay", async () => {
    const { request, fetch } = setup([json(429, {}, { "Retry-After": "3600" })]);
    await expect(request()).rejects.toBeInstanceOf(WbRateLimitError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("gives up after the configured retries with a domain error", async () => {
    const { request, fetch } = setup([
      json(500, {}),
      json(500, {}),
      json(500, {}),
      json(500, {}),
    ]);
    await expect(request()).rejects.toBeInstanceOf(WbUnavailableError);
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it("retries network errors and timeouts", async () => {
    const timeout = new DOMException("The operation timed out", "TimeoutError");
    const { request } = setup([new TypeError("fetch failed"), timeout, json(200, 1)]);
    await expect(request()).resolves.toBe(1);
  });

  it("does not retry an invalid API key", async () => {
    const { request, fetch } = setup([json(401, { detail: "unauthorized" })]);
    await expect(request()).rejects.toBeInstanceOf(WbAuthError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry other client errors", async () => {
    const { request, fetch } = setup([json(400, { detail: "bad request" })]);
    await expect(request()).rejects.toBeInstanceOf(WbRequestError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

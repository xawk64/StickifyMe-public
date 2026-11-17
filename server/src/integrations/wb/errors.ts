/** Base class for failures of the Wildberries API integration. */
export class WbError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** 401/403: the seller's API key is invalid, expired or lacks the required scope. */
export class WbAuthError extends WbError {}

/** 429 after all retries were spent. */
export class WbRateLimitError extends WbError {
  constructor(
    message: string,
    public readonly retryAfterMs?: number,
  ) {
    super(message, 429);
  }
}

/** 5xx, network errors and timeouts after all retries were spent. */
export class WbUnavailableError extends WbError {}

/** WB answered 2xx with a body that does not match the expected schema. */
export class WbBadResponseError extends WbError {}

/** Any other 4xx: the request itself is wrong; retrying will not help. */
export class WbRequestError extends WbError {}

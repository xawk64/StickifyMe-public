import type { Response } from "express";
import type { Logger } from "../logger";
import { toHttpError } from "./middlewares/errorHandler";

export type Emit = (event: Record<string, unknown>) => void;

/**
 * Streams newline-delimited JSON events. Long WB imports report progress
 * while they run; the last line is either {type:"result"} or {type:"error"}.
 * Errors after the first byte cannot change the HTTP status, so they are
 * reported as an event with the status the request would have had.
 */
export async function streamNdjson(
  res: Response,
  log: Logger,
  work: (emit: Emit) => Promise<Record<string, unknown>>,
): Promise<void> {
  res.status(200).type("application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  const emit: Emit = (event) => {
    res.write(`${JSON.stringify(event)}\n`);
  };
  try {
    emit({ type: "result", ...(await work(emit)) });
  } catch (err) {
    const { status, body, unexpected } = toHttpError(err);
    if (unexpected) {
      log.error({ err }, "streamed request failed");
    } else {
      log.warn({ err }, "streamed request failed");
    }
    emit({ type: "error", status, ...body });
  } finally {
    res.end();
  }
}

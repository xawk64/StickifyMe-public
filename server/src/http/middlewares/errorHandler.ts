import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError, NotFoundError } from "../../errors";
import {
  WbAuthError,
  WbBadResponseError,
  WbError,
  WbRateLimitError,
} from "../../integrations/wb/errors";
import type { Logger } from "../../logger";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Маршрут ${req.method} ${req.path} не найден`));
};

const hasType = (err: unknown): err is { type: string } =>
  typeof err === "object" &&
  err !== null &&
  typeof (err as { type?: unknown }).type === "string";

export interface HttpError {
  status: number;
  body: { message: string; details?: unknown };
  /** false for errors that are expected and already meaningful to the client */
  unexpected: boolean;
}

/** Single mapping from domain / integration errors to HTTP status and message. */
export function toHttpError(err: unknown): HttpError {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: { message: err.message, ...(err.details ? { details: err.details } : {}) },
      unexpected: false,
    };
  }
  if (err instanceof WbError) {
    // The seller's WB key or WB itself is the problem, not our server.
    const message =
      err instanceof WbAuthError
        ? "Wildberries отклонил ключ API: проверьте его в настройках"
        : err instanceof WbRateLimitError
          ? "Wildberries ограничил частоту запросов, попробуйте позже"
          : err instanceof WbBadResponseError
            ? "Wildberries вернул неожиданный ответ"
            : "Wildberries временно недоступен, попробуйте позже";
    const status =
      err instanceof WbAuthError ? 400 : err instanceof WbRateLimitError ? 429 : 502;
    return { status, body: { message }, unexpected: false };
  }
  // body-parser errors
  if (hasType(err) && err.type === "entity.parse.failed") {
    return { status: 400, body: { message: "Некорректный JSON" }, unexpected: false };
  }
  if (hasType(err) && err.type === "entity.too.large") {
    return {
      status: 413,
      body: { message: "Слишком большой запрос" },
      unexpected: false,
    };
  }
  return {
    status: 500,
    body: { message: "Внутренняя ошибка сервера" },
    unexpected: true,
  };
}

/** Maps errors to HTTP responses; unexpected errors are logged and become a generic 500. */
export function createErrorHandler(log: Logger): ErrorRequestHandler {
  return (err, req, res, _next) => {
    const { status, body, unexpected } = toHttpError(err);
    if (unexpected) {
      log.error({ err, method: req.method, path: req.path }, "unhandled request error");
    } else if (err instanceof WbError) {
      log.warn({ err, path: req.path }, "WB integration error");
    }
    res.status(status).send(body);
  };
}

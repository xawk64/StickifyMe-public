import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError, NotFoundError } from "../../errors";
import type { Logger } from "../../logger";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Маршрут ${req.method} ${req.path} не найден`));
};

const hasType = (err: unknown): err is { type: string } =>
  typeof err === "object" &&
  err !== null &&
  typeof (err as { type?: unknown }).type === "string";

/** Maps domain errors to HTTP responses; unexpected errors become a logged, generic 500. */
export function createErrorHandler(log: Logger): ErrorRequestHandler {
  return (err, req, res, _next) => {
    if (err instanceof AppError) {
      res.status(err.status).send({
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      });
      return;
    }
    // body-parser errors
    if (hasType(err) && err.type === "entity.parse.failed") {
      res.status(400).send({ message: "Некорректный JSON" });
      return;
    }
    if (hasType(err) && err.type === "entity.too.large") {
      res.status(413).send({ message: "Слишком большой запрос" });
      return;
    }

    log.error({ err, method: req.method, path: req.path }, "unhandled request error");
    res.status(500).send({ message: "Внутренняя ошибка сервера" });
  };
}

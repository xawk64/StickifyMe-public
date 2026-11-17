const { AppError, NotFoundError } = require("../errors");

const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Маршрут ${req.method} ${req.path} не найден`));
};

// Express recognises error handlers by their four arguments.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).send({
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }
  // body-parser errors
  if (err.type === "entity.parse.failed") {
    return res.status(400).send({ message: "Некорректный JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).send({ message: "Слишком большой запрос" });
  }

  console.error(`Unhandled error on ${req.method} ${req.path}:`, err);
  return res.status(500).send({ message: "Внутренняя ошибка сервера" });
};

module.exports = { notFoundHandler, errorHandler };

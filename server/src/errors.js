/** Error with an HTTP status that is safe to show to the client. */
class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(details) {
    super(400, "Некорректные данные запроса", details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Требуется авторизация") {
    super(401, message);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Не найдено") {
    super(404, message);
  }
}

module.exports = { AppError, ValidationError, UnauthorizedError, NotFoundError };

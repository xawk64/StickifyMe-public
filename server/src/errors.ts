export interface ValidationIssue {
  location: string;
  path: string;
  message: string;
}

/** Error with an HTTP status that is safe to show to the client. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(details: ValidationIssue[]) {
    super(400, "Некорректные данные запроса", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Требуется авторизация") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Доступ запрещён") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Не найдено") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

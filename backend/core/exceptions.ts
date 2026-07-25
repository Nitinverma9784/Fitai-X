export class FitAiError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, FitAiError.prototype);
  }
}

export class NotFoundError extends FitAiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends FitAiError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

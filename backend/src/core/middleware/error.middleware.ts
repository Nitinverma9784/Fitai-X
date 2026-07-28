import { Request, Response, NextFunction } from 'express';
import { FitAiError } from '../exceptions/exceptions';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`❌ Error details:`, err);

  if (err instanceof FitAiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Generic internal server error handler
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

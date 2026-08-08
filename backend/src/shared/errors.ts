import type { ErrorRequestHandler, RequestHandler } from 'express';

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (
  message: string,
  details?: Record<string, unknown>,
) => new AppError(400, 'BAD_REQUEST', message, details);

export const unauthorized = (message = 'Authentication is required.') =>
  new AppError(401, 'UNAUTHORIZED', message);

export const notFound = (message: string) =>
  new AppError(404, 'NOT_FOUND', message);

export const conflict = (message: string, details?: Record<string, unknown>) =>
  new AppError(409, 'CONFLICT', message, details);

export const rateLimited = () =>
  new AppError(429, 'RATE_LIMITED', 'Too many attempts. Try again later.');

export const asyncRoute =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(notFound('The requested resource was not found.'));
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Request body must contain valid JSON.',
        details: {},
      },
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  console.error('Unhandled API error', error);
  response.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
      details: {},
    },
  });
};

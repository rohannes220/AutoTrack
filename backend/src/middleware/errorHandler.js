import { AppError } from '../utils/AppError.js';

export function notFound(req, res, next) {
  next(new AppError(`Not found: ${req.method} ${req.originalUrl}`, 404));
}

// Express recognizes error handlers by their four-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = 500;
  if (err instanceof AppError) {
    statusCode = err.statusCode;
  } else if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
    // Errors raised by Express middleware, e.g. malformed JSON bodies.
    statusCode = err.status;
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  const message = statusCode >= 500 ? 'Internal server error' : err.message;
  res.status(statusCode).json({ error: { message } });
}

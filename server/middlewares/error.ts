import type { Request, Response, NextFunction } from "express";

// ── Custom error class ───────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ── Pre-built error factories ────────────────────────────────────────────────

export const Errors = {
  badRequest: (message = "Bad request") =>
    new AppError(message, 400, "BAD_REQUEST"),

  unauthorized: (message = "Unauthorized") =>
    new AppError(message, 401, "UNAUTHORIZED"),

  forbidden: (message = "Forbidden") =>
    new AppError(message, 403, "FORBIDDEN"),

  notFound: (message = "Not found") =>
    new AppError(message, 404, "NOT_FOUND"),

  conflict: (message = "Conflict") =>
    new AppError(message, 409, "CONFLICT"),

  tooLarge: (message = "Payload too large") =>
    new AppError(message, 413, "PAYLOAD_TOO_LARGE"),

  unprocessable: (message = "Unprocessable entity") =>
    new AppError(message, 422, "UNPROCESSABLE_ENTITY"),

  rateLimit: (message = "Too many requests") =>
    new AppError(message, 429, "RATE_LIMITED"),

  internal: (message = "Internal server error") =>
    new AppError(message, 500, "INTERNAL_ERROR", false),
};

// ── Multer error mapping ─────────────────────────────────────────────────────

function isMulterError(err: unknown): err is { code: string; message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as Record<string, unknown>).code === "string"
  );
}

function handleMulterError(err: { code: string; message: string }): AppError {
  switch (err.code) {
    case "LIMIT_FILE_SIZE":
      return Errors.tooLarge("File exceeds the maximum allowed size (50 MB)");
    case "LIMIT_FILE_COUNT":
      return Errors.badRequest("Too many files uploaded");
    case "LIMIT_UNEXPECTED_FILE":
      return Errors.badRequest("Unexpected file field");
    default:
      return Errors.badRequest(`Upload error: ${err.message}`);
  }
}

// ── 404 handler (unknown routes) ─────────────────────────────────────────────

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(Errors.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// ── Global error handler ─────────────────────────────────────────────────────

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Use a local variable to avoid parameter reassignment, which confuses TypeScript type narrowing
  let errorToHandle: Error = err;

  // Handle Multer-specific errors
  if (isMulterError(errorToHandle)) {
    errorToHandle = handleMulterError(errorToHandle);
  }

  // Determine status and response shape
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";
  let isOperational = false;
  const isAppError = errorToHandle instanceof AppError;

  if (errorToHandle instanceof AppError) {
    statusCode = errorToHandle.statusCode;
    code = errorToHandle.code;
    message = errorToHandle.message;
    isOperational = errorToHandle.isOperational;
  }

  // Log: full stack for unexpected errors, one-liner for operational ones
  if (!isOperational) {
    console.error("❌ Unexpected error:", errorToHandle);
  } else {
    console.warn(`⚠️  [${statusCode}] ${code}: ${message}`);
  }

  // Don't leak internal details in production
  const isDev = process.env.NODE_ENV !== "production";

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(isDev && !isAppError && { stack: errorToHandle.stack }),
    },
  });
}

// ── Async route wrapper (catches thrown/rejected errors automatically) ────────

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

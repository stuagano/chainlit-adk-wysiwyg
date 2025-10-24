/**
 * Error Handling Utilities
 *
 * Structured error types and error handling helpers
 */

/**
 * Base error class with additional context
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

/**
 * Network errors
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    public readonly url?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'NETWORK_ERROR', 503, { ...context, url });
    this.name = 'NetworkError';
  }
}

/**
 * API errors
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    context?: Record<string, unknown>
  ) {
    super(message, 'API_ERROR', statusCode, context);
    this.name = 'ApiError';
  }
}

/**
 * File system errors
 */
export class FileSystemError extends AppError {
  constructor(
    message: string,
    public readonly path?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'FILE_SYSTEM_ERROR', 500, { ...context, path });
    this.name = 'FileSystemError';
  }
}

/**
 * Process errors
 */
export class ProcessError extends AppError {
  constructor(
    message: string,
    public readonly exitCode?: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'PROCESS_ERROR', 500, { ...context, exitCode });
    this.name = 'ProcessError';
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends AppError {
  constructor(
    message: string,
    public readonly timeoutMs: number,
    context?: Record<string, unknown>
  ) {
    super(message, 'TIMEOUT_ERROR', 504, { ...context, timeoutMs });
    this.name = 'TimeoutError';
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard for Error objects
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Extract error stack from unknown error
 */
export function getErrorStack(error: unknown): string | undefined {
  if (isError(error)) {
    return error.stack;
  }
  return undefined;
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown, defaultMessage = 'An error occurred'): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (isError(error)) {
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  return new AppError(defaultMessage, 'UNKNOWN_ERROR', 500, {
    originalError: String(error),
  });
}

/**
 * Error logger with structured output
 */
export interface ErrorLogContext {
  component?: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export function logError(error: unknown, context?: ErrorLogContext): void {
  const timestamp = new Date().toISOString();
  const appError = toAppError(error);

  const logEntry = {
    timestamp,
    level: 'ERROR',
    name: appError.name,
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    context: { ...appError.context, ...context },
    stack: appError.stack,
  };

  console.error(JSON.stringify(logEntry, null, 2));
}

/**
 * Async error wrapper
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: ErrorLogContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error, context);
    throw toAppError(error);
  }
}

/**
 * Sync error wrapper
 */
export function withErrorHandlingSync<T>(
  operation: () => T,
  context?: ErrorLogContext
): T {
  try {
    return operation();
  } catch (error) {
    logError(error, context);
    throw toAppError(error);
  }
}

/**
 * Safe async operation that returns Result type
 */
export type Result<T, E = AppError> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: ErrorLogContext
): Promise<Result<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    logError(error, context);
    return { success: false, error: toAppError(error) };
  }
}

/**
 * Safe sync operation that returns Result type
 */
export function safe<T>(
  operation: () => T,
  context?: ErrorLogContext
): Result<T> {
  try {
    const data = operation();
    return { success: true, data };
  } catch (error) {
    logError(error, context);
    return { success: false, error: toAppError(error) };
  }
}

/**
 * Retry with exponential backoff
 */
export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      const delayMs = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );

      if (onRetry) {
        onRetry(error, attempt, delayMs);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Error Handling Tests
 *
 * Tests for error utilities and error handling functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AppError,
  ValidationError,
  NetworkError,
  ApiError,
  FileSystemError,
  ProcessError,
  TimeoutError,
  isAppError,
  isError,
  getErrorMessage,
  getErrorStack,
  toAppError,
  retry,
} from '../utils/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with all properties', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400, { foo: 'bar' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.context).toEqual({ foo: 'bar' });
      expect(error.name).toBe('AppError');
    });

    it('should default to 500 status code', () => {
      const error = new AppError('Test error', 'TEST_CODE');

      expect(error.statusCode).toBe(500);
    });

    it('should serialize to JSON', () => {
      const error = new AppError('Test error', 'TEST_CODE', 400, { foo: 'bar' });
      const json = error.toJSON();

      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_CODE');
      expect(json.statusCode).toBe(400);
      expect(json.context).toEqual({ foo: 'bar' });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.context).toEqual({ field: 'email' });
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('NetworkError', () => {
    it('should create network error with URL', () => {
      const error = new NetworkError('Connection failed', 'https://example.com');

      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBe(503);
      expect(error.url).toBe('https://example.com');
      expect(error.context?.url).toBe('https://example.com');
    });
  });

  describe('ApiError', () => {
    it('should create API error with custom status', () => {
      const error = new ApiError('Not found', 404, { resource: 'user' });

      expect(error.message).toBe('Not found');
      expect(error.code).toBe('API_ERROR');
      expect(error.statusCode).toBe(404);
      expect(error.context).toEqual({ resource: 'user' });
    });
  });

  describe('FileSystemError', () => {
    it('should create file system error with path', () => {
      const error = new FileSystemError('Permission denied', '/tmp/file.txt');

      expect(error.message).toBe('Permission denied');
      expect(error.code).toBe('FILE_SYSTEM_ERROR');
      expect(error.path).toBe('/tmp/file.txt');
      expect(error.context?.path).toBe('/tmp/file.txt');
    });
  });

  describe('ProcessError', () => {
    it('should create process error with exit code', () => {
      const error = new ProcessError('Process failed', 1, { command: 'npm test' });

      expect(error.message).toBe('Process failed');
      expect(error.code).toBe('PROCESS_ERROR');
      expect(error.exitCode).toBe(1);
      expect(error.context?.exitCode).toBe(1);
      expect(error.context?.command).toBe('npm test');
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error with duration', () => {
      const error = new TimeoutError('Request timed out', 5000, { url: 'https://example.com' });

      expect(error.message).toBe('Request timed out');
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.statusCode).toBe(504);
      expect(error.timeoutMs).toBe(5000);
      expect(error.context?.timeoutMs).toBe(5000);
    });
  });
});

describe('Error Type Guards', () => {
  it('should identify AppError instances', () => {
    const appError = new AppError('Test', 'TEST');
    const regularError = new Error('Test');

    expect(isAppError(appError)).toBe(true);
    expect(isAppError(regularError)).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
  });

  it('should identify Error instances', () => {
    const error = new Error('Test');
    const appError = new AppError('Test', 'TEST');

    expect(isError(error)).toBe(true);
    expect(isError(appError)).toBe(true);
    expect(isError('string')).toBe(false);
    expect(isError(null)).toBe(false);
  });
});

describe('Error Message Extraction', () => {
  it('should extract message from Error', () => {
    const error = new Error('Test message');
    expect(getErrorMessage(error)).toBe('Test message');
  });

  it('should extract message from AppError', () => {
    const error = new AppError('App error message', 'TEST');
    expect(getErrorMessage(error)).toBe('App error message');
  });

  it('should handle string errors', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('should handle objects with message property', () => {
    expect(getErrorMessage({ message: 'Object error' })).toBe('Object error');
  });

  it('should handle unknown error types', () => {
    expect(getErrorMessage(null)).toBe('An unknown error occurred');
    expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
    expect(getErrorMessage(123)).toBe('An unknown error occurred');
  });
});

describe('Error Stack Extraction', () => {
  it('should extract stack from Error', () => {
    const error = new Error('Test');
    const stack = getErrorStack(error);

    expect(stack).toBeDefined();
    expect(stack).toContain('Error: Test');
  });

  it('should return undefined for non-errors', () => {
    expect(getErrorStack('string')).toBeUndefined();
    expect(getErrorStack(null)).toBeUndefined();
  });
});

describe('Error Conversion', () => {
  it('should return AppError as-is', () => {
    const appError = new AppError('Test', 'TEST');
    const result = toAppError(appError);

    expect(result).toBe(appError);
  });

  it('should convert Error to AppError', () => {
    const error = new Error('Test message');
    const result = toAppError(error);

    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Test message');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.context?.originalError).toBe('Error');
  });

  it('should convert unknown types to AppError', () => {
    const result = toAppError('string error');

    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('An error occurred');
    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.context?.originalError).toBe('string error');
  });

  it('should use custom default message', () => {
    const result = toAppError('error', 'Custom default message');

    expect(result.message).toBe('Custom default message');
  });
});

describe('Retry Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const promise = retry(operation);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Attempt 1'))
      .mockRejectedValueOnce(new Error('Attempt 2'))
      .mockResolvedValue('success');

    const promise = retry(operation, { maxAttempts: 3 });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should fail after max attempts', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Always fails'));

    const promise = retry(operation, { maxAttempts: 3 });
    vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('Always fails');

    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should respect shouldRetry callback', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Fail'));
    const shouldRetry = vi.fn().mockReturnValue(false);

    await expect(retry(operation, { maxAttempts: 3, shouldRetry })).rejects.toThrow('Fail');

    expect(operation).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry callback', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Attempt 1'))
      .mockResolvedValue('success');
    const onRetry = vi.fn();

    const promise = retry(operation, { maxAttempts: 3, onRetry });
    await vi.runAllTimersAsync();
    await promise;

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(
      expect.any(Error),
      1,
      expect.any(Number)
    );
  });

  it('should use exponential backoff', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Attempt 1'))
      .mockRejectedValueOnce(new Error('Attempt 2'))
      .mockResolvedValue('success');

    const delays: number[] = [];
    const onRetry = vi.fn((_, __, delay) => {
      delays.push(delay);
    });

    const promise = retry(operation, {
      maxAttempts: 3,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
      onRetry,
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(delays).toEqual([1000, 2000]);
  });

  it('should respect max delay', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Attempt 1'))
      .mockRejectedValueOnce(new Error('Attempt 2'))
      .mockResolvedValue('success');

    const delays: number[] = [];
    const onRetry = vi.fn((_, __, delay) => {
      delays.push(delay);
    });

    const promise = retry(operation, {
      maxAttempts: 3,
      initialDelayMs: 5000,
      maxDelayMs: 8000,
      backoffMultiplier: 2,
      onRetry,
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(delays).toEqual([5000, 8000]); // Second delay capped at maxDelayMs
  });
});

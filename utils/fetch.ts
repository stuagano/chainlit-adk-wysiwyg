/**
 * Fetch Utilities
 *
 * Enhanced fetch with timeout, retry logic, and error handling
 */

import { NetworkError, TimeoutError, ApiError, retry, type RetryOptions } from './errors';

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryOptions?: Partial<RetryOptions>;
}

/**
 * Fetch with timeout support using AbortController
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(
        `Request to ${url} timed out after ${timeout}ms`,
        timeout,
        { url }
      );
    }

    throw new NetworkError(
      `Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      url,
      { originalError: error }
    );
  }
}

/**
 * Determine if an error should trigger a retry
 */
function shouldRetryRequest(error: unknown, attempt: number): boolean {
  // Don't retry on validation errors (4xx except 408, 429)
  if (error instanceof ApiError) {
    const status = error.statusCode;
    if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
      return false;
    }
  }

  // Retry on network errors and timeouts
  if (error instanceof NetworkError || error instanceof TimeoutError) {
    return true;
  }

  // Retry on 5xx server errors
  if (error instanceof ApiError && error.statusCode >= 500) {
    return true;
  }

  return false;
}

/**
 * Enhanced fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    retryOptions = {},
    timeout = 10000,
    ...fetchOptions
  } = options;

  return retry(
    async () => {
      const response = await fetchWithTimeout(url, {
        ...fetchOptions,
        timeout,
      });

      // Check for HTTP errors
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          { url, method: fetchOptions.method || 'GET' }
        );
      }

      return response;
    },
    {
      maxAttempts: retries,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
      shouldRetry: shouldRetryRequest,
      onRetry: (error, attempt, delayMs) => {
        console.warn(
          `Retrying request to ${url} (attempt ${attempt}/${retries}) after ${delayMs}ms:`,
          error instanceof Error ? error.message : String(error)
        );
      },
      ...retryOptions,
    }
  );
}

/**
 * Fetch and parse JSON with validation
 */
export async function fetchJson<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, options);

  try {
    const data = await response.json();
    return data as T;
  } catch (error) {
    throw new ApiError(
      `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      response.status,
      { url, originalError: error }
    );
  }
}

/**
 * POST JSON data with proper error handling
 */
export async function postJson<TRequest, TResponse>(
  url: string,
  data: TRequest,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<TResponse> {
  return fetchJson<TResponse>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
  });
}

/**
 * GET JSON data with proper error handling
 */
export async function getJson<TResponse>(
  url: string,
  options: Omit<FetchOptions, 'method'> = {}
): Promise<TResponse> {
  return fetchJson<TResponse>(url, {
    ...options,
    method: 'GET',
  });
}

/**
 * Health check utility
 */
export async function healthCheck(
  url: string,
  timeoutMs: number = 5000
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      timeout: timeoutMs,
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Wait for service to be available
 */
export async function waitForService(
  url: string,
  options: {
    maxWaitMs?: number;
    checkIntervalMs?: number;
    onCheck?: (attempt: number) => void;
  } = {}
): Promise<boolean> {
  const {
    maxWaitMs = 30000,
    checkIntervalMs = 1000,
    onCheck,
  } = options;

  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < maxWaitMs) {
    attempt++;
    if (onCheck) {
      onCheck(attempt);
    }

    const isHealthy = await healthCheck(url, checkIntervalMs);
    if (isHealthy) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
  }

  return false;
}

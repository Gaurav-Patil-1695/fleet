/**
 * errorUtils.ts
 * API error parsing and user-facing message extraction.
 *
 * The backend returns errors in the shape: { code: string; message: string; details?: unknown }
 * This module parses that shape and extracts a user-facing message.
 */

import type { ApiError } from '../types/common';

/**
 * Type guard — returns true when the value matches the Error envelope shape.
 */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as Record<string, unknown>).code === 'string' &&
    typeof (value as Record<string, unknown>).message === 'string'
  );
}

/**
 * Extract a user-facing message from an unknown error value.
 *
 * Priority:
 * 1. If the error is an ApiError envelope ({ code, message }), return message.
 * 2. If the error is a standard Error instance, return its message.
 * 3. If the error is a plain string, return it.
 * 4. Fall back to the provided fallback string (defaults to a generic message).
 */
export function extractErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred. Please try again.',
): string {
  if (isApiError(error)) {
    return error.message;
  }

  // Axios / fetch responses often nest the body under response.data
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as Record<string, unknown>).response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = (response as Record<string, unknown>).data;
      if (isApiError(data)) {
        return data.message;
      }
      if (typeof data === 'string' && data.trim().length > 0) {
        return data;
      }
    }
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

/**
 * Extract the error code from an unknown error value.
 * Returns null if no code can be determined.
 */
export function extractErrorCode(error: unknown): string | null {
  if (isApiError(error)) {
    return error.code;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as Record<string, unknown>).response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = (response as Record<string, unknown>).data;
      if (isApiError(data)) {
        return data.code;
      }
    }
  }

  return null;
}

/**
 * Extract optional details from an unknown error value.
 * Returns null if no details are present.
 */
export function extractErrorDetails(error: unknown): unknown {
  if (isApiError(error)) {
    return error.details ?? null;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as Record<string, unknown>).response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = (response as Record<string, unknown>).data;
      if (isApiError(data)) {
        return data.details ?? null;
      }
    }
  }

  return null;
}

/**
 * Returns true when the error represents an HTTP 401 Unauthorized response.
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as Record<string, unknown>).response;
    if (typeof response === 'object' && response !== null && 'status' in response) {
      return (response as Record<string, unknown>).status === 401;
    }
  }
  return false;
}

/**
 * Returns true when the error represents an HTTP 403 Forbidden response.
 */
export function isForbiddenError(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as Record<string, unknown>).response;
    if (typeof response === 'object' && response !== null && 'status' in response) {
      return (response as Record<string, unknown>).status === 403;
    }
  }
  return false;
}

/**
 * Returns true when the error represents an HTTP 404 Not Found response.
 */
export function isNotFoundError(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as Record<string, unknown>).response;
    if (typeof response === 'object' && response !== null && 'status' in response) {
      return (response as Record<string, unknown>).status === 404;
    }
  }
  return false;
}

/**
 * Returns true when the error is a network/connection failure (no response received).
 */
export function isNetworkError(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    // If there IS a response, it's not a pure network error
    const response = (error as Record<string, unknown>).response;
    return response === undefined || response === null;
  }
  // A fetch TypeError with no response property is a network error
  if (error instanceof TypeError) {
    return true;
  }
  return false;
}

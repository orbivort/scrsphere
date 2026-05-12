/**
 * Mock Response Utility Helpers
 *
 * Utility functions for creating mock API responses that match the API response format.
 * These helpers are useful for testing and prototyping without a real backend.
 */

import type { ApiResponse, PaginatedResponse } from '../types';

/**
 * Creates a successful API response with the provided data.
 *
 * @param data - The data to include in the response
 * @returns An ApiResponse with success: true and the provided data
 *
 * @example
 * const response = mockSuccess({ id: '1', name: 'Test' });
 * // Returns: { success: true, data: { id: '1', name: 'Test' } }
 */
export function mockSuccess<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates an error API response with the provided code and message.
 *
 * @param code - The error code (e.g., 'NOT_FOUND', 'VALIDATION_ERROR')
 * @param message - The error message describing what went wrong
 * @returns An ApiResponse with success: false and the error details
 *
 * @example
 * const response = mockError('NOT_FOUND', 'User not found');
 * // Returns: { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }
 */
export function mockError(code: string, message: string): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

/**
 * Creates a paginated API response with the provided data and pagination metadata.
 *
 * @param data - The array of items for the current page
 * @param page - The current page number (1-based)
 * @param limit - The number of items per page
 * @returns A PaginatedResponse with success: true, data, and pagination metadata
 *
 * @example
 * const items = [{ id: '1' }, { id: '2' }];
 * const response = mockPaginated(items, 1, 10);
 * // Returns: { success: true, data: items, pagination: { page: 1, limit: 10, total: 2, totalPages: 1 } }
 */
export function mockPaginated<T>(data: T[], page: number, limit: number): PaginatedResponse<T> {
  const total = data.length;
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Creates a promise that resolves after a specified delay.
 * Useful for simulating network latency in mock implementations.
 *
 * @param ms - The number of milliseconds to wait (default: 300ms)
 * @returns A promise that resolves after the specified delay
 *
 * @example
 * await mockDelay(); // Waits 300ms
 * await mockDelay(500); // Waits 500ms
 */
export function mockDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

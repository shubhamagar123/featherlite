import { Application } from 'express';
import { createApp } from '@/app';
import request from 'supertest';

/**
 * Test utilities for API integration testing.
 * Provides common setup, teardown, and helper functions.
 */

let app: Application | null = null;

/**
 * Initialize the Express app once for the test suite.
 * Returns the app instance and a request helper.
 */
export async function setupApp() {
  if (!app) {
    app = await createApp();
  }
  return app;
}

/**
 * Reset the app between tests (if needed).
 */
export async function resetApp() {
  app = null;
}

/**
 * Create a request instance bound to the test app.
 */
export async function createRequest() {
  const testApp = await setupApp();
  return request(testApp);
}

/**
 * Helper to make authenticated requests.
 * Returns a request with Authorization header set.
 */
export async function createAuthenticatedRequest(token: string = 'test-token-12345') {
  const req = await createRequest();
  return req.set('Authorization', `Bearer ${token}`);
}

/**
 * Mock user context for authenticated requests.
 */
export const mockUser = {
  uid: 'test-user-id-123',
  email: 'test@example.com',
  name: 'Test User',
};

/**
 * Mock companion context.
 */
export const mockCompanion = {
  companionId: 'test-companion-id-456',
  userId: mockUser.uid,
  name: 'Test Companion',
};

/**
 * Standard assertions for API responses.
 */
export const assertApiResponse = {
  /**
   * Assert successful response with data.
   */
  success(response: any, expectedStatus: number = 200) {
    return {
      hasStatus: () => {
        expect(response.status).toBe(expectedStatus);
        return this;
      },
      hasData: () => {
        expect(response.body).toHaveProperty('data');
        return this;
      },
      hasRequestId: () => {
        expect(response.body).toHaveProperty('requestId');
        return this;
      },
      returns: (data: any) => {
        expect(response.body.data).toEqual(data);
        return this;
      },
      matches: (fn: (data: any) => boolean) => {
        expect(fn(response.body.data)).toBe(true);
        return this;
      },
    };
  },

  /**
   * Assert error response.
   */
  error(response: any, expectedStatus: number = 400) {
    return {
      hasStatus: () => {
        expect(response.status).toBe(expectedStatus);
        return this;
      },
      hasMessage: () => {
        expect(response.body).toHaveProperty('message');
        return this;
      },
      hasError: () => {
        expect(response.body).toHaveProperty('error');
        return this;
      },
      messageContains: (substring: string) => {
        expect(response.body.message).toContain(substring);
        return this;
      },
    };
  },

  /**
   * Assert paginated response.
   */
  paginated(response: any) {
    return {
      hasPagination: () => {
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.pagination).toHaveProperty('page');
        expect(response.body.pagination).toHaveProperty('limit');
        expect(response.body.pagination).toHaveProperty('total');
        return this;
      },
      hasItems: () => {
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        return this;
      },
      itemCount: (expected: number) => {
        expect(response.body.data.length).toBe(expected);
        return this;
      },
    };
  },
};

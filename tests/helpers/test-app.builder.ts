/**
 * Test Application Builder
 * Creates Express app with test configuration for API testing
 */

import express from 'express';
import { Application } from 'express';
import { errorHandlerApplicationMiddleware, notFoundHandlerApplicationMiddleware } from '@middleware/error-handler.application';
import { registerV1Routes } from '@routes/v1';

export class TestAppBuilder {
  private app: Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = req.headers['x-request-id'] as string || `test-${Date.now()}`;
      next();
    });
  }

  addAuthMiddleware(): this {
    this.app.use((req, res, next) => {
      // Mock authentication for testing
      if (req.headers.authorization) {
        const token = req.headers.authorization.replace('Bearer ', '');
        (req as any).user = {
          uid: req.headers['x-test-user-id'] || 'test-user-1',
          email: 'test@example.com',
          customClaims: {
            roles: ['USER'],
          },
        };
      }
      next();
    });
    return this;
  }

  addRoutes(): this {
    registerV1Routes(this.app);
    return this;
  }

  addErrorHandling(): this {
    this.app.use(notFoundHandlerApplicationMiddleware);
    this.app.use(errorHandlerApplicationMiddleware);
    return this;
  }

  build(): Application {
    this.addAuthMiddleware();
    this.addRoutes();
    this.addErrorHandling();
    return this.app;
  }
}

export function createTestApp(): Application {
  return new TestAppBuilder().build();
}

import { Request, Response } from 'express';
import { ControllerBase } from './controller.base';
import { AuthApplicationService } from '@application/services/auth.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import {
  firebaseTokenSchema,
  refreshTokenSchema,
  validate,
} from '@application/validators/application.validators';
import { asyncHandler } from '@api/index';

/**
 * Auth Controller
 * Handles authentication endpoints
 * IMPORTANT: No business logic here!
 */
export class AuthController extends ControllerBase {
  private readonly authService: AuthApplicationService;

  constructor() {
    super('AuthController');
    this.authService = new AuthApplicationService();
  }

  /**
   * POST /api/v1/auth/session
   * Create session from Firebase token
   */
  createSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('POST', '/api/v1/auth/session', { traceId });

    try {
      // 1. VALIDATE input (validates token exists and is valid)
      validate<{ token: string }>(req.body, firebaseTokenSchema);

      // 2. Get user context
      const user = (req.user as any);
      if (!user) {
        this.error(res, new Error('UNAUTHENTICATED'), traceId);
        return;
      }

      const context: ApplicationContext = {
        userId: user.uid,
        userEmail: user.email,
        userRoles: user.customClaims?.roles || [],
        requestId: traceId,
        traceId,
        timestamp: new Date(),
      };

      // 3. CALL service (business logic is here)
      const authToken = await this.authService.createSession(context);

      // 4. RETURN response
      // token variable is validated above, used only to verify it exists
      this.success(res, authToken, traceId, 201);
    } catch (error) {
      this.logRequestError('POST', '/api/v1/auth/session', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * POST /api/v1/auth/logout
   * End session (requires authentication)
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('POST', '/api/v1/auth/logout', { traceId });

    try {
      const user = (req.user as any);
      if (!user) {
        this.error(res, new Error('UNAUTHENTICATED'), traceId);
        return;
      }

      const context: ApplicationContext = {
        userId: user.uid,
        userEmail: user.email,
        userRoles: user.customClaims?.roles || [],
        requestId: traceId,
        traceId,
        timestamp: new Date(),
      };

      // Call service
      await this.authService.logout(context);

      this.success(res, { success: true, message: 'Logged out successfully' }, traceId);
    } catch (error) {
      this.logRequestError('POST', '/api/v1/auth/logout', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/auth/me
   * Get current user profile (requires authentication)
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/auth/me', { traceId });

    try {
      const user = (req.user as any);
      if (!user) {
        this.error(res, new Error('UNAUTHENTICATED'), traceId);
        return;
      }

      const context: ApplicationContext = {
        userId: user.uid,
        userEmail: user.email,
        userRoles: user.customClaims?.roles || [],
        requestId: traceId,
        traceId,
        timestamp: new Date(),
      };

      // Call service
      const userProfile = await this.authService.getCurrentUser(context);

      this.success(res, userProfile, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/auth/me', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('POST', '/api/v1/auth/refresh', { traceId });

    try {
      const { refreshToken: token } = validate<{ refreshToken: string }>(req.body, refreshTokenSchema);

      const user = (req.user as any);
      if (!user) {
        this.error(res, new Error('UNAUTHENTICATED'), traceId);
        return;
      }

      const context: ApplicationContext = {
        userId: user.uid,
        userEmail: user.email,
        userRoles: user.customClaims?.roles || [],
        requestId: traceId,
        traceId,
        timestamp: new Date(),
      };

      // Call service
      const newToken = await this.authService.refreshToken(context, token);

      this.success(res, newToken, traceId);
    } catch (error) {
      this.logRequestError('POST', '/api/v1/auth/refresh', error, { traceId });
      this.error(res, error, traceId);
    }
  });
}

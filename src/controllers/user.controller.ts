import { Request, Response } from 'express';
import { ControllerBase } from './controller.base';
import { UserApplicationService } from '@application/services/user.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import {
  updateUserSchema,
  uuidSchema,
  validate,
} from '@application/validators/application.validators';
import { asyncHandler } from '@api/index';

/**
 * User Controller
 * Handles user profile and preference endpoints
 * IMPORTANT: No business logic here!
 */
export class UserController extends ControllerBase {
  private readonly userService: UserApplicationService;

  constructor() {
    super('UserController');
    this.userService = new UserApplicationService();
  }

  /**
   * GET /api/v1/users/profile
   * Get current user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/users/profile', { traceId });

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

      const profile = await this.userService.getProfile(context);
      this.success(res, profile, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/users/profile', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * PATCH /api/v1/users/profile
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('PATCH', '/api/v1/users/profile', { traceId });

    try {
      const data = validate(req.body, updateUserSchema);

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

      const updated = await this.userService.updateProfile(context, data);
      this.success(res, updated, traceId);
    } catch (error) {
      this.logRequestError('PATCH', '/api/v1/users/profile', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/users/preferences
   * Get user preferences
   */
  getPreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/users/preferences', { traceId });

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

      const preferences = await this.userService.getPreferences(context);
      this.success(res, preferences, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/users/preferences', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * PATCH /api/v1/users/preferences
   * Update user preferences
   */
  updatePreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('PATCH', '/api/v1/users/preferences', { traceId });

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

      const preferences = await this.userService.updatePreferences(context, req.body);
      this.success(res, preferences, traceId);
    } catch (error) {
      this.logRequestError('PATCH', '/api/v1/users/preferences', error, { traceId });
      this.error(res, error, traceId);
    }
  });
}

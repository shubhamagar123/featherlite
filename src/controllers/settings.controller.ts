import { Request, Response } from 'express';
import { ControllerBase } from './controller.base';
import { SettingsApplicationService } from '@application/services/settings.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { asyncHandler } from '@utils/asyncHandler';

/**
 * Settings Controller
 * Handles settings endpoints
 * IMPORTANT: No business logic here!
 */
export class SettingsController extends ControllerBase {
  private readonly settingsService: SettingsApplicationService;

  constructor() {
    super('SettingsController');
    this.settingsService = new SettingsApplicationService();
  }

  /**
   * GET /api/v1/settings
   * Get all settings
   */
  getAllSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/settings', { traceId });

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

      const settings = await this.settingsService.getAllSettings(context);
      this.success(res, settings, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/settings', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * PATCH /api/v1/settings/general
   * Update general settings
   */
  updateGeneral = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('PATCH', '/api/v1/settings/general', { traceId });

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

      const settings = await this.settingsService.updateGeneralSettings(context, req.body);
      this.success(res, settings, traceId);
    } catch (error) {
      this.logRequestError('PATCH', '/api/v1/settings/general', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * PATCH /api/v1/settings/privacy
   * Update privacy settings
   */
  updatePrivacy = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('PATCH', '/api/v1/settings/privacy', { traceId });

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

      const settings = await this.settingsService.updatePrivacySettings(context, req.body);
      this.success(res, settings, traceId);
    } catch (error) {
      this.logRequestError('PATCH', '/api/v1/settings/privacy', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * PATCH /api/v1/settings/notifications
   * Update notification settings
   */
  updateNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('PATCH', '/api/v1/settings/notifications', { traceId });

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

      const settings = await this.settingsService.updateNotificationSettings(context, req.body);
      this.success(res, settings, traceId);
    } catch (error) {
      this.logRequestError('PATCH', '/api/v1/settings/notifications', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * PATCH /api/v1/settings/companion
   * Update companion settings
   */
  updateCompanion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('PATCH', '/api/v1/settings/companion', { traceId });

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

      const settings = await this.settingsService.updateCompanionSettings(context, req.body);
      this.success(res, settings, traceId);
    } catch (error) {
      this.logRequestError('PATCH', '/api/v1/settings/companion', error, { traceId });
      this.error(res, error, traceId);
    }
  });
}

import { Request, Response } from 'express';
import { ControllerBase } from './controller.base';
import { InteractionApplicationService } from '@application/services/interaction.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { validate, uuidSchema } from '@application/validators/application.validators';
import { asyncHandler } from '@utils/asyncHandler';
import { z } from 'zod';

/**
 * Interaction Controller
 * Handles conversation and interaction endpoints
 * IMPORTANT: No business logic here!
 */
export class InteractionController extends ControllerBase {
  private readonly interactionService: InteractionApplicationService;

  constructor() {
    super('InteractionController');
    this.interactionService = new InteractionApplicationService();
  }

  /**
   * POST /api/v1/interactions/start
   * Start new interaction
   */
  startInteraction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('POST', '/api/v1/interactions/start', { traceId });

    try {
      const schema = z.object({
        companionId: uuidSchema,
        input: z.string().min(1).max(5000),
      });
      const { companionId, input } = validate<{ companionId: string; input: string }>(req.body, schema);

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

      const result = await this.interactionService.startInteraction(
        context,
        companionId,
        input
      );
      this.success(res, result, traceId, 201);
    } catch (error) {
      this.logRequestError('POST', '/api/v1/interactions/start', error, { traceId });
      this.error(res, error, traceId);
    }
  });

  /**
   * POST /api/v1/conversations/:conversationId/continue
   * Continue existing interaction
   */
  continueInteraction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('POST', '/api/v1/conversations/:conversationId/continue', { traceId });

    try {
      const { conversationId } = req.params;
      validate({ conversationId }, z.object({ conversationId: uuidSchema }));

      const schema = z.object({
        input: z.string().min(1).max(5000),
      });
      const { input } = validate<{ input: string }>(req.body, schema);

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

      const result = await this.interactionService.continueInteraction(
        context,
        conversationId,
        input
      );
      this.success(res, result, traceId);
    } catch (error) {
      this.logRequestError('POST', '/api/v1/conversations/:conversationId/continue', error, {
        traceId,
      });
      this.error(res, error, traceId);
    }
  });

  /**
   * GET /api/v1/conversations/:conversationId/history
   * Get conversation history
   */
  getConversationHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const traceId = this.getTraceId(req);
    this.logRequest('GET', '/api/v1/conversations/:conversationId/history', { traceId });

    try {
      const { conversationId } = req.params;
      validate({ conversationId }, z.object({ conversationId: uuidSchema }));

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

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

      const history = await this.interactionService.getConversationHistory(
        context,
        conversationId,
        limit
      );
      this.success(res, { messages: history, count: history.length }, traceId);
    } catch (error) {
      this.logRequestError('GET', '/api/v1/conversations/:conversationId/history', error, {
        traceId,
      });
      this.error(res, error, traceId);
    }
  });
}

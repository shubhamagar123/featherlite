import { Request, Response } from 'express';
import { z } from 'zod';
import { ConversationApplicationService } from '@application/services/conversation.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { validate } from '@application/validators/application.validators';
import { asyncHandler } from '@api/index';
import { sendOk } from '@utils/response';
import { UnauthorizedError } from '@utils/error';
import { createLogger } from '@utils/logger';

const conversationIdParamSchema = z.object({
  id: z.string().min(1, 'Conversation id is required'),
});

const sendMessageBodySchema = z.object({
  message: z.string().min(1).max(5000),
  messageId: z.string().min(1).optional(),
});

/**
 * Conversation Controller
 * Handles sending a message (delegates to the Conversation Engine) and the
 * live conversation-state event stream (SSE). No business logic here.
 */
export class ConversationController {
  private readonly logger = createLogger('ConversationController');
  private readonly conversationService = new ConversationApplicationService();

  /**
   * POST /api/v1/conversations/:id/messages
   * Send a message on an existing conversation. Delegates entirely to the
   * Conversation Engine, which owns context assembly, prompt building, the
   * LLM call, and the memory-consent flow.
   */
  sendMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info(
      { method: 'POST', path: '/api/v1/conversations/:id/messages' },
      'POST /api/v1/conversations/:id/messages'
    );

    const { id } = validate<{ id: string }>(req.params, conversationIdParamSchema);
    const { message, messageId } = validate<{ message: string; messageId?: string }>(
      req.body,
      sendMessageBodySchema
    );

    const user = req.user;
    if (!user) {
      throw new UnauthorizedError();
    }

    const context: ApplicationContext = {
      userId: user.uid,
      userEmail: user.email,
      userRoles: (user.customClaims?.roles as string[]) || [],
      requestId: String(req.id ?? ''),
      traceId: String(req.id ?? ''),
      timestamp: new Date(),
    };

    const result = await this.conversationService.sendMessage(context, id, message, messageId);

    sendOk(res, result);
  });

  /**
   * GET /api/v1/conversations/:id/events
   * Server-Sent Events stream of live conversation state:
   * kai:speaking_start, kai:speaking_end, video:state_change.
   */
  streamEvents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info(
      { method: 'GET', path: '/api/v1/conversations/:id/events' },
      'GET /api/v1/conversations/:id/events'
    );

    const { id } = validate<{ id: string }>(req.params, conversationIdParamSchema);

    const user = req.user;
    if (!user) {
      throw new UnauthorizedError();
    }

    // Ownership check happens before any SSE headers are written, so a
    // rejection here still flows through the normal JSON error handler.
    await this.conversationService.assertConversationAccess(user.uid, id);

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Comment line keeps some proxies from buffering the stream closed.
    res.write(': connected\n\n');

    const unsubscribe = this.conversationService.subscribeToLiveEvents(id, (event) => {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    });

    const cleanup = (): void => {
      unsubscribe();
    };
    req.on('close', cleanup);
  });
}

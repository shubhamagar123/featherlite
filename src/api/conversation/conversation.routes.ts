import type { Application, Request, Response } from 'express';
import { z } from 'zod';
import {
  authenticate,
  validate,
  commonSchemas,
  asyncHandler,
  rateLimiters,
} from '@middleware/index';
import { successResponse, paginatedResponse } from '@api/index';
import { logger } from '@utils/logger';

/**
 * Conversation API Routes
 * POST   /api/v1/conversation/session           - Start new conversation session
 * GET    /api/v1/conversation/:sessionId        - Get conversation details
 * GET    /api/v1/conversation/:sessionId/stream - Stream response (SSE)
 * POST   /api/v1/conversation/:sessionId/message - Send message to companion
 * GET    /api/v1/conversation                   - List conversations
 * DELETE /api/v1/conversation/:sessionId        - End/delete conversation
 */

const createSessionSchema = z.object({
  body: z.object({
    companionId: commonSchemas.uuid,
    initialMessage: z.string().optional(),
  }),
});

const sendMessageSchema = z.object({
  params: z.object({
    sessionId: commonSchemas.uuid,
  }),
  body: z.object({
    message: z.string().min(1).max(5000),
  }),
});

const sessionIdSchema = z.object({
  params: z.object({
    sessionId: commonSchemas.uuid,
  }),
});

const listConversationsSchema = z.object({
  query: commonSchemas.pagination.extend({
    companionId: commonSchemas.uuid.optional(),
  }),
});

export async function registerConversationRoutes(app: Application): Promise<void> {
  const baseRoute = '/api/v1/conversation';

  /**
   * POST /api/v1/conversation/session
   * Create a new conversation session
   */
  app.post(
    `${baseRoute}/session`,
    authenticate,
    rateLimiters.chat,
    validate(createSessionSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { companionId, initialMessage } = req.body;

      try {
        // TODO: Create ConversationSession via ConversationService
        const sessionId = `sess_${Date.now()}`;

        logger.info(
          { userId, companionId, sessionId },
          'Conversation session created'
        );

        const session = {
          sessionId,
          userId,
          companionId,
          createdAt: new Date().toISOString(),
          messages: initialMessage
            ? [
                {
                  role: 'user' as const,
                  content: initialMessage,
                  timestamp: new Date().toISOString(),
                },
              ]
            : [],
        };

        res.status(201).json(successResponse(session, String(req.id)));
      } catch (error) {
        logger.error({ error, userId }, 'Failed to create conversation session');
        throw error;
      }
    })
  );

  /**
   * GET /api/v1/conversation/:sessionId
   * Get conversation session details
   */
  app.get(
    `${baseRoute}/:sessionId`,
    authenticate,
    rateLimiters.api,
    validate(sessionIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { sessionId } = req.params;

      try {
        // TODO: Query ConversationRepository
        const session = {
          sessionId,
          userId,
          companionId: 'companion_id',
          createdAt: new Date().toISOString(),
          messages: [],
        };

        res.status(200).json(successResponse(session, String(req.id)));
      } catch (error) {
        logger.error({ error, userId, sessionId }, 'Failed to get conversation');
        throw error;
      }
    })
  );

  /**
   * POST /api/v1/conversation/:sessionId/message
   * Send a message in the conversation
   */
  app.post(
    `${baseRoute}/:sessionId/message`,
    authenticate,
    rateLimiters.chat,
    validate(sendMessageSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { sessionId } = req.params;
      const { message } = req.body;

      try {
        // TODO: Process message via ConversationService
        // This should:
        // 1. Add user message to conversation
        // 2. Call LLM to generate response
        // 3. Store response in database
        // 4. Return response

        const response = {
          userMessage: {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
          },
          companionResponse: {
            role: 'assistant',
            content: 'Companion response will be here',
            timestamp: new Date().toISOString(),
          },
        };

        res.status(200).json(successResponse(response, String(req.id)));
      } catch (error) {
        logger.error({ error, userId, sessionId }, 'Failed to process message');
        throw error;
      }
    })
  );

  /**
   * GET /api/v1/conversation/:sessionId/stream
   * Stream companion response via Server-Sent Events (SSE)
   *
   * Use-case: Real-time streaming of LLM responses to client
   * Client can read chunks as they arrive for real-time typing effect
   */
  app.get(
    `${baseRoute}/:sessionId/stream`,
    authenticate,
    validate(sessionIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { sessionId } = req.params;

      try {
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering

        // Send initial connection message
        res.write('data: {"type":"connected","sessionId":"' + sessionId + '"}\n\n');

        // TODO: Stream companion response chunks as they arrive
        // Example streaming pattern:
        // const stream = companionService.streamResponse(sessionId);
        // stream.on('chunk', (chunk) => {
        //   res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        // });
        // stream.on('end', () => {
        //   res.write('data: {"type":"done"}\n\n');
        //   res.end();
        // });

        logger.info({ userId, sessionId }, 'SSE stream opened');

        // Simulate streaming (replace with real implementation)
        setTimeout(() => {
          res.write('data: {"type":"chunk","content":"Hello "}\n\n');
        }, 100);

        setTimeout(() => {
          res.write('data: {"type":"chunk","content":"from "}\n\n');
        }, 200);

        setTimeout(() => {
          res.write('data: {"type":"chunk","content":"companion!"}\n\n');
          res.write('data: {"type":"done"}\n\n');
          res.end();
          logger.info({ userId, sessionId }, 'SSE stream closed');
        }, 300);
      } catch (error) {
        logger.error({ error, userId, sessionId }, 'Failed to open SSE stream');
        res.status(500).json({
          error: 'Failed to open stream',
        });
      }
    })
  );

  /**
   * GET /api/v1/conversation
   * List all conversations for the user
   */
  app.get(
    baseRoute,
    authenticate,
    rateLimiters.api,
    validate(listConversationsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { page = 1, limit = 20, companionId } = req.query as Record<string, any>;

      try {
        // TODO: Query ConversationRepository with pagination
        const conversations = [];

        res.status(200).json(
          paginatedResponse(conversations, page, limit, 0, String(req.id))
        );
      } catch (error) {
        logger.error({ error, userId }, 'Failed to list conversations');
        throw error;
      }
    })
  );

  /**
   * DELETE /api/v1/conversation/:sessionId
   * End and delete a conversation session
   */
  app.delete(
    `${baseRoute}/:sessionId`,
    authenticate,
    rateLimiters.api,
    validate(sessionIdSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = req.user!.uid;
      const { sessionId } = req.params;

      try {
        // TODO: Mark conversation as ended/deleted
        logger.info(
          { userId, sessionId },
          'Conversation session deleted'
        );

        res.status(200).json(
          successResponse(
            { success: true, message: 'Conversation deleted' },
            String(req.id)
          )
        );
      } catch (error) {
        logger.error({ error, userId, sessionId }, 'Failed to delete conversation');
        throw error;
      }
    })
  );

  logger.info('✅ Conversation routes registered');
}

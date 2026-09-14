import { Request, Response } from 'express';
import { z } from 'zod';
import { MemoryApplicationService } from '@application/services/memory.application.service';
import { ApplicationContext } from '@application/dtos/application.dtos';
import { validate } from '@application/validators/application.validators';
import { asyncHandler } from '@utils/asyncHandler';
import { sendOk, sendNoContent } from '@utils/response';
import { UnauthorizedError } from '@utils/error';
import { createLogger } from '@utils/logger';

const idParamSchema = z.object({
  id: z.string().min(1, 'Memory id is required'),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(100),
});

/**
 * Memories Controller (user-scoped)
 * Backs the Android Memories timeline, detail view, and "forget this"
 * action. Distinct from the companion-scoped endpoints in
 * memory.controller.ts. No business logic here.
 */
export class MemoriesController {
  private readonly logger = createLogger('MemoriesController');
  private readonly memoryService = new MemoryApplicationService();

  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'GET', path: '/api/v1/memories' }, 'GET /api/v1/memories');

    const { limit } = validate<{ limit: number }>(req.query, listQuerySchema);
    const context = this.requireContext(req);

    const memories = await this.memoryService.listForUser(context, limit);
    sendOk(res, { memories, count: memories.length });
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'GET', path: '/api/v1/memories/:id' }, 'GET /api/v1/memories/:id');

    const { id } = validate<{ id: string }>(req.params, idParamSchema);
    const context = this.requireContext(req);

    const memory = await this.memoryService.getForUser(context, id);
    sendOk(res, memory);
  });

  forget = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    this.logger.info({ method: 'DELETE', path: '/api/v1/memories/:id' }, 'DELETE /api/v1/memories/:id');

    const { id } = validate<{ id: string }>(req.params, idParamSchema);
    const context = this.requireContext(req);

    await this.memoryService.forgetForUser(context, id);
    sendNoContent(res);
  });

  private requireContext(req: Request): ApplicationContext {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError();
    }
    return {
      userId: user.uid,
      userEmail: user.email,
      userRoles: (user.customClaims?.roles as string[]) || [],
      requestId: String(req.id ?? ''),
      traceId: String(req.id ?? ''),
      timestamp: new Date(),
    };
  }
}

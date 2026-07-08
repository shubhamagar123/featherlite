/**
 * ContextEngine — the public boundary of the context tier.
 *
 * It assembles the complete runtime context for an interaction and returns a
 * single `InteractionContextDTO`. This is the ONLY collaborator the Interaction
 * Engine depends on: the Interaction Engine never talks to the World Engine,
 * Companion Engine, or services directly.
 */

import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

import { ContextRequest, InteractionContextDTO } from './dtos/conversation-context.dto';
import { IContextBuilder } from './interfaces/context-builder.interface';
import { IContextEngine } from './interfaces/context-engine.interface';
import { ContextProviderKey } from './interfaces/context-provider.interface';

const PROVIDER_KEYS: ContextProviderKey[] = [
  'user',
  'companion',
  'world',
  'relationship',
  'memory',
  'moments',
];

export class ContextEngine implements IContextEngine {
  private readonly logger: Logger;

  constructor(private readonly builder: IContextBuilder) {
    this.logger = createLogger('ContextEngine');
  }

  async assembleContext(request: ContextRequest): Promise<IResult<InteractionContextDTO>> {
    try {
      const result = await this.builder.build(request);
      if (result.isSuccess && result.value) {
        this.logger.info(
          {
            userId: request.userId,
            companionId: request.companionId,
            degraded: result.value.meta.degraded,
            buildDurationMs: result.value.meta.buildDurationMs,
          },
          'Assembled interaction context'
        );
      }
      return result;
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to assemble interaction context');
      return Result.failure(new Error('Failed to assemble interaction context'));
    }
  }

  providerKeys(): ContextProviderKey[] {
    return [...PROVIDER_KEYS];
  }
}

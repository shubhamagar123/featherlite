/**
 * ContextEngine contract.
 *
 * The Context Engine is the public boundary. It assembles the runtime context
 * for an interaction and hands back a single `InteractionContextDTO`. It is the
 * ONLY thing the Interaction Engine will depend on — the Interaction Engine
 * never talks to the World Engine, Companion Engine, or services directly.
 */

import { IResult } from '@services/types/result.type';
import { ContextRequest, InteractionContextDTO } from '../dtos/conversation-context.dto';
import { ContextProviderKey } from './context-provider.interface';

export interface IContextEngine {
  /** Assemble the full interaction context for the request. */
  assembleContext(request: ContextRequest): Promise<IResult<InteractionContextDTO>>;

  /** Keys of the providers this engine orchestrates (for introspection). */
  providerKeys(): ContextProviderKey[];
}

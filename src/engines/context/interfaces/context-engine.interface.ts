/**
 * ContextEngine contract.
 *
 * The Context Engine is the public boundary. It assembles the runtime context
 * for a conversation and hands back a single `ConversationContextDTO`. It is the
 * ONLY thing the Conversation Engine will depend on — the Conversation Engine
 * never talks to the World Engine, Companion Engine, or services directly.
 */

import { IResult } from '@services/types/result.type';
import { ContextRequest, ConversationContextDTO } from '../dtos/conversation-context.dto';
import { ContextProviderKey } from './context-provider.interface';

export interface IContextEngine {
  /** Assemble the full conversation context for the request. */
  assembleContext(request: ContextRequest): Promise<IResult<ConversationContextDTO>>;

  /** Keys of the providers this engine orchestrates (for introspection). */
  providerKeys(): ContextProviderKey[];
}

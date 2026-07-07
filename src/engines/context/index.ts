/**
 * Context Engine public API.
 *
 * Import from `@engines/context`. The Conversation Engine (future) should depend
 * on ONLY this module — specifically on `IContextEngine` and the
 * `ConversationContextDTO` it returns.
 */

// Factory (composition root)
export { getContextEngine, resetContextEngine, buildProviderSet } from './context.factory';
export type { ContextEngineDeps } from './context.factory';

// Engine + builder
export { ContextEngine } from './context.engine';
export { ContextBuilder } from './builder/context.builder';

// Providers
export { UserContextProvider } from './providers/user-context.provider';
export { WorldContextProvider } from './providers/world-context.provider';
export { CompanionContextProvider } from './providers/companion-context.provider';
export { RelationshipContextProvider } from './providers/relationship-context.provider';
export { MemoryContextProvider } from './providers/memory-context.provider';
export { MomentsContextProvider } from './providers/moments-context.provider';

// Interfaces
export type { IContextEngine } from './interfaces/context-engine.interface';
export type { IContextBuilder, ContextProviderSet } from './interfaces/context-builder.interface';
export type {
  IContextProvider,
  ContextProviderKey,
} from './interfaces/context-provider.interface';

// DTOs
export type {
  ContextRequest,
  ConversationContextDTO,
  ContextMeta,
  ContextProviderReport,
  UserContextSlice,
  CompanionContextSlice,
  WorldContextSlice,
  RelationshipContextSlice,
  MemoryContextSlice,
  MemoryContextItem,
  MomentsContextSlice,
  MomentContextItem,
} from './dtos/conversation-context.dto';

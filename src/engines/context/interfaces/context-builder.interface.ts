/**
 * ContextBuilder contract.
 *
 * The builder is the assembly mechanism: it runs every provider, times each,
 * applies the required/optional degradation policy, and composes a single
 * `InteractionContextDTO`. It contains no source-specific knowledge — that
 * lives entirely in the providers.
 */

import { IResult } from '@services/types/result.type';
import {
  ContextRequest,
  InteractionContextDTO,
  UserContextSlice,
  CompanionContextSlice,
  WorldContextSlice,
  RelationshipContextSlice,
  MemoryContextSlice,
  MomentsContextSlice,
} from '../dtos/conversation-context.dto';
import { IContextProvider } from './context-provider.interface';

/** The full set of providers the builder orchestrates (one per source). */
export interface ContextProviderSet {
  user: IContextProvider<UserContextSlice>;
  companion: IContextProvider<CompanionContextSlice>;
  world: IContextProvider<WorldContextSlice>;
  relationship: IContextProvider<RelationshipContextSlice>;
  memory: IContextProvider<MemoryContextSlice>;
  moments: IContextProvider<MomentsContextSlice>;
}

export interface IContextBuilder {
  /** Assemble the complete interaction context for a request. */
  build(request: ContextRequest): Promise<IResult<InteractionContextDTO>>;
}

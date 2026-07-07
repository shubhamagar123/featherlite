/**
 * Context provider contract.
 *
 * A provider is responsible for exactly ONE source. It knows how to talk to its
 * upstream engine/service and how to map that upstream data into its context
 * slice. Providers are the only place in the conversation-context path that
 * touch the World Engine, Companion Engine, or the services.
 *
 * Providers must degrade gracefully: when their source is simply absent (e.g. a
 * user/companion pair with no relationship yet), an OPTIONAL provider returns a
 * success result carrying its `emptySlice()`. Only genuine errors return a
 * failure — and only a REQUIRED provider's failure aborts the whole build.
 */

import { IResult } from '@services/types/result.type';
import { ContextRequest } from '../dtos/conversation-context.dto';

export type ContextProviderKey =
  | 'user'
  | 'companion'
  | 'world'
  | 'relationship'
  | 'memory'
  | 'moments';

export interface IContextProvider<TSlice> {
  /** Stable identifier for logging / reports. */
  readonly key: ContextProviderKey;

  /** Whether a failure here should abort the entire context build. */
  readonly required: boolean;

  /** The safe default slice used when an optional source is unavailable. */
  emptySlice(): TSlice;

  /** Fetch from this provider's single source and map to its slice. */
  provide(request: ContextRequest): Promise<IResult<TSlice>>;
}

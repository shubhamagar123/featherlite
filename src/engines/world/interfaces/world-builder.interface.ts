/**
 * WorldBuilder contract.
 *
 * The builder is the orchestrator: it runs the selectors in strict dependency
 * order and assembles a complete GeneratedWorldDTO. It is pure — no services,
 * no I/O, no clock — which makes the whole of world generation unit-testable in
 * isolation.
 */

import { GeneratedWorldDTO } from '../dtos/world-generation.dto';
import { WorldContext } from '../context/world-context';

export interface IWorldBuilder {
  /**
   * Assemble the full world for a resolved context.
   *
   * @param context - Immutable generation context.
   */
  build(context: WorldContext): GeneratedWorldDTO;
}

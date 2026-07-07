/**
 * AvailabilityManager — resolves how reachable the companion is.
 *
 * This is a *life* property derived purely from what the companion is doing (and
 * an explicit status override), never a network flag and never about AI. Fully
 * rule-driven and deterministic.
 */

import { Scene } from '@engines/world';
import { CompanionMood, CompanionState, Availability } from '../enums/companion.enums';
import { IAvailabilityInput, IAvailabilityManager } from '../interfaces/managers.interface';

/** World scenes that read as clearly "out and about". */
const OUT_SCENES = new Set<Scene>([Scene.CAFE, Scene.DRIVE, Scene.PARK]);

export class AvailabilityManager implements IAvailabilityManager {
  resolve(input: IAvailabilityInput): Availability {
    const { context, state, mood } = input;

    // Explicit status overrides win.
    if (context.signals.statusOverride === 'INACTIVE') return Availability.OFFLINE;

    switch (state) {
      case CompanionState.SLEEPING:
        return Availability.OFFLINE;
      case CompanionState.DRIVING:
      case CompanionState.BUSY:
        return Availability.DO_NOT_DISTURB;
      case CompanionState.WORKING:
        // Deep focus reads as do-not-disturb; otherwise just limited.
        return mood === CompanionMood.FOCUSED ? Availability.DO_NOT_DISTURB : Availability.LIMITED;
      case CompanionState.WALKING:
        // Out in the world reads as away; a stroll at home is merely limited.
        return OUT_SCENES.has(context.world.scene as Scene)
          ? Availability.AWAY
          : Availability.LIMITED;
      case CompanionState.COOKING:
      case CompanionState.GAMING:
        return Availability.LIMITED;
      case CompanionState.IDLE:
      case CompanionState.RELAXING:
      case CompanionState.READING:
      default:
        // Low energy softens availability even in otherwise-free states.
        return mood === CompanionMood.LOW_ENERGY ? Availability.LIMITED : Availability.AVAILABLE;
    }
  }
}

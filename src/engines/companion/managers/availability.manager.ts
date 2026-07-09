/**
 * AvailabilityManager — resolves how reachable the companion is.
 *
 * This is a *life* property derived purely from what the companion is doing (and
 * an explicit status override), never a network flag and never about AI. Fully
 * rule-driven and deterministic.
 */

import { Result, IResult } from '@services/types/result.type';
import { Scene } from '@engines/shared';
import { CompanionMood, CompanionState, Availability } from '../enums/companion.enums';
import { IAvailabilityInput, IAvailabilityManager } from '../interfaces/managers.interface';

/** World scenes that read as clearly "out and about". */
const OUT_SCENES = new Set<Scene>([Scene.CAFE, Scene.DRIVE, Scene.PARK]);

export class AvailabilityManager implements IAvailabilityManager {
  resolve(input: IAvailabilityInput): IResult<Availability> {
    const { context, state, mood } = input;

    // Explicit status overrides win.
    if (context.signals.statusOverride === 'INACTIVE') return Result.success(Availability.OFFLINE);

    let availability: Availability;
    switch (state) {
      case CompanionState.SLEEPING:
        availability = Availability.OFFLINE;
        break;
      case CompanionState.DRIVING:
      case CompanionState.BUSY:
        availability = Availability.DO_NOT_DISTURB;
        break;
      case CompanionState.WORKING:
        // Deep focus reads as do-not-disturb; otherwise just limited.
        availability = mood === CompanionMood.FOCUSED ? Availability.DO_NOT_DISTURB : Availability.LIMITED;
        break;
      case CompanionState.WALKING:
        // Out in the world reads as away; a stroll at home is merely limited.
        availability = OUT_SCENES.has(context.world.scene as Scene)
          ? Availability.AWAY
          : Availability.LIMITED;
        break;
      case CompanionState.COOKING:
      case CompanionState.GAMING:
        availability = Availability.LIMITED;
        break;
      case CompanionState.IDLE:
      case CompanionState.RELAXING:
      case CompanionState.READING:
      default:
        // Low energy softens availability even in otherwise-free states.
        availability = mood === CompanionMood.LOW_ENERGY ? Availability.LIMITED : Availability.AVAILABLE;
    }
    return Result.success(availability);
  }
}

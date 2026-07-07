/**
 * CompanionScheduler — interprets a companion's daily schedule.
 *
 * Blocks are half-open `[startHour, endHour)` and may wrap past midnight (a
 * block with `startHour > endHour`, e.g. 22 -> 6, covers the late-night sleep
 * window). Resolution is pure and deterministic.
 */

import { CompanionScheduleBlockDTO, CompanionScheduleDTO } from '../dtos/companion.dtos';
import { ICompanionScheduler } from '../interfaces/companion-scheduler.interface';

export class CompanionScheduler implements ICompanionScheduler {
  resolveBlock(schedule: CompanionScheduleDTO, localHour: number): CompanionScheduleBlockDTO | null {
    for (const block of schedule.blocks) {
      if (this.covers(block, localHour)) {
        return block;
      }
    }
    return null;
  }

  nextBlockHour(schedule: CompanionScheduleDTO, localHour: number): number | null {
    if (schedule.blocks.length === 0) return null;

    // Find the smallest positive distance to any block's start hour.
    let best: number | null = null;
    for (const block of schedule.blocks) {
      const distance = (block.startHour - localHour + 24) % 24;
      const forward = distance === 0 ? 24 : distance; // strictly in the future
      if (best === null || forward < best) {
        best = forward;
      }
    }
    if (best === null) return null;
    return (localHour + best) % 24;
  }

  /** Whether a (possibly midnight-wrapping) block covers the given hour. */
  private covers(block: CompanionScheduleBlockDTO, hour: number): boolean {
    const { startHour, endHour } = block;
    if (startHour === endHour) return false; // empty block
    if (startHour < endHour) {
      return hour >= startHour && hour < endHour;
    }
    // Wraps past midnight, e.g. 22 -> 6 covers [22,24) ∪ [0,6).
    return hour >= startHour || hour < endHour;
  }
}

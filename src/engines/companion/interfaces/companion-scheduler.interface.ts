/**
 * CompanionScheduler contract.
 *
 * The scheduler interprets a companion's daily schedule: which block is active
 * at a given local hour, and when the next block begins. It is pure — no clock
 * of its own beyond what the caller supplies.
 */

import { CompanionScheduleBlockDTO, CompanionScheduleDTO } from '../dtos/companion.dtos';

export interface ICompanionScheduler {
  /**
   * Find the schedule block active at `localHour`, honouring blocks that wrap
   * past midnight. Returns null when no block covers the hour.
   */
  resolveBlock(schedule: CompanionScheduleDTO, localHour: number): CompanionScheduleBlockDTO | null;

  /**
   * The local hour [0, 23] at which the next block starts relative to
   * `localHour`. Returns null when the schedule is empty.
   */
  nextBlockHour(schedule: CompanionScheduleDTO, localHour: number): number | null;
}

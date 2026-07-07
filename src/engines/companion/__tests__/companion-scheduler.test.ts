import { CompanionScheduler } from '../scheduler/companion-scheduler';
import { CompanionState } from '../enums/companion.enums';
import { CompanionScheduleDTO } from '../dtos/companion.dtos';

const schedule: CompanionScheduleDTO = {
  blocks: [
    { label: 'Morning', startHour: 6, endHour: 12, state: CompanionState.RELAXING },
    { label: 'Work', startHour: 12, endHour: 18, state: CompanionState.WORKING },
    { label: 'Sleep', startHour: 22, endHour: 6, state: CompanionState.SLEEPING },
  ],
};

describe('CompanionScheduler', () => {
  const scheduler = new CompanionScheduler();

  describe('resolveBlock', () => {
    it('finds the block covering a normal hour', () => {
      expect(scheduler.resolveBlock(schedule, 9)?.label).toBe('Morning');
      expect(scheduler.resolveBlock(schedule, 14)?.label).toBe('Work');
    });

    it('honours a block that wraps past midnight', () => {
      expect(scheduler.resolveBlock(schedule, 23)?.label).toBe('Sleep');
      expect(scheduler.resolveBlock(schedule, 3)?.label).toBe('Sleep');
    });

    it('returns null for an uncovered hour', () => {
      // 18:00-22:00 is a gap in this schedule.
      expect(scheduler.resolveBlock(schedule, 20)).toBeNull();
    });

    it('treats startHour as inclusive and endHour as exclusive', () => {
      expect(scheduler.resolveBlock(schedule, 12)?.label).toBe('Work');
      expect(scheduler.resolveBlock(schedule, 6)?.label).toBe('Morning');
    });
  });

  describe('nextBlockHour', () => {
    it('returns the next block start strictly in the future', () => {
      expect(scheduler.nextBlockHour(schedule, 9)).toBe(12);
      // 12:00 is the Work start; the next *future* start is Sleep at 22:00.
      expect(scheduler.nextBlockHour(schedule, 12)).toBe(22);
    });

    it('wraps around to the earliest block the next day', () => {
      // From 19:00 the next start is 22:00 (Sleep).
      expect(scheduler.nextBlockHour(schedule, 19)).toBe(22);
      // From 23:00 the next start is 06:00 (Morning).
      expect(scheduler.nextBlockHour(schedule, 23)).toBe(6);
    });

    it('returns null for an empty schedule', () => {
      expect(scheduler.nextBlockHour({ blocks: [] }, 9)).toBeNull();
    });
  });
});

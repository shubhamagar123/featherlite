/**
 * Simulation Clock Tests
 */

import { SimulationClock } from '../simulation-clock';

describe('SimulationClock', () => {
  let clock: SimulationClock;
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-31');

  beforeEach(() => {
    clock = new SimulationClock(startDate, endDate);
  });

  describe('initialization', () => {
    it('should initialize with correct dates', () => {
      expect(clock.getCurrentDate().toDateString()).toBe(startDate.toDateString());
      expect(clock.getTotalDays()).toBe(30);
    });

    it('should have zero elapsed days initially', () => {
      expect(clock.getElapsedDays()).toBe(0);
    });

    it('should calculate progress as 0 initially', () => {
      expect(clock.getProgress()).toBe(0);
    });
  });

  describe('time progression', () => {
    it('should advance by one day on tick', () => {
      const initialDate = clock.getCurrentDate();
      const tickedSuccessfully = clock.tick();

      expect(tickedSuccessfully).toBe(true);
      expect(clock.getElapsedDays()).toBe(1);
      expect(clock.getCurrentDate().getTime()).toBeGreaterThan(initialDate.getTime());
    });

    it('should return false when simulation ends', () => {
      for (let i = 0; i < 30; i++) {
        clock.tick();
      }

      const result = clock.tick();
      expect(result).toBe(false);
    });

    it('should update progress correctly', () => {
      expect(clock.getProgress()).toBe(0);

      clock.tick();
      expect(clock.getProgress()).toBeGreaterThan(0);
      expect(clock.getProgress()).toBeLessThan(1);
    });

    it('should tick multiple days', () => {
      const tickedDays = clock.tickMultiple(5);

      expect(tickedDays).toBe(5);
      expect(clock.getElapsedDays()).toBe(5);
    });
  });

  describe('date utilities', () => {
    it('should identify weekends', () => {
      const mondayDate = new Date('2024-01-01'); // Monday
      const saturdayDate = new Date('2024-01-06'); // Saturday

      clock.setCurrentDate(mondayDate);
      expect(clock.isWeekend(mondayDate)).toBe(false);

      clock.setCurrentDate(saturdayDate);
      expect(clock.isWeekend(saturdayDate)).toBe(true);
    });

    it('should get day of week', () => {
      const mondayDate = new Date('2024-01-01');
      clock.setCurrentDate(mondayDate);

      const dayOfWeek = clock.getDayOfWeek(mondayDate);
      expect(dayOfWeek).toBe(1); // Monday is 1 in JS
    });

    it('should format current date', () => {
      const formatted = clock.getFormattedCurrentDate();
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('pause and resume', () => {
    it('should pause simulation', () => {
      clock.pause();
      expect(clock.isPaused()).toBe(true);
    });

    it('should resume simulation', () => {
      clock.pause();
      clock.resume();
      expect(clock.isPaused()).toBe(false);
    });

    it('should not advance time when paused', () => {
      clock.tick();
      const elapsedBeforePause = clock.getElapsedDays();

      clock.pause();
      const canTick = clock.tick();

      expect(canTick).toBe(false);
      expect(clock.getElapsedDays()).toBe(elapsedBeforePause);
    });
  });

  describe('time of day', () => {
    it('should return time of day', () => {
      const timeOfDay = clock.getTimeOfDay();
      expect(timeOfDay).toBeTruthy();
    });
  });

  describe('remaining days', () => {
    it('should calculate remaining days correctly', () => {
      const initialRemaining = clock.getRemainingDays();
      expect(initialRemaining).toBe(30);

      clock.tick();
      expect(clock.getRemainingDays()).toBe(29);
    });
  });
});

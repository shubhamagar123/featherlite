import { Season, TimeOfDay } from '../enums/world.enums';
import {
  deriveSeason,
  deriveTimeOfDay,
  getLocalDateKey,
  getLocalDateParts,
  getNextLocalMidnight,
} from '../utils/date.util';

describe('date.util', () => {
  describe('deriveTimeOfDay', () => {
    it.each([
      [5, TimeOfDay.MORNING],
      [9, TimeOfDay.MORNING],
      [11, TimeOfDay.MORNING],
      [12, TimeOfDay.AFTERNOON],
      [16, TimeOfDay.AFTERNOON],
      [17, TimeOfDay.EVENING],
      [20, TimeOfDay.EVENING],
      [21, TimeOfDay.NIGHT],
      [0, TimeOfDay.NIGHT],
      [4, TimeOfDay.NIGHT],
    ])('hour %i -> %s', (hour, expected) => {
      expect(deriveTimeOfDay(hour)).toBe(expected);
    });
  });

  describe('deriveSeason', () => {
    it.each([
      [1, Season.WINTER],
      [2, Season.WINTER],
      [12, Season.WINTER],
      [3, Season.SPRING],
      [5, Season.SPRING],
      [6, Season.SUMMER],
      [8, Season.SUMMER],
      [9, Season.AUTUMN],
      [11, Season.AUTUMN],
    ])('month %i -> %s', (month, expected) => {
      expect(deriveSeason(month)).toBe(expected);
    });
  });

  describe('getLocalDateParts', () => {
    it('resolves parts in UTC', () => {
      const date = new Date('2026-07-07T13:30:00Z');
      const parts = getLocalDateParts(date, 'UTC');
      expect(parts).toEqual({ year: 2026, month: 7, day: 7, hour: 13 });
    });

    it('shifts hour/day for a positive-offset timezone', () => {
      // 23:00 UTC is 04:30 next day in Asia/Kolkata (+5:30).
      const date = new Date('2026-07-07T23:00:00Z');
      const parts = getLocalDateParts(date, 'Asia/Kolkata');
      expect(parts.day).toBe(8);
      expect(parts.hour).toBe(4);
    });

    it('falls back to UTC for an invalid timezone', () => {
      const date = new Date('2026-07-07T10:00:00Z');
      const parts = getLocalDateParts(date, 'Not/AZone');
      expect(parts).toEqual({ year: 2026, month: 7, day: 7, hour: 10 });
    });
  });

  describe('getLocalDateKey', () => {
    it('formats YYYY-MM-DD with zero padding', () => {
      const date = new Date('2026-01-05T08:00:00Z');
      expect(getLocalDateKey(date, 'UTC')).toBe('2026-01-05');
    });

    it('rolls the date forward across a timezone boundary', () => {
      const date = new Date('2026-07-07T23:00:00Z');
      expect(getLocalDateKey(date, 'Asia/Kolkata')).toBe('2026-07-08');
    });
  });

  describe('getNextLocalMidnight', () => {
    it('returns a strictly future instant', () => {
      const date = new Date('2026-07-07T13:00:00Z');
      const next = getNextLocalMidnight(date, 'UTC');
      expect(next.getTime()).toBeGreaterThan(date.getTime());
    });

    it('lands on the start of the next local day', () => {
      const date = new Date('2026-07-07T13:00:00Z');
      const next = getNextLocalMidnight(date, 'UTC');
      // In UTC, the next midnight is the 8th at 00:00.
      expect(getLocalDateKey(next, 'UTC')).toBe('2026-07-08');
      expect(getLocalDateParts(next, 'UTC').hour).toBe(0);
    });
  });
});

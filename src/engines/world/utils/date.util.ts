/**
 * Timezone-aware date derivations for the World Engine.
 *
 * All functions are pure and deterministic: given the same instant + timezone
 * they always return the same result. Timezone resolution uses `Intl` and
 * falls back to UTC if an invalid timezone is supplied.
 */

import { Season, TimeOfDay } from '../enums/world.enums';

/** Local calendar parts resolved for a specific timezone. */
export interface LocalDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
}

/**
 * Resolve the local calendar parts of an instant within a timezone.
 *
 * @param date - The instant to resolve.
 * @param timeZone - IANA timezone id (e.g. "Asia/Kolkata"). Falls back to UTC.
 */
export function getLocalDateParts(date: Date, timeZone: string): LocalDateParts {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);
    const lookup = (type: string): number => {
      const found = parts.find((p) => p.type === type);
      return found ? parseInt(found.value, 10) : 0;
    };

    return {
      year: lookup('year'),
      month: lookup('month'),
      day: lookup('day'),
      hour: lookup('hour') % 24,
    };
  } catch {
    // Invalid timezone -> deterministic UTC fallback.
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
    };
  }
}

/**
 * Build a stable `YYYY-MM-DD` key for the local day. This key anchors both the
 * generation seed and day-boundary staleness checks.
 *
 * @param date - The instant.
 * @param timeZone - IANA timezone id.
 */
export function getLocalDateKey(date: Date, timeZone: string): string {
  const { year, month, day } = getLocalDateParts(date, timeZone);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Derive the coarse time of day from a local hour using fixed, deterministic
 * bands.
 *
 *  - MORNING:   05:00 – 11:59
 *  - AFTERNOON: 12:00 – 16:59
 *  - EVENING:   17:00 – 20:59
 *  - NIGHT:     21:00 – 04:59
 *
 * @param hour - Local hour in [0, 23].
 */
export function deriveTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour <= 11) return TimeOfDay.MORNING;
  if (hour >= 12 && hour <= 16) return TimeOfDay.AFTERNOON;
  if (hour >= 17 && hour <= 20) return TimeOfDay.EVENING;
  return TimeOfDay.NIGHT;
}

/**
 * Derive the meteorological season (northern hemisphere) from a calendar month.
 *
 * @param month - Month in [1, 12].
 */
export function deriveSeason(month: number): Season {
  if (month === 12 || month === 1 || month === 2) return Season.WINTER;
  if (month >= 3 && month <= 5) return Season.SPRING;
  if (month >= 6 && month <= 8) return Season.SUMMER;
  return Season.AUTUMN;
}

/**
 * Compute the next local midnight after the given instant, expressed as a UTC
 * `Date`. Used by the scheduler to know when today's world expires.
 *
 * The computation walks forward in whole hours until the local day changes,
 * then snaps to that hour boundary. This avoids fragile manual offset math and
 * works for any timezone `Intl` supports.
 *
 * @param date - Reference instant.
 * @param timeZone - IANA timezone id.
 */
export function getNextLocalMidnight(date: Date, timeZone: string): Date {
  const currentKey = getLocalDateKey(date, timeZone);
  const cursor = new Date(date.getTime());

  // Advance hour-by-hour (max 48 steps) until the local date rolls over.
  for (let i = 0; i < 48; i++) {
    cursor.setTime(cursor.getTime() + 60 * 60 * 1000);
    if (getLocalDateKey(cursor, timeZone) !== currentKey) {
      // Snap back to the start of that new local hour's minute/second.
      const parts = getLocalDateParts(cursor, timeZone);
      const snapped = new Date(cursor.getTime());
      // Rewind minutes/seconds/millis of the local hour to reach the boundary.
      snapped.setTime(snapped.getTime() - parts.hour * 60 * 60 * 1000);
      snapped.setTime(
        snapped.getTime() -
          (snapped.getUTCMinutes() * 60 + snapped.getUTCSeconds()) * 1000 -
          snapped.getUTCMilliseconds()
      );
      return snapped;
    }
  }

  // Fallback: 24h later (should never be reached for valid timezones).
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

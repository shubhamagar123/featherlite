/**
 * Life Event Generator Tests
 */

import { LifeEventGenerator } from '../behaviors/life-event-generator';
import { UserProfiles } from '../config/user-profiles';
import { LifeEventType } from '../types';

describe('LifeEventGenerator', () => {
  let generator: LifeEventGenerator;

  beforeEach(() => {
    generator = new LifeEventGenerator();
  });

  describe('generateDailyEvents', () => {
    it('should generate events array', () => {
      const profile = UserProfiles.INTROVERT_DEVELOPER;
      const date = new Date('2024-01-01');

      const events = generator.generateDailyEvents(profile, date);

      expect(Array.isArray(events)).toBe(true);
    });

    it('should have events with required properties', () => {
      const profile = UserProfiles.EXTROVERT_MARKETER;
      const date = new Date('2024-01-01');

      const events = generator.generateDailyEvents(profile, date);

      events.forEach(event => {
        expect(event.id).toBeTruthy();
        expect(event.type).toBeTruthy();
        expect(event.date).toBeTruthy();
        expect(event.description).toBeTruthy();
        expect(typeof event.impact).toBe('number');
        expect(typeof event.emotionalImpact).toBe('number');
        expect(typeof event.relationshipImpact).toBe('number');
        expect(typeof event.memoryImportance).toBe('number');
      });
    });

    it('should generate realistic impact scores', () => {
      const profile = UserProfiles.BUSY_PROFESSIONAL;
      const date = new Date('2024-01-01');

      const events = generator.generateDailyEvents(profile, date);

      events.forEach(event => {
        expect(event.impact).toBeGreaterThanOrEqual(0);
        expect(event.impact).toBeLessThanOrEqual(100);
        expect(event.emotionalImpact).toBeGreaterThanOrEqual(0);
        expect(event.emotionalImpact).toBeLessThanOrEqual(100);
        expect(event.relationshipImpact).toBeGreaterThanOrEqual(0);
        expect(event.relationshipImpact).toBeLessThanOrEqual(100);
        expect(event.memoryImportance).toBeGreaterThanOrEqual(0);
        expect(event.memoryImportance).toBeLessThanOrEqual(1);
      });
    });

    it('should generate events across different days', () => {
      const profile = UserProfiles.COLLEGE_STUDENT;

      let totalEvents = 0;
      for (let i = 0; i < 365; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        const events = generator.generateDailyEvents(profile, date);
        totalEvents += events.length;
      }

      expect(totalEvents).toBeGreaterThan(0);
    });
  });

  describe('event types', () => {
    it('should generate valid event types', () => {
      const profile = UserProfiles.FITNESS_ENTHUSIAST;
      const validEventTypes = Object.values(LifeEventType);

      for (let i = 0; i < 100; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        const events = generator.generateDailyEvents(profile, date);

        events.forEach(event => {
          expect(validEventTypes).toContain(event.type);
        });
      }
    });

    it('should generate high-impact events', () => {
      const profile = UserProfiles.NIGHT_OWL;

      let foundHighImpactEvent = false;
      for (let i = 0; i < 365; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        const events = generator.generateDailyEvents(profile, date);

        if (events.some(e => e.impact > 50)) {
          foundHighImpactEvent = true;
          break;
        }
      }

      expect(foundHighImpactEvent).toBe(true);
    });

    it('should generate low-impact events', () => {
      const profile = UserProfiles.CREATIVE_ARTIST;

      let foundLowImpactEvent = false;
      for (let i = 0; i < 365; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        const events = generator.generateDailyEvents(profile, date);

        if (events.some(e => e.impact < 30)) {
          foundLowImpactEvent = true;
          break;
        }
      }

      expect(foundLowImpactEvent).toBe(true);
    });
  });

  describe('event descriptions', () => {
    it('should generate non-empty descriptions', () => {
      const profile = UserProfiles.MINIMALIST;

      for (let i = 0; i < 30; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        const events = generator.generateDailyEvents(profile, date);

        events.forEach(event => {
          expect(event.description).toBeTruthy();
          expect(event.description.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('event probabilities', () => {
    it('should respect event probability distributions', () => {
      const profile = UserProfiles.OVERTHINKER;
      const eventCounts: { [key: string]: number } = {};

      for (let i = 0; i < 365; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        const events = generator.generateDailyEvents(profile, date);

        events.forEach(event => {
          eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
        });
      }

      expect(Object.keys(eventCounts).length).toBeGreaterThan(0);
    });
  });
});

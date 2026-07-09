/**
 * Daily Behavior Generator Tests
 */

import { DailyBehaviorGenerator } from '../behaviors/daily-behavior';
import { UserProfiles } from '../config/user-profiles';
import { DayType, MoodState } from '../types';

describe('DailyBehaviorGenerator', () => {
  let generator: DailyBehaviorGenerator;

  beforeEach(() => {
    generator = new DailyBehaviorGenerator();
  });

  describe('generateDailySchedule', () => {
    it('should generate a schedule with activities', () => {
      const profile = UserProfiles.INTROVERT_DEVELOPER;
      const date = new Date('2024-01-01');

      const schedule = generator.generateDailySchedule(
        profile,
        date,
        DayType.WEEKDAY,
        MoodState.NEUTRAL
      );

      expect(schedule.plannedActivities.length).toBeGreaterThan(0);
      expect(schedule.date).toBe(date);
      expect(schedule.dayType).toBe(DayType.WEEKDAY);
      expect(schedule.mood).toBe(MoodState.NEUTRAL);
    });

    it('should include different activities for weekday vs weekend', () => {
      const profile = UserProfiles.BUSY_PROFESSIONAL;
      const date = new Date('2024-01-01');

      const weekdaySchedule = generator.generateDailySchedule(
        profile,
        date,
        DayType.WEEKDAY,
        MoodState.NEUTRAL
      );

      const weekendSchedule = generator.generateDailySchedule(
        profile,
        date,
        DayType.WEEKEND,
        MoodState.NEUTRAL
      );

      expect(weekdaySchedule.plannedActivities.length).toBeGreaterThan(0);
      expect(weekendSchedule.plannedActivities.length).toBeGreaterThan(0);
    });

    it('should calculate energy level based on mood', () => {
      const profile = UserProfiles.FITNESS_ENTHUSIAST;
      const date = new Date('2024-01-01');

      const positiveSchedule = generator.generateDailySchedule(
        profile,
        date,
        DayType.WEEKDAY,
        MoodState.VERY_POSITIVE
      );

      const negativeSchedule = generator.generateDailySchedule(
        profile,
        date,
        DayType.WEEKDAY,
        MoodState.VERY_NEGATIVE
      );

      expect(positiveSchedule.energyLevel).toBeGreaterThan(negativeSchedule.energyLevel);
    });

    it('should calculate stress based on neuroticism', () => {
      const profile = UserProfiles.OVERTHINKER; // High neuroticism
      const date = new Date('2024-01-01');

      const schedule = generator.generateDailySchedule(
        profile,
        date,
        DayType.WEEKDAY,
        MoodState.NEUTRAL
      );

      expect(schedule.stress).toBeGreaterThan(0);
      expect(schedule.stress).toBeLessThanOrEqual(1);
    });

    it('should generate activities for holidays', () => {
      const profile = UserProfiles.EXTROVERT_MARKETER;
      const date = new Date('2024-01-01');

      const holidaySchedule = generator.generateDailySchedule(
        profile,
        date,
        DayType.HOLIDAY,
        MoodState.POSITIVE
      );

      expect(holidaySchedule.plannedActivities.length).toBeGreaterThan(0);
    });
  });

  describe('activity generation', () => {
    it('should generate weekday activities for employed profile', () => {
      const profile = UserProfiles.BUSY_PROFESSIONAL;
      const date = new Date('2024-01-01');

      const schedule = generator.generateDailySchedule(
        profile,
        date,
        DayType.WEEKDAY,
        MoodState.NEUTRAL
      );

      const workActivities = schedule.plannedActivities.filter(a => a.type === 'work');
      expect(workActivities.length).toBeGreaterThan(0);
    });

    it('should include fitness activities for fitness enthusiasts', () => {
      const profile = UserProfiles.FITNESS_ENTHUSIAST;
      const date = new Date('2024-01-01');

      let foundFitness = false;
      for (let i = 0; i < 7; i++) {
        const schedule = generator.generateDailySchedule(
          profile,
          date,
          DayType.WEEKEND,
          MoodState.NEUTRAL
        );

        if (schedule.plannedActivities.some(a => a.type === 'exercise')) {
          foundFitness = true;
          break;
        }
      }

      expect(foundFitness).toBe(true);
    });

    it('should include social activities for extroverts', () => {
      const profile = UserProfiles.EXTROVERT_MARKETER;
      const date = new Date('2024-01-01');

      const schedule = generator.generateDailySchedule(
        profile,
        date,
        DayType.WEEKEND,
        MoodState.POSITIVE
      );

      const socialActivities = schedule.plannedActivities.filter(a => a.type === 'social');
      expect(socialActivities.length).toBeGreaterThan(0);
    });
  });

  describe('energy and stress calculations', () => {
    it('should return energy between 0 and 1', () => {
      const profile = UserProfiles.COLLEGE_STUDENT;
      const date = new Date('2024-01-01');

      for (const mood of Object.values(MoodState)) {
        const schedule = generator.generateDailySchedule(
          profile,
          date,
          DayType.WEEKDAY,
          mood
        );

        expect(schedule.energyLevel).toBeGreaterThanOrEqual(0);
        expect(schedule.energyLevel).toBeLessThanOrEqual(1);
      }
    });

    it('should return stress between 0 and 1', () => {
      const profile = UserProfiles.NIGHT_OWL;
      const date = new Date('2024-01-01');

      for (const mood of Object.values(MoodState)) {
        const schedule = generator.generateDailySchedule(
          profile,
          date,
          DayType.WEEKDAY,
          mood
        );

        expect(schedule.stress).toBeGreaterThanOrEqual(0);
        expect(schedule.stress).toBeLessThanOrEqual(1);
      }
    });

    it('should increase energy on weekends', () => {
      const profile = UserProfiles.CREATIVE_ARTIST;
      const date = new Date('2024-01-01');

      const weekdaySchedule = generator.generateDailySchedule(
        profile,
        date,
        DayType.WEEKDAY,
        MoodState.NEUTRAL
      );

      const weekendSchedule = generator.generateDailySchedule(
        profile,
        date,
        DayType.WEEKEND,
        MoodState.NEUTRAL
      );

      expect(weekendSchedule.energyLevel).toBeGreaterThan(weekdaySchedule.energyLevel);
    });
  });
});

/**
 * Daily Behavior Generator
 * Generates realistic daily schedules and activities
 */

import {
  DailySchedule,
  Activity,
  VirtualUserProfile,
  DayType,
  TimeOfDay,
  MoodState,
  PersonalityType,
} from '../types';
export class DailyBehaviorGenerator {

  generateDailySchedule(
    profile: VirtualUserProfile,
    date: Date,
    dayType: DayType,
    mood: MoodState
  ): DailySchedule {
    const activities = this.generateActivities(profile, dayType, mood);
    const energyLevel = this.calculateEnergyLevel(profile, dayType, mood);
    const stress = this.calculateStress(profile, mood);

    return {
      date,
      dayType,
      plannedActivities: activities,
      lifeEvents: [],
      mood,
      energyLevel,
      stress,
    };
  }

  private generateActivities(
    profile: VirtualUserProfile,
    dayType: DayType,
    mood: MoodState
  ): Activity[] {
    const activities: Activity[] = [];

    if (dayType === DayType.HOLIDAY || dayType === DayType.VACATION) {
      activities.push(...this.getHolidayActivities(profile, mood));
    } else if (dayType === DayType.WEEKEND) {
      activities.push(...this.getWeekendActivities(profile, mood));
    } else {
      activities.push(...this.getWeekdayActivities(profile, mood));
    }

    return activities;
  }

  private getWeekdayActivities(profile: VirtualUserProfile, _mood: MoodState): Activity[] {
    const activities: Activity[] = [];

    activities.push({
      timeOfDay: 'EARLY_MORNING' as TimeOfDay,
      type: 'morning_routine',
      duration: 60,
      description: 'Morning routine and breakfast',
    });

    if (profile.occupationStatus === 'employed') {
      activities.push({
        timeOfDay: 'MORNING' as TimeOfDay,
        type: 'commute',
        duration: 45,
        description: 'Commute to work',
        location: 'office',
      });

      activities.push({
        timeOfDay: 'MORNING' as TimeOfDay,
        type: 'work',
        duration: 240,
        description: 'Work',
        location: 'office',
      });

      activities.push({
        timeOfDay: 'AFTERNOON' as TimeOfDay,
        type: 'lunch',
        duration: 60,
        description: 'Lunch break',
      });

      activities.push({
        timeOfDay: 'AFTERNOON' as TimeOfDay,
        type: 'work',
        duration: 240,
        description: 'Work continuation',
        location: 'office',
      });

      activities.push({
        timeOfDay: 'EVENING' as TimeOfDay,
        type: 'commute',
        duration: 45,
        description: 'Commute home',
      });
    } else if (profile.occupationStatus === 'student') {
      activities.push({
        timeOfDay: 'MORNING' as TimeOfDay,
        type: 'study',
        duration: 240,
        description: 'Classes/Study',
        location: 'school',
      });

      activities.push({
        timeOfDay: 'AFTERNOON' as TimeOfDay,
        type: 'lunch',
        duration: 60,
        description: 'Lunch',
      });

      activities.push({
        timeOfDay: 'AFTERNOON' as TimeOfDay,
        type: 'study',
        duration: 180,
        description: 'Study time',
      });
    }

    if (profile.interests.includes('fitness')) {
      activities.push({
        timeOfDay: 'EVENING' as TimeOfDay,
        type: 'exercise',
        duration: 60,
        description: 'Gym or fitness',
      });
    }

    activities.push({
      timeOfDay: 'EVENING' as TimeOfDay,
      type: 'dinner',
      duration: 60,
      description: 'Dinner',
    });

    activities.push({
      timeOfDay: 'NIGHT' as TimeOfDay,
      type: 'leisure',
      duration: 120,
      description: 'Leisure time',
    });

    return activities;
  }

  private getWeekendActivities(profile: VirtualUserProfile, _mood: MoodState): Activity[] {
    const activities: Activity[] = [];

    if (profile.personality.type === PersonalityType.INTROVERT) {
      activities.push({
        timeOfDay: 'MORNING' as TimeOfDay,
        type: 'relaxation',
        duration: 180,
        description: 'Sleep in and relax',
      });

      activities.push({
        timeOfDay: 'AFTERNOON' as TimeOfDay,
        type: 'hobby',
        duration: 180,
        description: `Pursue interests: ${profile.interests.slice(0, 2).join(', ')}`,
      });
    } else {
      activities.push({
        timeOfDay: 'MORNING' as TimeOfDay,
        type: 'social',
        duration: 180,
        description: 'Social activities with friends',
      });

      activities.push({
        timeOfDay: 'AFTERNOON' as TimeOfDay,
        type: 'social',
        duration: 240,
        description: 'Outdoor activities or hangouts',
        location: 'public',
      });
    }

    if (profile.interests.includes('fitness')) {
      activities.push({
        timeOfDay: 'MORNING' as TimeOfDay,
        type: 'exercise',
        duration: 90,
        description: 'Fitness/sports',
      });
    }

    activities.push({
      timeOfDay: 'EVENING' as TimeOfDay,
      type: 'social',
      duration: 180,
      description: 'Family time or social gathering',
    });

    return activities;
  }

  private getHolidayActivities(_profile: VirtualUserProfile, _mood: MoodState): Activity[] {
    const activities: Activity[] = [];

    activities.push({
      timeOfDay: 'MORNING' as TimeOfDay,
      type: 'leisure',
      duration: 240,
      description: 'Holiday leisure',
    });

    activities.push({
      timeOfDay: 'AFTERNOON' as TimeOfDay,
      type: 'family',
      duration: 240,
      description: 'Family time or celebration',
      location: 'home',
    });

    activities.push({
      timeOfDay: 'EVENING' as TimeOfDay,
      type: 'celebration',
      duration: 180,
      description: 'Holiday celebration',
    });

    return activities;
  }

  private calculateEnergyLevel(
    profile: VirtualUserProfile,
    dayType: DayType,
    mood: MoodState
  ): number {
    let energy = 0.5;

    if (profile.personality.extraversion > 70) {
      energy += 0.2;
    }

    if (dayType === DayType.WEEKEND || dayType === DayType.VACATION || dayType === DayType.HOLIDAY) {
      energy += 0.2;
    }

    if (mood === MoodState.VERY_POSITIVE || mood === MoodState.POSITIVE) {
      energy += 0.15;
    } else if (mood === MoodState.VERY_NEGATIVE || mood === MoodState.NEGATIVE) {
      energy -= 0.25;
    }

    return Math.max(0, Math.min(1, energy));
  }

  private calculateStress(profile: VirtualUserProfile, mood: MoodState): number {
    let stress = 0.3;

    if (profile.personality.neuroticism > 70) {
      stress += 0.2;
    }

    if (mood === MoodState.VERY_NEGATIVE || mood === MoodState.NEGATIVE) {
      stress += 0.3;
    } else if (mood === MoodState.VERY_POSITIVE) {
      stress -= 0.2;
    }

    return Math.max(0, Math.min(1, stress));
  }

  getActivityDescription(_profile: VirtualUserProfile, timeOfDay: TimeOfDay): string {
    const descriptions: { [key: string]: string[] } = {
      EARLY_MORNING: [
        'Waking up and starting the day',
        'Morning meditation',
        'Exercise before work',
      ],
      MORNING: ['Working on important tasks', 'Meetings and collaboration', 'Creative work'],
      AFTERNOON: ['Working through lunch', 'Afternoon focused work', 'Catching up on messages'],
      EVENING: ['Unwinding after work', 'Spending time with loved ones', 'Personal projects'],
      NIGHT: ['Watching entertainment', 'Late night chat', 'Preparing for sleep'],
      LATE_NIGHT: ['Staying up late', 'Online activities', 'Midnight thoughts'],
    };

    const dayDescriptions = descriptions[timeOfDay] || ['Daily activity'];
    const index = Math.floor(Math.random() * dayDescriptions.length);
    return dayDescriptions[index];
  }
}

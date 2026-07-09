/**
 * Life Event Generator
 * Generates realistic life events during simulations
 */

import {
  SimulatedLifeEvent,
  LifeEventType,
  VirtualUserProfile,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export class LifeEventGenerator {
  private eventProbabilities: Map<LifeEventType, number> = new Map([
    [LifeEventType.BIRTHDAY, 0.003],
    [LifeEventType.PROMOTION, 0.02],
    [LifeEventType.JOB_LOSS, 0.01],
    [LifeEventType.INTERVIEW, 0.015],
    [LifeEventType.VACATION, 0.08],
    [LifeEventType.ILLNESS, 0.05],
    [LifeEventType.FAMILY_EVENT, 0.04],
    [LifeEventType.FESTIVAL, 0.02],
    [LifeEventType.ANNIVERSARY, 0.005],
    [LifeEventType.WEDDING, 0.01],
    [LifeEventType.BREAKUP, 0.015],
    [LifeEventType.NEW_HOBBY, 0.03],
    [LifeEventType.MOVING_CITY, 0.01],
    [LifeEventType.BUYING_HOUSE, 0.005],
    [LifeEventType.PET_ADOPTION, 0.02],
    [LifeEventType.GRADUATION, 0.008],
    [LifeEventType.EXAMS, 0.03],
    [LifeEventType.BAD_DAY, 0.15],
    [LifeEventType.EXCELLENT_DAY, 0.12],
    [LifeEventType.BURNOUT, 0.02],
    [LifeEventType.LONELINESS, 0.08],
    [LifeEventType.RANDOM_SILENCE, 0.1],
    [LifeEventType.MISSED_CALLS, 0.05],
    [LifeEventType.FORGOTTEN_MESSAGES, 0.07],
    [LifeEventType.UNEXPECTED_HAPPINESS, 0.1],
  ]);

  generateDailyEvents(
    profile: VirtualUserProfile,
    date: Date,
    seed?: number
  ): SimulatedLifeEvent[] {
    const events: SimulatedLifeEvent[] = [];
    const random = seed ? this.seededRandom(seed) : Math.random();

    for (const [eventType, probability] of this.eventProbabilities) {
      if (random < probability) {
        const event = this.generateEvent(eventType, profile, date);
        events.push(event);
      }
    }

    return events;
  }

  generateEvent(
    eventType: LifeEventType,
    profile: VirtualUserProfile,
    date: Date
  ): SimulatedLifeEvent {
    const id = uuidv4();
    const { description, impact, emotionalImpact, relationshipImpact, memoryImportance } =
      this.getEventAttributes(eventType, profile);

    return {
      id,
      type: eventType,
      date,
      description,
      impact,
      emotionalImpact,
      relationshipImpact,
      memoryImportance,
      metadata: {
        affectedBy: profile.id,
        generatedDate: new Date(),
      },
    };
  }

  private getEventAttributes(eventType: LifeEventType, profile: VirtualUserProfile) {
    const baseAttributes: { [key in LifeEventType]: any } = {
      [LifeEventType.BIRTHDAY]: {
        description: `${profile.name} celebrates their birthday`,
        impact: 30,
        emotionalImpact: 40,
        relationshipImpact: 50,
        memoryImportance: 0.9,
      },
      [LifeEventType.PROMOTION]: {
        description: `${profile.name} gets promoted at work`,
        impact: 50,
        emotionalImpact: 60,
        relationshipImpact: 30,
        memoryImportance: 0.95,
      },
      [LifeEventType.JOB_LOSS]: {
        description: `${profile.name} loses their job`,
        impact: 60,
        emotionalImpact: 80,
        relationshipImpact: 40,
        memoryImportance: 0.95,
      },
      [LifeEventType.INTERVIEW]: {
        description: `${profile.name} has a job interview`,
        impact: 25,
        emotionalImpact: 35,
        relationshipImpact: 10,
        memoryImportance: 0.7,
      },
      [LifeEventType.VACATION]: {
        description: `${profile.name} goes on vacation`,
        impact: 40,
        emotionalImpact: 45,
        relationshipImpact: 35,
        memoryImportance: 0.85,
      },
      [LifeEventType.ILLNESS]: {
        description: `${profile.name} is feeling unwell`,
        impact: 35,
        emotionalImpact: 50,
        relationshipImpact: 30,
        memoryImportance: 0.7,
      },
      [LifeEventType.FAMILY_EVENT]: {
        description: `${profile.name} attends a family gathering`,
        impact: 30,
        emotionalImpact: 40,
        relationshipImpact: 60,
        memoryImportance: 0.8,
      },
      [LifeEventType.FESTIVAL]: {
        description: `${profile.name} celebrates a festival`,
        impact: 25,
        emotionalImpact: 45,
        relationshipImpact: 40,
        memoryImportance: 0.75,
      },
      [LifeEventType.ANNIVERSARY]: {
        description: `${profile.name} celebrates an anniversary`,
        impact: 35,
        emotionalImpact: 50,
        relationshipImpact: 70,
        memoryImportance: 0.9,
      },
      [LifeEventType.WEDDING]: {
        description: `${profile.name} gets married`,
        impact: 80,
        emotionalImpact: 90,
        relationshipImpact: 100,
        memoryImportance: 1.0,
      },
      [LifeEventType.BREAKUP]: {
        description: `${profile.name} goes through a breakup`,
        impact: 70,
        emotionalImpact: 85,
        relationshipImpact: 90,
        memoryImportance: 0.95,
      },
      [LifeEventType.NEW_HOBBY]: {
        description: `${profile.name} takes up a new hobby`,
        impact: 20,
        emotionalImpact: 30,
        relationshipImpact: 15,
        memoryImportance: 0.6,
      },
      [LifeEventType.MOVING_CITY]: {
        description: `${profile.name} moves to a new city`,
        impact: 50,
        emotionalImpact: 60,
        relationshipImpact: 50,
        memoryImportance: 0.9,
      },
      [LifeEventType.BUYING_HOUSE]: {
        description: `${profile.name} buys a new house`,
        impact: 60,
        emotionalImpact: 70,
        relationshipImpact: 55,
        memoryImportance: 0.95,
      },
      [LifeEventType.PET_ADOPTION]: {
        description: `${profile.name} adopts a pet`,
        impact: 30,
        emotionalImpact: 50,
        relationshipImpact: 25,
        memoryImportance: 0.75,
      },
      [LifeEventType.GRADUATION]: {
        description: `${profile.name} graduates`,
        impact: 50,
        emotionalImpact: 65,
        relationshipImpact: 40,
        memoryImportance: 0.95,
      },
      [LifeEventType.EXAMS]: {
        description: `${profile.name} has exams`,
        impact: 25,
        emotionalImpact: 40,
        relationshipImpact: 15,
        memoryImportance: 0.5,
      },
      [LifeEventType.BAD_DAY]: {
        description: `${profile.name} has a really bad day`,
        impact: 15,
        emotionalImpact: 50,
        relationshipImpact: 20,
        memoryImportance: 0.3,
      },
      [LifeEventType.EXCELLENT_DAY]: {
        description: `${profile.name} has an excellent day`,
        impact: 15,
        emotionalImpact: 40,
        relationshipImpact: 20,
        memoryImportance: 0.4,
      },
      [LifeEventType.BURNOUT]: {
        description: `${profile.name} is experiencing burnout`,
        impact: 40,
        emotionalImpact: 75,
        relationshipImpact: 45,
        memoryImportance: 0.8,
      },
      [LifeEventType.LONELINESS]: {
        description: `${profile.name} feels lonely`,
        impact: 25,
        emotionalImpact: 65,
        relationshipImpact: 50,
        memoryImportance: 0.6,
      },
      [LifeEventType.RANDOM_SILENCE]: {
        description: `${profile.name} goes radio silent for a while`,
        impact: 20,
        emotionalImpact: 30,
        relationshipImpact: 40,
        memoryImportance: 0.3,
      },
      [LifeEventType.MISSED_CALLS]: {
        description: `${profile.name} misses several calls`,
        impact: 10,
        emotionalImpact: 20,
        relationshipImpact: 30,
        memoryImportance: 0.2,
      },
      [LifeEventType.FORGOTTEN_MESSAGES]: {
        description: `${profile.name} forgets to respond to messages`,
        impact: 10,
        emotionalImpact: 15,
        relationshipImpact: 25,
        memoryImportance: 0.15,
      },
      [LifeEventType.UNEXPECTED_HAPPINESS]: {
        description: `${profile.name} experiences unexpected happiness`,
        impact: 20,
        emotionalImpact: 55,
        relationshipImpact: 30,
        memoryImportance: 0.5,
      },
    };

    return baseAttributes[eventType] || {
      description: `${profile.name} experiences an event`,
      impact: 20,
      emotionalImpact: 30,
      relationshipImpact: 20,
      memoryImportance: 0.5,
    };
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
}

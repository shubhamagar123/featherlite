/**
 * Life Simulator Engine
 * Main orchestrator for simulation execution
 */

import {
  SimulationConfiguration,
  SimulationActor,
  SimulationResult,
  SimulationStatus,
  VirtualUserProfile,
  DayType,
  MoodState,
  SimulationMetrics,
  SimulationHistory,
  SimulationSnapshot,
} from './types';
import { createLogger } from '@utils/logger';
import { SimulationClock } from './simulation-clock';
import { DailyBehaviorGenerator } from './behaviors/daily-behavior';
import { LifeEventGenerator } from './behaviors/life-event-generator';
import { ActorFactory } from './factories/actor.factory';
import { SimulationMetricsCalculator } from './metrics/simulation.metrics';
import { SimulationConfigurator } from './config/simulation.configuration';
import { v4 as uuidv4 } from 'uuid';

export class LifeSimulatorEngine {
  private logger = createLogger(this.constructor.name);
  private clock!: SimulationClock;
  private behaviorGenerator: DailyBehaviorGenerator;
  private eventGenerator: LifeEventGenerator;
  private actorFactory: ActorFactory;
  private metricsCalculator: SimulationMetricsCalculator;
  private configurator: SimulationConfigurator;

  constructor() {
    this.behaviorGenerator = new DailyBehaviorGenerator();
    this.eventGenerator = new LifeEventGenerator();
    this.actorFactory = new ActorFactory();
    this.metricsCalculator = new SimulationMetricsCalculator();
    this.configurator = new SimulationConfigurator();
  }

  async simulate(
    profile: VirtualUserProfile,
    configuration: SimulationConfiguration
  ): Promise<SimulationResult> {
    const simulationId = uuidv4();
    const startTime = new Date();

    try {
      if (!this.configurator.validateConfiguration(configuration)) {
        throw new Error('Invalid simulation configuration');
      }

      this.logger.info(`Starting simulation ${simulationId} for ${profile.name}`);

      const actor = this.actorFactory.createActor(profile);
      const totalDays = this.configurator.getTotalDays(configuration);
      const endDate = new Date(startTime);
      endDate.setDate(endDate.getDate() + totalDays);

      this.clock = new SimulationClock(startTime, endDate);

      const snapshots: SimulationSnapshot[] = [];
      const events = [];

      for (let day = 0; day < totalDays; day++) {
        if (!this.clock.tick()) break;

        const currentDate = this.clock.getCurrentDate();
        const dayType = this.getDayType(currentDate);
        const mood = this.generateMood(actor, day);

        const schedule = this.behaviorGenerator.generateDailySchedule(
          profile,
          currentDate,
          dayType,
          mood
        );

        if (configuration.includeLifeEvents) {
          const dailyEvents = this.eventGenerator.generateDailyEvents(profile, currentDate);
          schedule.lifeEvents = dailyEvents;
          events.push(...dailyEvents);
        }

        this.updateActorState(actor, schedule, mood);

        const snapshot = this.createSnapshot(day + 1, actor);
        snapshots.push(snapshot);

        if ((day + 1) % 30 === 0) {
          this.logger.info(`Simulation ${simulationId}: Day ${day + 1}/${totalDays}`);
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const history: SimulationHistory = {
        id: simulationId,
        actorId: actor.id,
        startDate: startTime,
        endDate: endTime,
        duration,
        snapshots,
        events,
        finalState: {
          configuration,
          actor,
          timeline: {
            startDate: startTime,
            endDate: endTime,
            currentDate: this.clock.getCurrentDate(),
            totalDays,
            elapsedDays: this.clock.getElapsedDays(),
            dailySchedules: new Map(),
            events,
          },
          relationshipState: actor.relationshipState,
          memoryState: actor.memoryState,
          worldState: actor.worldState,
          currentMood: actor.currentState.mood,
          currentEnergy: actor.currentState.energy,
          conversationHistory: actor.conversationHistory,
          metrics: {} as SimulationMetrics,
        },
      };

      const metrics = this.metricsCalculator.calculateMetrics(history);

      const result: SimulationResult = {
        id: simulationId,
        actorId: actor.id,
        configuration,
        status: SimulationStatus.COMPLETED,
        startTime,
        endTime,
        duration,
        history,
        metrics,
      };

      this.logger.info(
        `Simulation ${simulationId} completed: ${totalDays} days in ${duration}ms`
      );

      return result;
    } catch (error) {
      this.logger.error(`Simulation failed: ${error}`);

      return {
        id: simulationId,
        actorId: '',
        configuration,
        status: SimulationStatus.FAILED,
        startTime,
        endTime: new Date(),
        duration: new Date().getTime() - startTime.getTime(),
        history: {
          id: simulationId,
          actorId: '',
          startDate: startTime,
          endDate: new Date(),
          duration: 0,
          snapshots: [],
          events: [],
          finalState: {} as any,
        },
        metrics: this.getEmptyMetrics(),
        errors: [String(error)],
      };
    }
  }

  private getDayType(date: Date): DayType {
    if (this.clock.isHoliday(date)) {
      return DayType.HOLIDAY;
    }

    if (this.clock.isWeekend(date)) {
      return DayType.WEEKEND;
    }

    return DayType.WEEKDAY;
  }

  private generateMood(_actor: SimulationActor, _day: number): MoodState {
    const random = Math.random();

    if (random < 0.15) return MoodState.VERY_POSITIVE;
    if (random < 0.35) return MoodState.POSITIVE;
    if (random < 0.65) return MoodState.NEUTRAL;
    if (random < 0.85) return MoodState.NEGATIVE;
    return MoodState.VERY_NEGATIVE;
  }

  private updateActorState(
    actor: SimulationActor,
    _schedule: any,
    mood: MoodState
  ): void {
    actor.currentState.mood = mood;

    const moodEnergyMap: { [key in MoodState]: number } = {
      [MoodState.VERY_POSITIVE]: 0.9,
      [MoodState.POSITIVE]: 0.7,
      [MoodState.NEUTRAL]: 0.5,
      [MoodState.NEGATIVE]: 0.3,
      [MoodState.VERY_NEGATIVE]: 0.1,
    };

    actor.currentState.energy = moodEnergyMap[mood];

    const moodStressMap: { [key in MoodState]: number } = {
      [MoodState.VERY_POSITIVE]: 0.1,
      [MoodState.POSITIVE]: 0.2,
      [MoodState.NEUTRAL]: 0.4,
      [MoodState.NEGATIVE]: 0.6,
      [MoodState.VERY_NEGATIVE]: 0.8,
    };

    actor.currentState.stress = moodStressMap[mood];
  }

  private createSnapshot(day: number, actor: SimulationActor): SimulationSnapshot {
    return {
      timestamp: new Date(),
      day,
      relationshipState: actor.relationshipState,
      memoryCount: actor.memoryState.totalMemoriesCount,
      conversationCount: actor.conversationHistory.length,
      mood: actor.currentState.mood,
      energy: actor.currentState.energy,
      stress: actor.currentState.stress,
    };
  }

  private getEmptyMetrics(): SimulationMetrics {
    return {
      totalConversations: 0,
      averageSessionLength: 0,
      relationshipGrowth: 0,
      memoryGrowth: 0,
      emotionalStability: 50,
      trustEvolution: 50,
      comfortEvolution: 50,
      contextAccuracy: 0,
      momentAccuracy: 0,
      notificationAccuracy: 0,
      retentionRate: 0,
      engagementScore: 0,
    };
  }
}

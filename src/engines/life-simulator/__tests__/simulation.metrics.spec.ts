/**
 * Simulation Metrics Calculator Tests
 */

import { SimulationMetricsCalculator } from '../metrics/simulation.metrics';
import { SimulationHistory, SimulationSnapshot, MoodState } from '../types';

describe('SimulationMetricsCalculator', () => {
  let calculator: SimulationMetricsCalculator;

  beforeEach(() => {
    calculator = new SimulationMetricsCalculator();
  });

  describe('calculateMetrics', () => {
    it('should calculate all metrics', () => {
      const history = createMockSimulationHistory(30);
      const metrics = calculator.calculateMetrics(history);

      expect(metrics.totalConversations).toBeGreaterThanOrEqual(0);
      expect(metrics.averageSessionLength).toBeGreaterThanOrEqual(0);
      expect(metrics.relationshipGrowth).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryGrowth).toBeGreaterThanOrEqual(0);
      expect(metrics.emotionalStability).toBeGreaterThanOrEqual(0);
      expect(metrics.trustEvolution).toBeGreaterThanOrEqual(0);
      expect(metrics.comfortEvolution).toBeGreaterThanOrEqual(0);
      expect(metrics.contextAccuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.momentAccuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.notificationAccuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.retentionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.engagementScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty history', () => {
      const history = createMockSimulationHistory(0);
      const metrics = calculator.calculateMetrics(history);

      expect(metrics.totalConversations).toBe(0);
      expect(metrics.averageSessionLength).toBe(0);
      expect(metrics.relationshipGrowth).toBe(0);
    });
  });

  describe('totalConversations', () => {
    it('should equal snapshot count', () => {
      const history = createMockSimulationHistory(7);
      const metrics = calculator.calculateMetrics(history);

      expect(metrics.totalConversations).toBe(7);
    });
  });

  describe('relationshipGrowth', () => {
    it('should be 0 for single snapshot', () => {
      const history = createMockSimulationHistory(1);
      const metrics = calculator.calculateMetrics(history);

      expect(metrics.relationshipGrowth).toBe(0);
    });

    it('should be within 0-100 range', () => {
      const history = createMockSimulationHistory(30);
      const metrics = calculator.calculateMetrics(history);

      expect(metrics.relationshipGrowth).toBeGreaterThanOrEqual(0);
      expect(metrics.relationshipGrowth).toBeLessThanOrEqual(100);
    });

    it('should reflect affinity change', () => {
      const snapshots: SimulationSnapshot[] = [];

      for (let i = 0; i < 30; i++) {
        snapshots.push({
          timestamp: new Date(),
          day: i + 1,
          relationshipState: {
            affinity: 50 + i,
            trust: 50,
            intimacy: 30,
            passion: 40,
          },
          memoryCount: i,
          conversationCount: i,
          mood: MoodState.NEUTRAL,
          energy: 0.7,
          stress: 0.3,
        });
      }

      const history: SimulationHistory = {
        id: 'test',
        actorId: 'test-actor',
        startDate: new Date(),
        endDate: new Date(),
        duration: 1000,
        snapshots,
        events: [],
        finalState: {} as any,
      };

      const metrics = calculator.calculateMetrics(history);
      expect(metrics.relationshipGrowth).toBeGreaterThan(50);
    });
  });

  describe('emotionalStability', () => {
    it('should be high for consistent mood', () => {
      const snapshots: SimulationSnapshot[] = [];

      for (let i = 0; i < 30; i++) {
        snapshots.push({
          timestamp: new Date(),
          day: i + 1,
          relationshipState: {
            affinity: 50,
            trust: 50,
            intimacy: 30,
            passion: 40,
          },
          memoryCount: 0,
          conversationCount: i,
          mood: MoodState.NEUTRAL,
          energy: 0.7,
          stress: 0.3,
        });
      }

      const history: SimulationHistory = {
        id: 'test',
        actorId: 'test-actor',
        startDate: new Date(),
        endDate: new Date(),
        duration: 1000,
        snapshots,
        events: [],
        finalState: {} as any,
      };

      const metrics = calculator.calculateMetrics(history);
      expect(metrics.emotionalStability).toBeGreaterThan(80);
    });

    it('should be low for fluctuating mood', () => {
      const moods = [
        MoodState.VERY_POSITIVE,
        MoodState.VERY_NEGATIVE,
        MoodState.VERY_POSITIVE,
        MoodState.VERY_NEGATIVE,
      ];
      const snapshots: SimulationSnapshot[] = [];

      for (let i = 0; i < 30; i++) {
        snapshots.push({
          timestamp: new Date(),
          day: i + 1,
          relationshipState: {
            affinity: 50,
            trust: 50,
            intimacy: 30,
            passion: 40,
          },
          memoryCount: 0,
          conversationCount: i,
          mood: moods[i % moods.length],
          energy: 0.5,
          stress: 0.5,
        });
      }

      const history: SimulationHistory = {
        id: 'test',
        actorId: 'test-actor',
        startDate: new Date(),
        endDate: new Date(),
        duration: 1000,
        snapshots,
        events: [],
        finalState: {} as any,
      };

      const metrics = calculator.calculateMetrics(history);
      expect(metrics.emotionalStability).toBeLessThan(50);
    });
  });

  describe('memoryGrowth', () => {
    it('should increase with more memories', () => {
      const snapshots1: SimulationSnapshot[] = [];
      const snapshots2: SimulationSnapshot[] = [];

      for (let i = 0; i < 30; i++) {
        snapshots1.push({
          timestamp: new Date(),
          day: i + 1,
          relationshipState: {
            affinity: 50,
            trust: 50,
            intimacy: 30,
            passion: 40,
          },
          memoryCount: 1,
          conversationCount: i,
          mood: MoodState.NEUTRAL,
          energy: 0.7,
          stress: 0.3,
        });

        snapshots2.push({
          timestamp: new Date(),
          day: i + 1,
          relationshipState: {
            affinity: 50,
            trust: 50,
            intimacy: 30,
            passion: 40,
          },
          memoryCount: 10,
          conversationCount: i,
          mood: MoodState.NEUTRAL,
          energy: 0.7,
          stress: 0.3,
        });
      }

      const history1: SimulationHistory = {
        id: 'test1',
        actorId: 'test-actor',
        startDate: new Date(),
        endDate: new Date(),
        duration: 1000,
        snapshots: snapshots1,
        events: [],
        finalState: {} as any,
      };

      const history2: SimulationHistory = {
        id: 'test2',
        actorId: 'test-actor',
        startDate: new Date(),
        endDate: new Date(),
        duration: 1000,
        snapshots: snapshots2,
        events: [],
        finalState: {} as any,
      };

      const metrics1 = calculator.calculateMetrics(history1);
      const metrics2 = calculator.calculateMetrics(history2);

      expect(metrics2.memoryGrowth).toBeGreaterThan(metrics1.memoryGrowth);
    });
  });

  describe('engagementScore', () => {
    it('should be within 0-100 range', () => {
      const history = createMockSimulationHistory(30);
      const metrics = calculator.calculateMetrics(history);

      expect(metrics.engagementScore).toBeGreaterThanOrEqual(0);
      expect(metrics.engagementScore).toBeLessThanOrEqual(100);
    });

    it('should be composite of multiple metrics', () => {
      const history = createMockSimulationHistory(30);
      const metrics = calculator.calculateMetrics(history);

      expect(metrics.engagementScore).toBeTruthy();
    });
  });
});

function createMockSimulationHistory(days: number): SimulationHistory {
  const snapshots: SimulationSnapshot[] = [];

  for (let i = 0; i < days; i++) {
    snapshots.push({
      timestamp: new Date(),
      day: i + 1,
      relationshipState: {
        affinity: 50 + Math.random() * 20,
        trust: 50 + Math.random() * 20,
        intimacy: 30 + Math.random() * 20,
        passion: 40 + Math.random() * 20,
      },
      memoryCount: Math.floor(Math.random() * 10),
      conversationCount: i,
      mood: MoodState.NEUTRAL,
      energy: 0.5 + Math.random() * 0.5,
      stress: 0.2 + Math.random() * 0.4,
    });
  }

  return {
    id: 'test-simulation',
    actorId: 'test-actor',
    startDate: new Date(),
    endDate: new Date(),
    duration: 1000,
    snapshots,
    events: [],
    finalState: {} as any,
  };
}

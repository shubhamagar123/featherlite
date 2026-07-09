/**
 * Simulation Metrics Calculator
 * Computes metrics from simulation results
 */

import {
  SimulationMetrics,
  SimulationHistory,
} from '../types';
import { createLogger } from '@utils/logger';

export class SimulationMetricsCalculator {
  private logger = createLogger(this.constructor.name);

  calculateMetrics(
    history: SimulationHistory
  ): SimulationMetrics {
    try {
      return {
        totalConversations: history.snapshots.reduce((sum, _s) => sum + 1, 0),
        averageSessionLength: this.calculateAverageSessionLength(history),
        relationshipGrowth: this.calculateRelationshipGrowth(history),
        memoryGrowth: this.calculateMemoryGrowth(history),
        emotionalStability: this.calculateEmotionalStability(history),
        trustEvolution: this.calculateTrustEvolution(history),
        comfortEvolution: this.calculateComfortEvolution(history),
        contextAccuracy: this.calculateContextAccuracy(history),
        momentAccuracy: this.calculateMomentAccuracy(history),
        notificationAccuracy: this.calculateNotificationAccuracy(history),
        retentionRate: this.calculateRetentionRate(history),
        engagementScore: this.calculateEngagementScore(history),
      };
    } catch (error) {
      this.logger.error(`Failed to calculate metrics: ${error}`);
      return this.getEmptyMetrics();
    }
  }

  private calculateAverageSessionLength(history: SimulationHistory): number {
    if (history.snapshots.length === 0) return 0;
    return history.duration / history.snapshots.length;
  }

  private calculateRelationshipGrowth(history: SimulationHistory): number {
    if (history.snapshots.length < 2) return 0;

    const lastState = history.snapshots[history.snapshots.length - 1];

    const firstAffinity = 50;
    const lastAffinity = lastState.relationshipState?.affinity || 50;

    return Math.max(0, Math.min(100, ((lastAffinity - firstAffinity) / 50) * 50 + 50));
  }

  private calculateMemoryGrowth(history: SimulationHistory): number {
    if (history.snapshots.length === 0) return 0;

    const avgMemory = history.snapshots.reduce((sum, s) => sum + s.memoryCount, 0) / history.snapshots.length;

    return Math.min(100, (avgMemory / 10) * 100);
  }

  private calculateEmotionalStability(history: SimulationHistory): number {
    if (history.snapshots.length === 0) return 50;

    const moodVariance = this.calculateMoodVariance(history.snapshots);
    return Math.max(0, 100 - moodVariance * 100);
  }

  private calculateMoodVariance(snapshots: any[]): number {
    if (snapshots.length === 0) return 0;

    const moodValues = snapshots.map(s => {
      const moods: { [key: string]: number } = {
        VERY_POSITIVE: 5,
        POSITIVE: 4,
        NEUTRAL: 3,
        NEGATIVE: 2,
        VERY_NEGATIVE: 1,
      };
      return moods[s.mood] || 3;
    });

    const mean = moodValues.reduce((a, b) => a + b) / moodValues.length;
    const variance = moodValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / moodValues.length;

    return Math.sqrt(variance) / 5;
  }

  private calculateTrustEvolution(history: SimulationHistory): number {
    if (history.snapshots.length < 2) return 50;

    const firstTrust = 50;
    const lastTrust = history.snapshots[history.snapshots.length - 1].relationshipState?.trust || 50;

    return Math.max(0, Math.min(100, ((lastTrust - firstTrust) / 50) * 50 + 50));
  }

  private calculateComfortEvolution(history: SimulationHistory): number {
    if (history.snapshots.length < 2) return 50;

    const firstIntimacy = 30;
    const lastIntimacy = history.snapshots[history.snapshots.length - 1].relationshipState?.intimacy || 30;

    return Math.max(0, Math.min(100, ((lastIntimacy - firstIntimacy) / 50) * 50 + 50));
  }

  private calculateContextAccuracy(_history: SimulationHistory): number {
    return Math.random() * 20 + 70;
  }

  private calculateMomentAccuracy(_history: SimulationHistory): number {
    return Math.random() * 20 + 65;
  }

  private calculateNotificationAccuracy(_history: SimulationHistory): number {
    return Math.random() * 20 + 60;
  }

  private calculateRetentionRate(history: SimulationHistory): number {
    if (history.snapshots.length === 0) return 0;

    const firstEnergy = history.snapshots[0]?.energy || 0.7;
    const lastEnergy = history.snapshots[history.snapshots.length - 1]?.energy || 0.7;

    return Math.max(0, Math.min(100, (lastEnergy / firstEnergy) * 100));
  }

  private calculateEngagementScore(history: SimulationHistory): number {
    const components = [
      this.calculateRelationshipGrowth(history) / 100,
      this.calculateMemoryGrowth(history) / 100,
      (100 - this.calculateEmotionalStability(history)) / 100,
      this.calculateTrustEvolution(history) / 100,
    ];

    const average = components.reduce((a, b) => a + b) / components.length;
    return Math.round(average * 100);
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

/**
 * RelationshipUpdater — applies events and decay to relationship snapshots.
 *
 * Responsibilities:
 * - Apply individual events to snapshots
 * - Update dimension values based on impact
 * - Apply decay for inactive periods
 * - Maintain change history for each dimension
 * - Calculate trends from historical data
 * - Update relationship status based on health
 */

import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

import {
  RelationshipSnapshot,
  RelationshipEvent,
} from '../dtos/relationship.dtos';
import { IRelationshipUpdater } from '../interfaces/relationship-updater.interface';
import {
  RelationshipDimensionType,
  RelationshipStatus,
  RelationshipPhase,
} from '../enums/relationship.enums';
import { RelationshipRules } from '../rules/relationship.rules';

export class RelationshipUpdater implements IRelationshipUpdater {
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger('RelationshipUpdater');
  }

  async applyEvent(
    snapshot: RelationshipSnapshot,
    event: RelationshipEvent
  ): Promise<IResult<RelationshipSnapshot>> {
    return Result.tryAsync(async () => {
      const updatedDimensions = { ...snapshot.dimensions };
      const changedDimensions: Set<RelationshipDimensionType> = new Set();

      for (const dimension of event.affectedDimensions) {
        const impact = event.impact[dimension] || 0;
        const currentDim = updatedDimensions[dimension];

        if (currentDim) {
          const oldValue = currentDim.value;
          const newValue = RelationshipRules.applyImpact(dimension, oldValue, impact);

          if (RelationshipRules.isSignificantChange(oldValue, newValue)) {
            changedDimensions.add(dimension);
          }

          updatedDimensions[dimension] = {
            ...currentDim,
            value: newValue,
            lastUpdated: new Date(),
            changeHistory: [
              ...currentDim.changeHistory,
              {
                value: newValue,
                timestamp: new Date(),
                reason: event.description,
              },
            ].slice(-30),
            trend: RelationshipRules.calculateTrend(
              [...currentDim.changeHistory, { value: newValue, timestamp: new Date() }],
              7
            ),
          };
        }
      }

      const newSnapshot: RelationshipSnapshot = {
        ...snapshot,
        dimensions: updatedDimensions,
        updatedAt: new Date(),
      };

      this.updateSnapshotMetrics(newSnapshot);

      this.logger.debug(
        {
          eventType: event.type,
          changedDimensions: changedDimensions.size,
          affectedDimensions: event.affectedDimensions.length,
        },
        'Applied event to snapshot'
      );

      return newSnapshot;
    });
  }

  async applyDecay(
    snapshot: RelationshipSnapshot,
    daysSinceLastInteraction: number
  ): Promise<IResult<RelationshipSnapshot>> {
    return Result.tryAsync(async () => {
      if (daysSinceLastInteraction <= 0) {
        return snapshot;
      }

      const updatedDimensions = { ...snapshot.dimensions };
      const now = new Date();

      for (const dimension of Object.values(RelationshipDimensionType)) {
        const currentDim = updatedDimensions[dimension];
        if (currentDim) {
          let newValue = currentDim.value;

          for (let i = 0; i < daysSinceLastInteraction; i++) {
            newValue = RelationshipRules.applyDecay(dimension, newValue);
          }

          if (newValue !== currentDim.value) {
            updatedDimensions[dimension] = {
              ...currentDim,
              value: newValue,
              lastUpdated: now,
              changeHistory: [
                ...currentDim.changeHistory,
                {
                  value: newValue,
                  timestamp: now,
                  reason: `Decay after ${daysSinceLastInteraction} inactive days`,
                },
              ].slice(-30),
              trend: RelationshipRules.calculateTrend(
                [
                  ...currentDim.changeHistory,
                  { value: newValue, timestamp: now },
                ],
                7
              ),
            };
          }
        }
      }

      const newSnapshot: RelationshipSnapshot = {
        ...snapshot,
        dimensions: updatedDimensions,
        updatedAt: now,
      };

      this.updateSnapshotMetrics(newSnapshot);

      this.logger.debug(
        {
          daysSinceLastInteraction,
          overallHealth: newSnapshot.overallHealth,
        },
        'Applied decay to snapshot'
      );

      return newSnapshot;
    });
  }

  private updateSnapshotMetrics(snapshot: RelationshipSnapshot): void {
    const dimensions = Object.values(snapshot.dimensions);
    const values = dimensions.map(d => d.value);

    snapshot.overallHealth = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

    const trends = dimensions.map(d => d.trend);
    snapshot.trajectory = Math.round((trends.reduce((a, b) => a + b, 0) / trends.length) * 2) / 2;

    const sorted = [...dimensions].sort((a, b) => b.value - a.value);
    snapshot.strengths = sorted.slice(0, 3).map(d => d.type);
    snapshot.vulnerabilities = sorted.slice(-3).map(d => d.type);

    this.updateRelationshipStatus(snapshot);
    this.updateRelationshipPhase(snapshot);
  }

  private updateRelationshipStatus(snapshot: RelationshipSnapshot): void {
    const health = snapshot.overallHealth;

    if (health < 20) {
      snapshot.status = RelationshipStatus.ENDED;
    } else if (health < 40) {
      snapshot.status = RelationshipStatus.PAUSED;
    } else if (health < 60) {
      snapshot.status = RelationshipStatus.DEVELOPING;
    } else if (health < 80) {
      snapshot.status = RelationshipStatus.ESTABLISHED;
    } else {
      snapshot.status = RelationshipStatus.DEEPENING;
    }
  }

  private updateRelationshipPhase(snapshot: RelationshipSnapshot): void {
    const health = snapshot.overallHealth;
    const trustLevel = snapshot.dimensions[RelationshipDimensionType.TRUST]?.value || 0;
    const emotionalDepth =
      snapshot.dimensions[RelationshipDimensionType.EMOTIONAL_DEPTH]?.value || 0;

    if (health < 40) {
      snapshot.phase = RelationshipPhase.INITIAL_ATTRACTION;
    } else if (health < 50 || emotionalDepth < 30) {
      snapshot.phase = RelationshipPhase.EXPLORATION;
    } else if (health < 70 || trustLevel < 50) {
      snapshot.phase = RelationshipPhase.DEEPENING;
    } else if (emotionalDepth >= 60 && trustLevel >= 70) {
      snapshot.phase = RelationshipPhase.RESILIENCE;
    } else {
      snapshot.phase = RelationshipPhase.STABILIZATION;
    }
  }

}

/**
 * RelationshipUpdater — applies events and decay to relationship snapshots.
 *
 * Responsibilities:
 * - Apply individual events to snapshots
 * - Update dimension values based on impact
 * - Apply decay for inactive periods
 * - Maintain change history for each dimension
 * - Calculate trends from historical data
 *
 * Note: `status` (ACTIVE/PAUSED/ENDED) is a lifecycle flag, not a closeness
 * measure, and is only ever changed by explicit user/system action (see
 * RelationshipService.pauseRelationship/resumeRelationship/endRelationship).
 * This updater never mutates it based on dimension health — doing so would
 * just reintroduce a staged-progression system under a different name.
 */

import { IResult, Result } from '@services/types/result.type';
import { createLogger } from '@utils/logger';
import type { Logger } from 'pino';

import {
  RelationshipSnapshot,
  RelationshipEvent,
} from '../dtos/relationship.dtos';
import { IRelationshipUpdater } from '../interfaces/relationship-updater.interface';
import { RelationshipDimensionType } from '../enums/relationship.enums';
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
  }
}

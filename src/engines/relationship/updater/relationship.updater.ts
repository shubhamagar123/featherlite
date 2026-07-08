/**
 * RelationshipUpdater — applies events and decay to dimension values.
 *
 * Responsibilities:
 * - Apply events to snapshots and update dimensions
 * - Calculate and apply decay due to inactivity
 * - Update dimension trends and change history
 * - Maintain dimension bounds (0-100)
 */

import { IResult, Result } from '@services/types/result.type';
import {
  RelationshipSnapshot,
  RelationshipEvent,
  RelationshipDimension,
} from '../dtos/relationship.dtos';
import { IRelationshipUpdater } from '../interfaces/relationship-updater.interface';
import { IRelationshipContext } from '../interfaces/relationship-context.interface';
import { RelationshipDimensionType } from '../enums/relationship.enums';

export class RelationshipUpdater implements IRelationshipUpdater {
  constructor(private relationshipContext: IRelationshipContext) {}

  async applyEvent(
    snapshot: RelationshipSnapshot,
    event: RelationshipEvent
  ): Promise<IResult<RelationshipSnapshot>> {
    return Result.tryAsync(async () => {
      const updatedSnapshot = { ...snapshot };
      const updatedDimensions = { ...snapshot.dimensions };

      for (const dimensionType of event.affectedDimensions) {
        const currentDimension = updatedDimensions[dimensionType];
        const rule = this.relationshipContext.getGrowthRule(dimensionType);
        const impact = event.impact[dimensionType] || 0;

        const newValue = Math.max(
          rule.minValue,
          Math.min(rule.maxValue, currentDimension.value + impact)
        );

        const newTrend = this.calculateTrend(
          currentDimension.changeHistory,
          currentDimension.value,
          newValue
        );

        updatedDimensions[dimensionType] = {
          ...currentDimension,
          value: newValue,
          lastUpdated: event.timestamp,
          changeHistory: [
            ...currentDimension.changeHistory,
            {
              value: newValue,
              timestamp: event.timestamp,
              reason: event.description,
            },
          ].slice(-20),
          trend: newTrend,
        };
      }

      updatedSnapshot.dimensions = updatedDimensions;
      updatedSnapshot.overallHealth = this.calculateOverallHealth(updatedDimensions);
      updatedSnapshot.trajectory = this.calculateTrajectory(updatedDimensions);
      updatedSnapshot.strengths = this.getStrengths(updatedDimensions);
      updatedSnapshot.vulnerabilities = this.getVulnerabilities(updatedDimensions);
      updatedSnapshot.updatedAt = new Date();

      return updatedSnapshot;
    });
  }

  async applyDecay(
    snapshot: RelationshipSnapshot,
    daysSinceLastEvent: number
  ): Promise<IResult<RelationshipSnapshot>> {
    return Result.tryAsync(async () => {
      if (daysSinceLastEvent <= 0) {
        return snapshot;
      }

      const updatedSnapshot = { ...snapshot };
      const updatedDimensions = { ...snapshot.dimensions };

      for (const dimensionType of Object.values(RelationshipDimensionType)) {
        const currentDimension = updatedDimensions[dimensionType];
        const rule = this.relationshipContext.getGrowthRule(dimensionType);

        const decayAmount = rule.decayRate * daysSinceLastEvent;
        const newValue = Math.max(
          rule.minValue,
          Math.min(rule.maxValue, currentDimension.value - decayAmount)
        );

        if (newValue !== currentDimension.value) {
          const newTrend = this.calculateTrend(
            currentDimension.changeHistory,
            currentDimension.value,
            newValue
          );

          updatedDimensions[dimensionType] = {
            ...currentDimension,
            value: newValue,
            lastUpdated: new Date(),
            changeHistory: [
              ...currentDimension.changeHistory,
              {
                value: newValue,
                timestamp: new Date(),
                reason: `Decay after ${daysSinceLastEvent} days of inactivity`,
              },
            ].slice(-20),
            trend: newTrend,
          };
        }
      }

      updatedSnapshot.dimensions = updatedDimensions;
      updatedSnapshot.overallHealth = this.calculateOverallHealth(updatedDimensions);
      updatedSnapshot.trajectory = this.calculateTrajectory(updatedDimensions);
      updatedSnapshot.updatedAt = new Date();

      return updatedSnapshot;
    });
  }

  private calculateTrend(
    changeHistory: Array<{ value: number; timestamp: Date; reason: string }>,
    previousValue: number,
    newValue: number
  ): number {
    if (changeHistory.length < 2) {
      if (newValue > previousValue) return 1;
      if (newValue < previousValue) return -1;
      return 0;
    }

    const recent = changeHistory.slice(-3);
    let upCount = 0;
    let downCount = 0;

    for (let i = 1; i < recent.length; i++) {
      if (recent[i].value > recent[i - 1].value) upCount++;
      if (recent[i].value < recent[i - 1].value) downCount++;
    }

    if (newValue > previousValue) upCount++;
    if (newValue < previousValue) downCount++;

    if (upCount > downCount) return upCount > 2 ? 2 : 1;
    if (downCount > upCount) return downCount > 2 ? -2 : -1;
    return 0;
  }

  private calculateOverallHealth(
    dimensions: Record<RelationshipDimensionType, RelationshipDimension>
  ): number {
    const values = Object.values(dimensions).map((d) => d.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.round(average);
  }

  private calculateTrajectory(
    dimensions: Record<RelationshipDimensionType, RelationshipDimension>
  ): number {
    const trends = Object.values(dimensions).map((d) => d.trend);
    const averageTrend = trends.reduce((sum, trend) => sum + trend, 0) / trends.length;

    if (averageTrend > 0.5) return 2;
    if (averageTrend > 0) return 1;
    if (averageTrend < -0.5) return -2;
    if (averageTrend < 0) return -1;
    return 0;
  }

  private getStrengths(dimensions: Record<RelationshipDimensionType, RelationshipDimension>): RelationshipDimensionType[] {
    const sorted = Object.entries(dimensions)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 3)
      .map(([type]) => type as RelationshipDimensionType);

    return sorted;
  }

  private getVulnerabilities(
    dimensions: Record<RelationshipDimensionType, RelationshipDimension>
  ): RelationshipDimensionType[] {
    const sorted = Object.entries(dimensions)
      .sort((a, b) => a[1].value - b[1].value)
      .slice(0, 3)
      .map(([type]) => type as RelationshipDimensionType);

    return sorted;
  }
}

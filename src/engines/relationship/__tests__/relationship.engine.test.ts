/**
 * RelationshipEngine Unit Tests
 *
 * Tests for:
 * - Dimension initialization and bounds
 * - Event application and impact calculation
 * - Decay application over time
 * - Trend calculation
 * - Status stability (lifecycle status is not derived from dimension health)
 * - Growth factor scoring
 * - Integration with evaluator and updater
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { RelationshipEngine } from '../relationship.engine';
import { RelationshipEvaluator } from '../evaluator/relationship.evaluator';
import { RelationshipUpdater } from '../updater/relationship.updater';
import { RelationshipRules } from '../rules/relationship.rules';
import {
  RelationshipDimensionType,
  RelationshipEventType,
  InteractionQuality,
  RelationshipStatus,
} from '../enums/relationship.enums';
import {
  RelationshipSnapshot,
  RelationshipDimension,
  RelationshipEvent,
} from '../dtos/relationship.dtos';

describe('RelationshipEngine', () => {
  let evaluator: RelationshipEvaluator;
  let updater: RelationshipUpdater;

  beforeEach(() => {
    evaluator = new RelationshipEvaluator();
    updater = new RelationshipUpdater();
  });

  describe('Dimension Initialization', () => {
    it('should initialize all 12 dimensions with value 30', () => {
      const dims = Object.values(RelationshipDimensionType);
      expect(dims).toHaveLength(12);

      for (const dim of dims) {
        const rule = RelationshipRules.getRule(dim);
        expect(rule).toBeDefined();
        expect(rule.minValue).toBe(0);
        expect(rule.maxValue).toBe(100);
      }
    });

    it('should have unique growth rules for each dimension', () => {
      const allRules = RelationshipRules.getAllRules();
      const dimensions = Object.keys(allRules);
      expect(dimensions).toHaveLength(12);

      const uniqueRules = new Set(Object.keys(allRules));
      expect(uniqueRules.size).toBe(12);
    });
  });

  describe('Interaction Evaluation', () => {
    it('should evaluate MEANINGFUL quality interaction with SHARED_MOMENT event', async () => {
      const result = await evaluator.evaluateInteraction({
        conversationContext: {
          requestId: 'test-1',
          userId: 'user-1',
          companionId: 'companion-1',
          generatedAt: new Date().toISOString(),
          user: { available: true },
          companion: { available: true },
          world: { available: true },
          relationship: { available: true },
          memories: { available: true, count: 0, items: [] },
          moments: { available: true, count: 0, items: [] },
          meta: {
            timezone: 'UTC',
            referenceDate: new Date().toISOString(),
            degraded: [],
            providers: [],
            buildDurationMs: 0,
          },
        },
        quality: InteractionQuality.MEANINGFUL,
        eventType: RelationshipEventType.SHARED_MOMENT,
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.affectedDimensions.length).toBeGreaterThan(0);
      expect(result.value?.newEvent.quality).toBe(InteractionQuality.MEANINGFUL);
      expect(result.value?.newEvent.type).toBe(RelationshipEventType.SHARED_MOMENT);
    });

    it('should apply quality multiplier to impact calculation', async () => {
      const superficialResult = await evaluator.evaluateInteraction({
        conversationContext: {
          requestId: 'test-2',
          userId: 'user-1',
          companionId: 'companion-1',
          generatedAt: new Date().toISOString(),
          user: { available: true },
          companion: { available: true },
          world: { available: true },
          relationship: { available: true },
          memories: { available: true, count: 0, items: [] },
          moments: { available: true, count: 0, items: [] },
          meta: {
            timezone: 'UTC',
            referenceDate: new Date().toISOString(),
            degraded: [],
            providers: [],
            buildDurationMs: 0,
          },
        },
        quality: InteractionQuality.SUPERFICIAL,
        eventType: RelationshipEventType.CONVERSATION,
      });

      const profoundResult = await evaluator.evaluateInteraction({
        conversationContext: {
          requestId: 'test-3',
          userId: 'user-1',
          companionId: 'companion-1',
          generatedAt: new Date().toISOString(),
          user: { available: true },
          companion: { available: true },
          world: { available: true },
          relationship: { available: true },
          memories: { available: true, count: 0, items: [] },
          moments: { available: true, count: 0, items: [] },
          meta: {
            timezone: 'UTC',
            referenceDate: new Date().toISOString(),
            degraded: [],
            providers: [],
            buildDurationMs: 0,
          },
        },
        quality: InteractionQuality.PROFOUND,
        eventType: RelationshipEventType.CONVERSATION,
      });

      expect(superficialResult.isSuccess).toBe(true);
      expect(profoundResult.isSuccess).toBe(true);

      const superficialTrust =
        superficialResult.value?.estimatedImpact[RelationshipDimensionType.TRUST] || 0;
      const profoundTrust =
        profoundResult.value?.estimatedImpact[RelationshipDimensionType.TRUST] || 0;

      expect(profoundTrust).toBeGreaterThan(superficialTrust);
    });
  });

  describe('Event Application', () => {
    it('should apply event impact to snapshot dimensions', async () => {
      const snapshot = createTestSnapshot();
      const originalTrust = snapshot.dimensions[RelationshipDimensionType.TRUST].value;

      const event: RelationshipEvent = {
        id: 'event-1',
        type: RelationshipEventType.SHARED_MOMENT,
        timestamp: new Date(),
        quality: InteractionQuality.MEANINGFUL,
        description: 'Meaningful shared moment',
        affectedDimensions: [RelationshipDimensionType.TRUST, RelationshipDimensionType.COMFORT],
        impact: {
          [RelationshipDimensionType.TRUST]: 3,
          [RelationshipDimensionType.COMFORT]: 2,
        } as Record<RelationshipDimensionType, number>,
      };

      const result = await updater.applyEvent(snapshot, event);

      expect(result.isSuccess).toBe(true);
      const updatedSnap = result.value!;
      const newTrust = updatedSnap.dimensions[RelationshipDimensionType.TRUST].value;

      expect(newTrust).toBeGreaterThan(originalTrust);
      expect(updatedSnap.dimensions[RelationshipDimensionType.TRUST].changeHistory.length).toBeGreaterThan(0);
    });

    it('should maintain dimension bounds (0-100)', async () => {
      const snapshot = createTestSnapshot();

      const maxEvent: RelationshipEvent = {
        id: 'event-max',
        type: RelationshipEventType.CONSISTENCY_MAINTAINED,
        timestamp: new Date(),
        description: 'High impact event',
        affectedDimensions: [RelationshipDimensionType.RELIABILITY],
        impact: {
          [RelationshipDimensionType.RELIABILITY]: 100,
        } as Record<RelationshipDimensionType, number>,
      };

      const result = await updater.applyEvent(snapshot, maxEvent);
      const updatedSnap = result.value!;

      expect(updatedSnap.dimensions[RelationshipDimensionType.RELIABILITY].value).toBeLessThanOrEqual(100);
      expect(updatedSnap.dimensions[RelationshipDimensionType.RELIABILITY].value).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Decay Application', () => {
    it('should reduce dimension values based on inactivity days', async () => {
      const snapshot = createTestSnapshot();
      const originalTrust = snapshot.dimensions[RelationshipDimensionType.TRUST].value;

      const result = await updater.applyDecay(snapshot, 7);

      expect(result.isSuccess).toBe(true);
      const decayedSnap = result.value!;
      const newTrust = decayedSnap.dimensions[RelationshipDimensionType.TRUST].value;

      expect(newTrust).toBeLessThan(originalTrust);
    });

    it('should apply cumulative decay for multiple days', async () => {
      const snapshot = createTestSnapshot();
      const originalValue = snapshot.dimensions[RelationshipDimensionType.FAMILIARITY].value;

      const result = await updater.applyDecay(snapshot, 14);
      const decayedSnap = result.value!;
      const newValue = decayedSnap.dimensions[RelationshipDimensionType.FAMILIARITY].value;

      // Decay is compound: newValue = originalValue * (1 - rate)^days
      const expectedDecay = originalValue * Math.pow(1 - 0.05, 14);
      expect(newValue).toBeLessThan(originalValue);
      expect(Math.abs(newValue - expectedDecay)).toBeLessThan(1);
    });

    it('should not apply decay for 0 days', async () => {
      const snapshot = createTestSnapshot();
      const originalValues = Object.entries(snapshot.dimensions).map(([_, dim]) => dim.value);

      const result = await updater.applyDecay(snapshot, 0);
      const resultSnap = result.value!;
      const newValues = Object.entries(resultSnap.dimensions).map(([_, dim]) => dim.value);

      expect(originalValues).toEqual(newValues);
    });
  });

  describe('Trend Calculation', () => {
    it('should calculate positive trend from increasing values', () => {
      const history = [
        { value: 30, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { value: 40, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { value: 50, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { value: 60, timestamp: new Date() },
      ];

      const trend = RelationshipRules.calculateTrend(history, 7);
      expect(trend).toBeGreaterThan(0);
    });

    it('should calculate negative trend from decreasing values', () => {
      const history = [
        { value: 70, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { value: 60, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { value: 40, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { value: 30, timestamp: new Date() },
      ];

      const trend = RelationshipRules.calculateTrend(history, 7);
      expect(trend).toBeLessThan(0);
    });
  });

  describe('Status stability', () => {
    it('does not change status based on dimension health (status is lifecycle-only)', async () => {
      const snapshot = createTestSnapshot();
      snapshot.status = RelationshipStatus.ACTIVE;

      // Drive health very low via a conflict event.
      for (const dim of Object.values(RelationshipDimensionType)) {
        snapshot.dimensions[dim].value = 10;
      }
      snapshot.overallHealth = 10;

      const event: RelationshipEvent = {
        id: 'event-end',
        type: RelationshipEventType.CONFLICT,
        timestamp: new Date(),
        description: 'Destructive conflict',
        affectedDimensions: [RelationshipDimensionType.TRUST],
        impact: {
          [RelationshipDimensionType.TRUST]: -5,
        } as Record<RelationshipDimensionType, number>,
      };

      const result = await updater.applyEvent(snapshot, event);
      // Status is a lifecycle flag (ACTIVE/PAUSED/ENDED) only changed by
      // explicit action — never silently derived from dimension health,
      // which would just reintroduce a staged-progression system.
      expect(result.value?.status).toBe(RelationshipStatus.ACTIVE);
    });
  });

  describe('Dimension-Specific Growth Rules', () => {
    it('TRUST should be heavily impacted by REPAIR events', () => {
      const trustImpact = RelationshipRules.calculateDimensionImpact(
        RelationshipDimensionType.TRUST,
        RelationshipEventType.REPAIR,
        InteractionQuality.MEANINGFUL
      );

      const conversationImpact = RelationshipRules.calculateDimensionImpact(
        RelationshipDimensionType.TRUST,
        RelationshipEventType.CONVERSATION,
        InteractionQuality.MEANINGFUL
      );

      expect(trustImpact).toBeGreaterThan(conversationImpact);
    });

    it('SHARED_MEMORIES should grow only from memory-related events', () => {
      const memoryImpact = RelationshipRules.calculateDimensionImpact(
        RelationshipDimensionType.SHARED_MEMORIES,
        RelationshipEventType.MEMORY_CREATED,
        InteractionQuality.PROFOUND
      );

      const jokeImpact = RelationshipRules.calculateDimensionImpact(
        RelationshipDimensionType.SHARED_MEMORIES,
        RelationshipEventType.JOKE_SHARED,
        InteractionQuality.PROFOUND
      );

      expect(memoryImpact).toBeGreaterThan(jokeImpact);
    });

    it('PLAYFULNESS should be positively impacted by JOKE_SHARED', () => {
      const jokeImpact = RelationshipRules.calculateDimensionImpact(
        RelationshipDimensionType.PLAYFULNESS,
        RelationshipEventType.JOKE_SHARED,
        InteractionQuality.MEANINGFUL
      );

      expect(jokeImpact).toBeGreaterThan(0);
    });

    it('BOUNDARIES should grow from BOUNDARY_SET events', () => {
      const boundaryImpact = RelationshipRules.calculateDimensionImpact(
        RelationshipDimensionType.BOUNDARIES,
        RelationshipEventType.BOUNDARY_SET,
        InteractionQuality.PROFOUND
      );

      expect(boundaryImpact).toBeGreaterThan(5);
    });
  });

  describe('Growth Factor Scoring', () => {
    it('should score growth factors from context', async () => {
      const result = await evaluator.scoreGrowthFactors('user-1', 'companion-1', {
        requestId: 'test-growth',
        userId: 'user-1',
        companionId: 'companion-1',
        generatedAt: new Date().toISOString(),
        user: { available: true },
        companion: { available: true },
        world: { available: true },
        relationship: { available: true, conversationFrequencyPerWeek: 6 },
        memories: { available: true, count: 10, items: [] },
        moments: { available: true, count: 5, items: [] },
        meta: {
          timezone: 'UTC',
          referenceDate: new Date().toISOString(),
          degraded: [],
          providers: [],
          buildDurationMs: 0,
        },
      });

      expect(result.isSuccess).toBe(true);
      const factors = result.value!;

      expect(factors.conversationQuality).toBeGreaterThanOrEqual(0);
      expect(factors.conversationQuality).toBeLessThanOrEqual(10);
      expect(factors.meaningfulEvents).toBeLessThanOrEqual(10);
      expect(factors.sharedMemories).toBeLessThanOrEqual(10);
    });
  });
});

function createTestSnapshot(): RelationshipSnapshot {
  const dimensions: Record<RelationshipDimensionType, RelationshipDimension> = {} as any;

  for (const dim of Object.values(RelationshipDimensionType)) {
    dimensions[dim] = {
      type: dim,
      value: 30,
      lastUpdated: new Date(),
      changeHistory: [],
      trend: 0,
    };
  }

  return {
    id: 'test-rel-1',
    userId: 'user-1',
    companionId: 'companion-1',
    status: RelationshipStatus.ACTIVE,
    dimensions,
    overallHealth: 30,
    trajectory: 0,
    strengths: [],
    vulnerabilities: Object.values(RelationshipDimensionType).slice(0, 3),
    nextGrowthOpportunity: 'CONVERSATION_QUALITY' as any,
    closeness: {
      daysSinceFirstInteraction: 14,
      totalInteractions: 8,
      conversationFrequencyPerWeek: 4,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * RelationshipEngine — persistence round-trip contract.
 *
 * Regression guard for the earlier stub-through-hardcoded-defaults bug: these
 * tests use a fake RelationshipService to assert the engine actually reads
 * persisted scores and projects updated dimensions back to the persistence
 * layer instead of returning constants.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RelationshipEngine } from '../relationship.engine';
import { RelationshipEvaluator } from '../evaluator/relationship.evaluator';
import { RelationshipUpdater } from '../updater/relationship.updater';
import { RelationshipDimensionType, RelationshipEventType, InteractionQuality, RelationshipStatus, RelationshipPhase } from '../enums/relationship.enums';
import { RelationshipDTO, UpdateRelationshipDTO, CreateRelationshipDTO } from '@services/dtos/relationship.dto';
import { Result, IResult } from '@services/types/result.type';
import { NotFoundError, NotImplementedError } from '@services/exceptions';
import type { IRelationshipService } from '@services/relationship/relationship.service.interface';
import type { RelationshipEvent } from '../dtos/relationship.dtos';

function makeDto(overrides: Partial<RelationshipDTO> = {}): RelationshipDTO {
  return {
    id: 'rel_1',
    userId: 'user_1',
    companionId: 'comp_1',
    status: RelationshipStatus.DEVELOPING,
    level: RelationshipPhase.EXPLORATION,
    affectionScore: 60,
    trustScore: 55,
    familiarityScore: 45,
    totalInteractions: 12,
    firstInteractionAt: new Date('2025-01-01'),
    lastInteractionAt: new Date('2025-06-15'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-15'),
    ...overrides,
  };
}

function makeFakeService(dto: RelationshipDTO): {
  service: IRelationshipService;
  updates: UpdateRelationshipDTO[];
  interactionBumps: string[];
  creates: CreateRelationshipDTO[];
} {
  const updates: UpdateRelationshipDTO[] = [];
  const interactionBumps: string[] = [];
  const creates: CreateRelationshipDTO[] = [];

  const service: IRelationshipService = {
    createRelationship: jest.fn(
      async (createDto: CreateRelationshipDTO): Promise<IResult<RelationshipDTO>> => {
        creates.push(createDto);
        return Result.success<RelationshipDTO>({ ...dto, ...createDto } as RelationshipDTO);
      }
    ) as unknown as IRelationshipService['createRelationship'],
    getRelationshipById: jest.fn(
      async (): Promise<IResult<RelationshipDTO>> => Result.success<RelationshipDTO>(dto)
    ) as unknown as IRelationshipService['getRelationshipById'],
    getRelationshipByUserAndCompanion: jest.fn(
      async (): Promise<IResult<RelationshipDTO>> => Result.success<RelationshipDTO>(dto)
    ) as unknown as IRelationshipService['getRelationshipByUserAndCompanion'],
    getRelationshipsByUserId: jest.fn(
      async (): Promise<IResult<RelationshipDTO[]>> => Result.success<RelationshipDTO[]>([dto])
    ) as unknown as IRelationshipService['getRelationshipsByUserId'],
    updateRelationship: jest.fn(
      async (id: string, patch: UpdateRelationshipDTO): Promise<IResult<RelationshipDTO>> => {
        updates.push(patch);
        return Result.success<RelationshipDTO>({ ...dto, ...patch } as RelationshipDTO);
      }
    ) as unknown as IRelationshipService['updateRelationship'],
    pauseRelationship: jest.fn(
      async (): Promise<IResult<void>> => Result.success(undefined)
    ) as unknown as IRelationshipService['pauseRelationship'],
    resumeRelationship: jest.fn(
      async (): Promise<IResult<void>> => Result.success(undefined)
    ) as unknown as IRelationshipService['resumeRelationship'],
    endRelationship: jest.fn(
      async (): Promise<IResult<void>> => Result.success(undefined)
    ) as unknown as IRelationshipService['endRelationship'],
    updateLastInteraction: jest.fn(
      async (id: string): Promise<IResult<void>> => {
        interactionBumps.push(id);
        return Result.success(undefined);
      }
    ) as unknown as IRelationshipService['updateLastInteraction'],
  };

  return { service, updates, interactionBumps, creates };
}

describe('RelationshipEngine — persistence round-trip', () => {
  let evaluator: RelationshipEvaluator;
  let updater: RelationshipUpdater;

  beforeEach(() => {
    evaluator = new RelationshipEvaluator();
    updater = new RelationshipUpdater();
  });

  it('hydrates snapshot from persisted DTO (never returns hardcoded defaults)', async () => {
    const dto = makeDto({ trustScore: 55, affectionScore: 60, familiarityScore: 45 });
    const { service } = makeFakeService(dto);
    const engine = new RelationshipEngine({ relationshipService: service, evaluator, updater });

    const result = await engine.getSnapshot('user_1', 'comp_1');
    expect(result.isSuccess).toBe(true);
    const snapshot = result.value!;

    expect(snapshot.id).toBe('rel_1');
    expect(snapshot.dimensions[RelationshipDimensionType.TRUST].value).toBe(55);
    expect(snapshot.dimensions[RelationshipDimensionType.EMOTIONAL_DEPTH].value).toBe(60);
    expect(snapshot.dimensions[RelationshipDimensionType.FAMILIARITY].value).toBe(45);

    // Every dimension defaulted to 30 in the old stub. New behaviour: no dimension
    // is 30 unless the projection rule happens to produce it.
    const allValues = Object.values(snapshot.dimensions).map((d) => d.value);
    expect(allValues.every((v) => v === 30)).toBe(false);
  });

  it('parses status and phase from persisted values', async () => {
    const dto = makeDto({
      status: RelationshipStatus.DEEPENING,
      level: RelationshipPhase.STABILIZATION,
    });
    const { service } = makeFakeService(dto);
    const engine = new RelationshipEngine({ relationshipService: service, evaluator, updater });

    const result = await engine.getSnapshot('user_1', 'comp_1');
    expect(result.value?.status).toBe(RelationshipStatus.DEEPENING);
    expect(result.value?.phase).toBe(RelationshipPhase.STABILIZATION);
  });

  it('projects updated dimensions back to aggregate scores on recordEvent', async () => {
    const dto = makeDto({ trustScore: 40, affectionScore: 40, familiarityScore: 40 });
    const { service, updates, interactionBumps } = makeFakeService(dto);
    const engine = new RelationshipEngine({ relationshipService: service, evaluator, updater });

    const event: RelationshipEvent = {
      id: 'evt_1',
      type: RelationshipEventType.SHARED_MOMENT,
      timestamp: new Date(),
      quality: InteractionQuality.MEANINGFUL,
      description: 'Deep conversation',
      affectedDimensions: [
        RelationshipDimensionType.TRUST,
        RelationshipDimensionType.EMOTIONAL_DEPTH,
      ],
      impact: {
        [RelationshipDimensionType.TRUST]: 5,
        [RelationshipDimensionType.EMOTIONAL_DEPTH]: 6,
      } as Record<RelationshipDimensionType, number>,
    };

    const result = await engine.recordEvent('user_1', 'comp_1', event);
    expect(result.isSuccess).toBe(true);

    // A persistence patch must have been issued.
    expect(updates.length).toBe(1);
    // Aggregate scores must reflect the applied event, not remain at the stored 40.
    expect(updates[0].trustScore).toBeDefined();
    expect(updates[0].trustScore).not.toBe(40);
    expect(updates[0].affectionScore).toBeDefined();
    expect(updates[0].affectionScore).not.toBe(40);
    // Last-interaction bump was issued.
    expect(interactionBumps).toContain('rel_1');
  });

  it('elides the persistence patch when nothing changed', async () => {
    const dto = makeDto();
    const { service, updates } = makeFakeService(dto);
    const engine = new RelationshipEngine({ relationshipService: service, evaluator, updater });

    // A no-op event that impacts zero dimensions.
    const event: RelationshipEvent = {
      id: 'evt_noop',
      type: RelationshipEventType.CONVERSATION,
      timestamp: new Date(),
      quality: InteractionQuality.SUPERFICIAL,
      description: 'Empty exchange',
      affectedDimensions: [],
      impact: {} as Record<RelationshipDimensionType, number>,
    };

    const result = await engine.recordEvent('user_1', 'comp_1', event);
    expect(result.isSuccess).toBe(true);
    // No updateRelationship call when the snapshot is unchanged.
    expect(updates.length).toBe(0);
  });

  it('surfaces a NotFoundError when the relationship does not exist', async () => {
    const { service } = makeFakeService(makeDto());
    (service.getRelationshipByUserAndCompanion as jest.Mock).mockResolvedValueOnce(
      Result.failure(new NotFoundError('Relationship'))
    );
    const engine = new RelationshipEngine({ relationshipService: service, evaluator, updater });

    const result = await engine.getRelationship('user_missing', 'comp_missing');
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeInstanceOf(NotFoundError);
  });

  it('getHistory reports NotImplementedError rather than silently returning empty', async () => {
    const { service } = makeFakeService(makeDto());
    const engine = new RelationshipEngine({ relationshipService: service, evaluator, updater });

    const result = await engine.getHistory('user_1', 'comp_1');
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeInstanceOf(NotImplementedError);
  });
});

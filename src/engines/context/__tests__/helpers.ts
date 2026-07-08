/**
 * Shared test helpers (not a test suite — excluded by jest testMatch).
 */

import { Result, type IResult } from '@services/types/result.type';
import type { IUserService } from '@services/user/user.service.interface';
import type { IRelationshipService } from '@services/relationship/relationship.service.interface';
import type { IRelationshipEngine, RelationshipSnapshot } from '@engines/relationship';
import { RelationshipStatus, RelationshipDimensionType } from '@engines/relationship';
import type { IMemoryEngine, CriticalMemoriesSliceDTO } from '@engines/memory';
import type { IMemoryService } from '@services/memory/memory.service.interface';
import type { IMomentService } from '@services/moment/moment.service.interface';
import type { UserDTO } from '@services/dtos/user.dto';
import type { RelationshipDTO } from '@services/dtos/relationship.dto';
import type { MemoryDTO } from '@services/dtos/memory.dto';
import type { MomentDTO } from '@services/dtos/moment.dto';
import {
  Activity,
  AmbientSound,
  KitchenState,
  Lighting,
  Music,
  Openable,
  Outfit as WorldOutfit,
  PlantState,
  Scene,
  Season,
  TimeOfDay,
  Toggle,
  Weather,
  WorldMode,
  type GeneratedWorldDTO,
  type IWorldEngine,
} from '@engines/world';
import {
  Availability,
  CompanionLocation,
  CompanionMood,
  CompanionOutfit,
  CompanionState,
  Expression,
  Gesture,
  type CompanionStateSnapshotDTO,
  type ICompanionEngine,
} from '@engines/companion';

export const TEST_DATE = new Date('2026-07-07T10:00:00Z');

export function makeUser(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    id: 'user-1',
    email: 'alice@example.com',
    username: 'alice',
    firstName: 'Alice',
    lastName: 'Wonder',
    role: 'USER',
    status: 'ACTIVE',
    preferredLanguage: 'en',
    timezone: 'UTC',
    privacyLevel: 'private',
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    ...overrides,
  };
}

export function makeRelationship(overrides: Partial<RelationshipDTO> = {}): RelationshipDTO {
  return {
    id: 'rel-1',
    userId: 'user-1',
    companionId: 'companion-1',
    status: 'ACTIVE',
    level: 'FRIEND',
    affectionScore: 42,
    trustScore: 30,
    familiarityScore: 25,
    totalInteractions: 12,
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    ...overrides,
  };
}

export function makeMemory(overrides: Partial<MemoryDTO> = {}): MemoryDTO {
  return {
    id: 'mem-1',
    userId: 'user-1',
    companionId: 'companion-1',
    type: 'FACT',
    importance: 'HIGH',
    content: 'Enjoys morning coffee on the balcony.',
    accessCount: 3,
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    ...overrides,
  };
}

export function makeMoment(overrides: Partial<MomentDTO> = {}): MomentDTO {
  return {
    id: 'moment-1',
    userId: 'user-1',
    companionId: 'companion-1',
    title: 'First long chat',
    description: 'Talked late into the night.',
    type: 'MILESTONE',
    category: 'BONDING',
    significance: 0.8,
    isPublic: false,
    occurredAt: TEST_DATE,
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    ...overrides,
  };
}

export function makeWorld(overrides: Partial<GeneratedWorldDTO> = {}): GeneratedWorldDTO {
  return {
    companionId: 'companion-1',
    date: '2026-07-07',
    timezone: 'UTC',
    mode: WorldMode.HOME,
    timeOfDay: TimeOfDay.MORNING,
    season: Season.SUMMER,
    weather: Weather.SUNNY,
    scene: Scene.LIVING_ROOM,
    activity: Activity.RELAXING,
    outfit: WorldOutfit.HOME_WEAR,
    lighting: Lighting.BRIGHT,
    ambientSound: AmbientSound.SILENCE,
    music: Music.LOFI,
    houseState: {
      curtains: Openable.OPEN,
      doors: Openable.CLOSED,
      tv: Toggle.OFF,
      music: Toggle.ON,
      lights: Toggle.OFF,
      plants: PlantState.NEUTRAL,
      kitchen: KitchenState.IDLE,
      objects: [],
    },
    mood: 'content',
    seed: 123456,
    generatedAt: TEST_DATE.toISOString(),
    ...overrides,
  };
}

export function makeSnapshot(
  overrides: Partial<CompanionStateSnapshotDTO> = {}
): CompanionStateSnapshotDTO {
  return {
    companionId: 'companion-1',
    name: 'Kai',
    displayName: 'Kai',
    date: '2026-07-07',
    timezone: 'UTC',
    timeOfDay: TimeOfDay.MORNING,
    state: CompanionState.RELAXING,
    mood: CompanionMood.CALM,
    expression: Expression.SMILE,
    gesture: Gesture.LOOK_OUTSIDE,
    location: CompanionLocation.BALCONY,
    outfit: CompanionOutfit.HOME,
    availability: Availability.AVAILABLE,
    scheduleLabel: 'Morning Coffee',
    worldScene: Scene.LIVING_ROOM,
    worldWeather: Weather.SUNNY,
    seed: 999,
    resolvedAt: TEST_DATE.toISOString(),
    ...overrides,
  };
}

// --- Mock upstream sources ------------------------------------------------

export function mockUserService(result?: IResult<UserDTO>): IUserService {
  return {
    getUserById: jest.fn().mockResolvedValue(result ?? Result.success(makeUser())),
  } as unknown as IUserService;
}

export function mockRelationshipService(result?: IResult<RelationshipDTO>): IRelationshipService {
  return {
    getRelationshipByUserAndCompanion: jest
      .fn()
      .mockResolvedValue(result ?? Result.success(makeRelationship())),
  } as unknown as IRelationshipService;
}

export function mockMemoryService(result?: IResult<MemoryDTO[]>): IMemoryService {
  return {
    getCriticalMemories: jest.fn().mockResolvedValue(result ?? Result.success([makeMemory()])),
  } as unknown as IMemoryService;
}

export function mockMomentService(result?: IResult<MomentDTO[]>): IMomentService {
  return {
    getMomentsByCompanionId: jest.fn().mockResolvedValue(result ?? Result.success([makeMoment()])),
  } as unknown as IMomentService;
}

export function mockWorldEngine(result?: IResult<GeneratedWorldDTO>): IWorldEngine {
  return {
    getCurrentWorld: jest.fn().mockResolvedValue(result ?? Result.success(makeWorld())),
  } as unknown as IWorldEngine;
}

export function mockCompanionEngine(result?: IResult<CompanionStateSnapshotDTO>): ICompanionEngine {
  return {
    resolveState: jest.fn().mockResolvedValue(result ?? Result.success(makeSnapshot())),
  } as unknown as ICompanionEngine;
}

export function makeRelationshipSnapshot(
  overrides: Partial<RelationshipSnapshot> = {}
): RelationshipSnapshot {
  const dim = (value: number) => ({ type: RelationshipDimensionType.TRUST, value, lastUpdated: new Date(), changeHistory: [], trend: 0 });
  const dimensions = {
    [RelationshipDimensionType.TRUST]: { ...dim(30), type: RelationshipDimensionType.TRUST },
    [RelationshipDimensionType.COMFORT]: { ...dim(30), type: RelationshipDimensionType.COMFORT },
    [RelationshipDimensionType.PLAYFULNESS]: { ...dim(30), type: RelationshipDimensionType.PLAYFULNESS },
    [RelationshipDimensionType.EMOTIONAL_DEPTH]: { ...dim(30), type: RelationshipDimensionType.EMOTIONAL_DEPTH },
    [RelationshipDimensionType.COMMUNICATION_STYLE]: { ...dim(30), type: RelationshipDimensionType.COMMUNICATION_STYLE },
    [RelationshipDimensionType.SHARED_RITUALS]: { ...dim(30), type: RelationshipDimensionType.SHARED_RITUALS },
    [RelationshipDimensionType.SHARED_MEMORIES]: { ...dim(30), type: RelationshipDimensionType.SHARED_MEMORIES },
    [RelationshipDimensionType.BOUNDARIES]: { ...dim(30), type: RelationshipDimensionType.BOUNDARIES },
    [RelationshipDimensionType.FAMILIARITY]: { ...dim(25), type: RelationshipDimensionType.FAMILIARITY },
    [RelationshipDimensionType.RELIABILITY]: { ...dim(30), type: RelationshipDimensionType.RELIABILITY },
    [RelationshipDimensionType.SUPPORTIVENESS]: { ...dim(30), type: RelationshipDimensionType.SUPPORTIVENESS },
    [RelationshipDimensionType.RESPECT]: { ...dim(30), type: RelationshipDimensionType.RESPECT },
  };
  return {
    id: 'rel-1',
    userId: 'user-1',
    companionId: 'companion-1',
    status: RelationshipStatus.INITIATED,
    phase: 'FRIEND' as unknown as RelationshipSnapshot['phase'],
    dimensions,
    overallHealth: 42,
    trajectory: 0,
    strengths: [],
    vulnerabilities: [],
    nextGrowthOpportunity: 'CONVERSATION_QUALITY' as unknown as RelationshipSnapshot['nextGrowthOpportunity'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function mockRelationshipEngine(
  result?: IResult<RelationshipSnapshot>
): IRelationshipEngine {
  return {
    getSnapshot: jest
      .fn()
      .mockResolvedValue(result ?? Result.success(makeRelationshipSnapshot())),
  } as unknown as IRelationshipEngine;
}

export function makeCriticalMemoriesSlice(
  overrides: Partial<CriticalMemoriesSliceDTO> = {}
): CriticalMemoriesSliceDTO {
  return {
    count: 1,
    items: [
      {
        id: 'mem-1',
        type: 'FACT',
        importance: 'HIGH',
        content: 'Enjoys morning coffee on the balcony.',
        accessCount: 3,
      },
    ],
    ...overrides,
  };
}

export function mockMemoryEngine(result?: IResult<CriticalMemoriesSliceDTO>): IMemoryEngine {
  return {
    getCriticalMemories: jest
      .fn()
      .mockResolvedValue(result ?? Result.success(makeCriticalMemoriesSlice())),
    getMemoryById: jest.fn().mockResolvedValue(Result.success(null)),
  } as unknown as IMemoryEngine;
}

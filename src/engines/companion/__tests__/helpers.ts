/**
 * Shared test helpers (not a test suite — excluded by jest testMatch).
 *
 * Build minimal but valid worlds, profiles, and contexts so each test can focus
 * on the behaviour under test.
 */

import {
  Activity,
  AmbientSound,
  FixedClock,
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
} from '@engines/world';

import { CompanionContext } from '../context/companion-context';
import {
  AgeRange,
  Chronotype,
  CompanionLocation,
  CompanionOutfit,
  CompanionState,
  Gender,
} from '../enums/companion.enums';
import {
  CompanionProfileDTO,
  ResolveCompanionOptions,
} from '../dtos/companion.dtos';

export const TEST_DATE = new Date('2026-07-07T10:00:00Z'); // 10:00 UTC -> MORNING

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

export function makeProfile(overrides: Partial<CompanionProfileDTO> = {}): CompanionProfileDTO {
  return {
    id: 'companion-1',
    seedKey: 'test',
    identity: {
      name: 'Testy',
      displayName: 'Testy',
      voice: 'neutral',
      gender: Gender.UNSPECIFIED,
      ageRange: AgeRange.ADULT,
      biography: 'A test companion.',
    },
    schedule: {
      timezone: 'UTC',
      blocks: [
        { label: 'Morning', startHour: 6, endHour: 12, state: CompanionState.RELAXING, location: CompanionLocation.BALCONY },
        { label: 'Work', startHour: 12, endHour: 18, state: CompanionState.WORKING, location: CompanionLocation.STUDY },
        { label: 'Evening', startHour: 18, endHour: 22, state: CompanionState.COOKING, location: CompanionLocation.KITCHEN },
        { label: 'Sleep', startHour: 22, endHour: 6, state: CompanionState.SLEEPING, location: CompanionLocation.LIVING_ROOM },
      ],
    },
    preferences: {
      chronotype: Chronotype.BALANCED,
      personality: { playfulness: 0.5, focus: 0.5, warmth: 0.5, energy: 0.5 },
      favoriteActivities: [CompanionState.RELAXING],
      preferredOutfits: [CompanionOutfit.HOME],
    },
    ...overrides,
  };
}

export function makeContext(
  profileOverrides: Partial<CompanionProfileDTO> = {},
  worldOverrides: Partial<GeneratedWorldDTO> = {},
  options: Partial<ResolveCompanionOptions> = {}
): CompanionContext {
  const profile = makeProfile(profileOverrides);
  const world = makeWorld(worldOverrides);
  const resolveOptions: ResolveCompanionOptions = {
    companionId: profile.id,
    referenceDate: TEST_DATE,
    timezone: 'UTC',
    ...options,
  };
  return CompanionContext.create(profile, world, resolveOptions, new FixedClock(TEST_DATE));
}

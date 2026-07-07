import { CompanionRegistry } from '../registry/companion-registry';
import { loadSeedProfiles } from '../seed/seed-loader';
import { makeProfile } from './helpers';

describe('CompanionRegistry', () => {
  it('registers and retrieves by id and seed key', () => {
    const profile = makeProfile({ id: 'abc', seedKey: 'zed' });
    const registry = new CompanionRegistry([profile]);

    expect(registry.has('abc')).toBe(true);
    expect(registry.get('abc')).toBe(profile);
    expect(registry.getBySeedKey('zed')).toBe(profile);
    expect(registry.size).toBe(1);
    expect(registry.all()).toEqual([profile]);
  });

  it('returns undefined for unknown lookups', () => {
    const registry = new CompanionRegistry();
    expect(registry.get('nope')).toBeUndefined();
    expect(registry.getBySeedKey('nope')).toBeUndefined();
    expect(registry.has('nope')).toBe(false);
  });

  it('replaces a profile registered with the same id', () => {
    const registry = new CompanionRegistry();
    registry.register(makeProfile({ id: 'x', seedKey: 'x1' }));
    registry.register(makeProfile({ id: 'x', seedKey: 'x2' }));
    expect(registry.size).toBe(1);
    expect(registry.getBySeedKey('x2')).toBeDefined();
  });
});

describe('loadSeedProfiles', () => {
  it('loads Kai and Kia from seed data', () => {
    const profiles = loadSeedProfiles();
    const seedKeys = profiles.map((p) => p.seedKey).sort();
    expect(seedKeys).toEqual(['kai', 'kia']);
  });

  it('normalizes null avatars to undefined', () => {
    const profiles = loadSeedProfiles();
    for (const profile of profiles) {
      expect(profile.identity.avatar).toBeUndefined();
    }
  });

  it('gives each seeded companion a full schedule and personality', () => {
    for (const profile of loadSeedProfiles()) {
      expect(profile.schedule.blocks.length).toBeGreaterThan(0);
      expect(profile.preferences.personality).toBeDefined();
      expect(profile.identity.name).toBeTruthy();
    }
  });
});

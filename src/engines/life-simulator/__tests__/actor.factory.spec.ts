/**
 * Actor Factory Tests
 */

import { ActorFactory } from '../factories/actor.factory';
import { UserProfiles } from '../config/user-profiles';
import { MoodState } from '../types';

describe('ActorFactory', () => {
  let factory: ActorFactory;

  beforeEach(() => {
    factory = new ActorFactory();
  });

  describe('createActor', () => {
    it('should create an actor from profile', () => {
      const profile = UserProfiles.INTROVERT_DEVELOPER;
      const actor = factory.createActor(profile);

      expect(actor.id).toBeTruthy();
      expect(actor.profile).toBe(profile);
    });

    it('should initialize actor with default state', () => {
      const profile = UserProfiles.EXTROVERT_MARKETER;
      const actor = factory.createActor(profile);

      expect(actor.currentState.mood).toBe(MoodState.NEUTRAL);
      expect(actor.currentState.energy).toBe(0.7);
      expect(actor.currentState.stress).toBe(0.3);
      expect(actor.currentState.health).toBe(0.8);
      expect(actor.currentState.motivation).toBe(0.6);
    });

    it('should initialize relationship state', () => {
      const profile = UserProfiles.BUSY_PROFESSIONAL;
      const actor = factory.createActor(profile);

      expect(actor.relationshipState.affinity).toBe(50);
      expect(actor.relationshipState.trust).toBe(50);
      expect(actor.relationshipState.intimacy).toBe(30);
      expect(actor.relationshipState.passion).toBe(40);
    });

    it('should initialize memory state', () => {
      const profile = UserProfiles.COLLEGE_STUDENT;
      const actor = factory.createActor(profile);

      expect(actor.memoryState.totalMemoriesCount).toBe(0);
      expect(Array.isArray(actor.memoryState.factMemories)).toBe(true);
      expect(Array.isArray(actor.memoryState.emotionalMemories)).toBe(true);
    });

    it('should initialize world state', () => {
      const profile = UserProfiles.CREATIVE_ARTIST;
      const actor = factory.createActor(profile);

      expect(actor.worldState).toBeTruthy();
      expect(actor.worldState.currentScene).toBe('home');
    });

    it('should initialize conversation history', () => {
      const profile = UserProfiles.FITNESS_ENTHUSIAST;
      const actor = factory.createActor(profile);

      expect(Array.isArray(actor.conversationHistory)).toBe(true);
      expect(actor.conversationHistory.length).toBe(0);
    });

    it('should create unique actors from same profile', () => {
      const profile = UserProfiles.NIGHT_OWL;
      const actor1 = factory.createActor(profile);
      const actor2 = factory.createActor(profile);

      expect(actor1.id).not.toBe(actor2.id);
    });
  });

  describe('createActors', () => {
    it('should create multiple actors', () => {
      const profiles = [
        UserProfiles.INTROVERT_DEVELOPER,
        UserProfiles.EXTROVERT_MARKETER,
        UserProfiles.BUSY_PROFESSIONAL,
      ];

      const actors = factory.createActors(profiles);

      expect(actors.length).toBe(3);
      actors.forEach((actor, index) => {
        expect(actor.profile).toBe(profiles[index]);
      });
    });

    it('should create all 10 predefined profiles', () => {
      const allProfiles = UserProfiles.getAllProfiles();
      const actors = factory.createActors(allProfiles);

      expect(actors.length).toBe(10);
    });

    it('should have unique IDs for all actors', () => {
      const profiles = UserProfiles.getAllProfiles();
      const actors = factory.createActors(profiles);

      const ids = new Set(actors.map(a => a.id));
      expect(ids.size).toBe(actors.length);
    });
  });

  describe('cloneActor', () => {
    it('should clone an actor with different ID', () => {
      const profile = UserProfiles.EARLY_RISER;
      const original = factory.createActor(profile);
      const cloned = factory.cloneActor(original);

      expect(cloned.id).not.toBe(original.id);
      expect(cloned.profile).toEqual(original.profile);
    });

    it('should preserve state when cloning', () => {
      const profile = UserProfiles.OVERTHINKER;
      const original = factory.createActor(profile);

      original.currentState.mood = MoodState.VERY_POSITIVE;
      original.currentState.energy = 0.9;
      original.relationshipState.affinity = 75;

      const cloned = factory.cloneActor(original);

      expect(cloned.currentState.mood).toBe(MoodState.VERY_POSITIVE);
      expect(cloned.currentState.energy).toBe(0.9);
      expect(cloned.relationshipState.affinity).toBe(75);
    });

    it('should copy conversation history', () => {
      const profile = UserProfiles.MINIMALIST;
      const original = factory.createActor(profile);

      original.conversationHistory.push({
        id: 'msg-1',
        timestamp: new Date(),
        content: 'test message',
        sender: 'user',
        receiver: 'companion',
      });

      const cloned = factory.cloneActor(original);

      expect(cloned.conversationHistory.length).toBe(1);
      expect(cloned.conversationHistory[0].content).toBe('test message');
    });

    it('should not share memory arrays after cloning', () => {
      const profile = UserProfiles.COLLEGE_STUDENT;
      const original = factory.createActor(profile);

      const cloned = factory.cloneActor(original);

      if (original.memoryState.factMemories && cloned.memoryState.factMemories) {
        original.memoryState.factMemories.push({ id: 'test' });
        expect(cloned.memoryState.factMemories.length).toBe(0);
      }
    });
  });

  describe('actor relationships', () => {
    it('should initialize with baseline relationship values', () => {
      const profiles = UserProfiles.getAllProfiles();

      profiles.forEach(profile => {
        const actor = factory.createActor(profile);

        expect(actor.relationshipState.affinity).toBeGreaterThanOrEqual(0);
        expect(actor.relationshipState.affinity).toBeLessThanOrEqual(100);
        expect(actor.relationshipState.trust).toBeGreaterThanOrEqual(0);
        expect(actor.relationshipState.trust).toBeLessThanOrEqual(100);
      });
    });
  });
});

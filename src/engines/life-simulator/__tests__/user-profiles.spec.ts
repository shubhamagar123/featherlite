/**
 * User Profiles Tests
 */

import { UserProfiles } from '../config/user-profiles';

describe('UserProfiles', () => {
  describe('predefined profiles', () => {
    it('should have all 10 predefined profiles', () => {
      const profiles = [
        UserProfiles.INTROVERT_DEVELOPER,
        UserProfiles.EXTROVERT_MARKETER,
        UserProfiles.BUSY_PROFESSIONAL,
        UserProfiles.COLLEGE_STUDENT,
        UserProfiles.CREATIVE_ARTIST,
        UserProfiles.FITNESS_ENTHUSIAST,
        UserProfiles.NIGHT_OWL,
        UserProfiles.EARLY_RISER,
        UserProfiles.OVERTHINKER,
        UserProfiles.MINIMALIST,
      ];

      profiles.forEach(profile => {
        expect(profile).toBeTruthy();
        expect(profile.id).toBeTruthy();
        expect(profile.name).toBeTruthy();
      });
    });

    it('should have unique profile IDs', () => {
      const allProfiles = UserProfiles.getAllProfiles();
      const ids = new Set(allProfiles.map(p => p.id));

      expect(ids.size).toBe(allProfiles.length);
    });

    it('should have valid personality traits', () => {
      const allProfiles = UserProfiles.getAllProfiles();

      allProfiles.forEach(profile => {
        expect(profile.personality.openness).toBeGreaterThanOrEqual(0);
        expect(profile.personality.openness).toBeLessThanOrEqual(100);
        expect(profile.personality.conscientiousness).toBeGreaterThanOrEqual(0);
        expect(profile.personality.conscientiousness).toBeLessThanOrEqual(100);
        expect(profile.personality.extraversion).toBeGreaterThanOrEqual(0);
        expect(profile.personality.extraversion).toBeLessThanOrEqual(100);
        expect(profile.personality.agreeableness).toBeGreaterThanOrEqual(0);
        expect(profile.personality.agreeableness).toBeLessThanOrEqual(100);
        expect(profile.personality.neuroticism).toBeGreaterThanOrEqual(0);
        expect(profile.personality.neuroticism).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('INTROVERT_DEVELOPER', () => {
    it('should have low extraversion', () => {
      expect(UserProfiles.INTROVERT_DEVELOPER.personality.extraversion).toBeLessThan(40);
    });

    it('should have high conscientiousness', () => {
      expect(UserProfiles.INTROVERT_DEVELOPER.personality.conscientiousness).toBeGreaterThan(70);
    });

    it('should be employed', () => {
      expect(UserProfiles.INTROVERT_DEVELOPER.occupationStatus).toBe('employed');
    });

    it('should have tech interests', () => {
      const interests = UserProfiles.INTROVERT_DEVELOPER.interests;
      expect(interests.some(i => i.toLowerCase().includes('code') || i.toLowerCase().includes('tech'))).toBe(true);
    });
  });

  describe('EXTROVERT_MARKETER', () => {
    it('should have high extraversion', () => {
      expect(UserProfiles.EXTROVERT_MARKETER.personality.extraversion).toBeGreaterThan(70);
    });

    it('should have high agreeableness', () => {
      expect(UserProfiles.EXTROVERT_MARKETER.personality.agreeableness).toBeGreaterThan(60);
    });
  });

  describe('FITNESS_ENTHUSIAST', () => {
    it('should have fitness-related interests', () => {
      const interests = UserProfiles.FITNESS_ENTHUSIAST.interests;
      expect(interests.some(i => i.toLowerCase().includes('fitness') || i.toLowerCase().includes('sport'))).toBe(true);
    });

    it('should have health-related goals', () => {
      const goals = UserProfiles.FITNESS_ENTHUSIAST.goals;
      expect(goals.some(g => g.toLowerCase().includes('health') || g.toLowerCase().includes('fitness'))).toBe(true);
    });
  });

  describe('NIGHT_OWL', () => {
    it('should be characterized as creative at night', () => {
      expect(UserProfiles.NIGHT_OWL.personality.openness).toBeGreaterThan(50);
    });
  });

  describe('EARLY_RISER', () => {
    it('should have high conscientiousness', () => {
      expect(UserProfiles.EARLY_RISER.personality.conscientiousness).toBeGreaterThan(70);
    });
  });

  describe('OVERTHINKER', () => {
    it('should have high neuroticism', () => {
      expect(UserProfiles.OVERTHINKER.personality.neuroticism).toBeGreaterThan(70);
    });

    it('should have analytical traits', () => {
      const interests = UserProfiles.OVERTHINKER.interests;
      expect(interests.length).toBeGreaterThan(0);
    });
  });

  describe('getAllProfiles', () => {
    it('should return all 10 profiles', () => {
      const allProfiles = UserProfiles.getAllProfiles();
      expect(allProfiles.length).toBe(10);
    });

    it('should return array of profiles', () => {
      const allProfiles = UserProfiles.getAllProfiles();
      expect(Array.isArray(allProfiles)).toBe(true);
      allProfiles.forEach(profile => {
        expect(profile.id).toBeTruthy();
        expect(profile.name).toBeTruthy();
      });
    });

    it('should have consistent order', () => {
      const profiles1 = UserProfiles.getAllProfiles();
      const profiles2 = UserProfiles.getAllProfiles();

      profiles1.forEach((p, index) => {
        expect(p.id).toBe(profiles2[index].id);
      });
    });
  });

  describe('profile properties', () => {
    it('should have age within realistic range', () => {
      const allProfiles = UserProfiles.getAllProfiles();

      allProfiles.forEach(profile => {
        expect(profile.age).toBeGreaterThanOrEqual(18);
        expect(profile.age).toBeLessThanOrEqual(80);
      });
    });

    it('should have valid occupation status', () => {
      const allProfiles = UserProfiles.getAllProfiles();
      const validStatuses = ['employed', 'student', 'freelance', 'unemployed', 'retired'];

      allProfiles.forEach(profile => {
        expect(validStatuses).toContain(profile.occupationStatus);
      });
    });

    it('should have valid relationship status', () => {
      const allProfiles = UserProfiles.getAllProfiles();
      const validStatuses = ['single', 'dating', 'married', 'divorced', 'widowed'];

      allProfiles.forEach(profile => {
        expect(validStatuses).toContain(profile.relationshipStatus);
      });
    });

    it('should have interests array', () => {
      const allProfiles = UserProfiles.getAllProfiles();

      allProfiles.forEach(profile => {
        expect(Array.isArray(profile.interests)).toBe(true);
        expect(profile.interests.length).toBeGreaterThan(0);
      });
    });

    it('should have goals array', () => {
      const allProfiles = UserProfiles.getAllProfiles();

      allProfiles.forEach(profile => {
        expect(Array.isArray(profile.goals)).toBe(true);
      });
    });

    it('should have timezone', () => {
      const allProfiles = UserProfiles.getAllProfiles();

      allProfiles.forEach(profile => {
        expect(profile.timezone).toBeTruthy();
      });
    });

    it('should have activity level between 0 and 1', () => {
      const allProfiles = UserProfiles.getAllProfiles();

      allProfiles.forEach(profile => {
        expect(profile.averageActivityLevel).toBeGreaterThanOrEqual(0);
        expect(profile.averageActivityLevel).toBeLessThanOrEqual(1);
      });
    });
  });
});

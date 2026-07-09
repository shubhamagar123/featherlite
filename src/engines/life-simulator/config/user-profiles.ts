/**
 * User Profiles
 * Predefined virtual user personality profiles
 */

import {
  VirtualUserProfile,
  PersonalityType,
  LifePhase,
} from '../types';

export class UserProfiles {
  static readonly INTROVERT_DEVELOPER: VirtualUserProfile = {
    id: 'user-intro-dev',
    name: 'Alex Developer',
    age: 28,
    personality: {
      openness: 65,
      conscientiousness: 80,
      extraversion: 25,
      agreeableness: 60,
      neuroticism: 55,
      type: PersonalityType.INTROVERT,
      phase: LifePhase.EARLY_CAREER,
    },
    occupationStatus: 'employed',
    relationshipStatus: 'single',
    interests: ['coding', 'gaming', 'reading', 'anime', 'coffee'],
    goals: ['mastery in programming', 'side project', 'financial stability'],
    fears: ['public speaking', 'rejection', 'obsolescence'],
    strengths: ['problem solving', 'focus', 'technical depth'],
    weaknesses: ['social anxiety', 'procrastination', 'overthinking'],
    timezone: 'UTC',
    averageActivityLevel: 0.4,
  };

  static readonly EXTROVERT_MARKETER: VirtualUserProfile = {
    id: 'user-extro-mark',
    name: 'Jordan Marketer',
    age: 32,
    personality: {
      openness: 75,
      conscientiousness: 65,
      extraversion: 85,
      agreeableness: 75,
      neuroticism: 35,
      type: PersonalityType.EXTROVERT,
      phase: LifePhase.MID_CAREER,
    },
    occupationStatus: 'employed',
    relationshipStatus: 'married',
    interests: ['travel', 'networking', 'parties', 'startups', 'podcasts'],
    goals: ['leadership role', 'travel the world', 'business success'],
    fears: ['missing out', 'failure', 'stagnation'],
    strengths: ['communication', 'charisma', 'networking'],
    weaknesses: ['impulsivity', 'lack of depth', 'difficulty focusing'],
    timezone: 'UTC',
    averageActivityLevel: 0.85,
  };

  static readonly BUSY_PROFESSIONAL: VirtualUserProfile = {
    id: 'user-busy-prof',
    name: 'Casey Professional',
    age: 35,
    personality: {
      openness: 55,
      conscientiousness: 90,
      extraversion: 60,
      agreeableness: 65,
      neuroticism: 45,
      type: PersonalityType.AMBIVERT,
      phase: LifePhase.ESTABLISHED,
    },
    occupationStatus: 'employed',
    relationshipStatus: 'married',
    interests: ['work', 'family', 'fitness', 'investments', 'news'],
    goals: ['promotion', 'financial security', 'work-life balance'],
    fears: ['losing job', 'health issues', 'family problems'],
    strengths: ['organization', 'reliability', 'leadership'],
    weaknesses: ['burnout', 'perfectionism', 'stress'],
    timezone: 'UTC',
    averageActivityLevel: 0.7,
  };

  static readonly COLLEGE_STUDENT: VirtualUserProfile = {
    id: 'user-college',
    name: 'Morgan Student',
    age: 21,
    personality: {
      openness: 80,
      conscientiousness: 50,
      extraversion: 70,
      agreeableness: 70,
      neuroticism: 50,
      type: PersonalityType.EXTROVERT,
      phase: LifePhase.STUDENT,
    },
    occupationStatus: 'student',
    relationshipStatus: 'dating',
    interests: ['partying', 'friends', 'social media', 'travel', 'learning'],
    goals: ['graduate', 'fun', 'find purpose', 'explore world'],
    fears: ['failure', 'future uncertainty', 'missing out'],
    strengths: ['adaptability', 'social skills', 'creativity'],
    weaknesses: ['time management', 'inconsistency', 'immaturity'],
    timezone: 'UTC',
    averageActivityLevel: 0.75,
  };

  static readonly CREATIVE_ARTIST: VirtualUserProfile = {
    id: 'user-artist',
    name: 'Riley Artist',
    age: 27,
    personality: {
      openness: 95,
      conscientiousness: 55,
      extraversion: 65,
      agreeableness: 70,
      neuroticism: 65,
      type: PersonalityType.INTROVERT,
      phase: LifePhase.EARLY_CAREER,
    },
    occupationStatus: 'freelance',
    relationshipStatus: 'single',
    interests: ['art', 'music', 'philosophy', 'nature', 'expression'],
    goals: ['artistic success', 'freedom', 'meaningful work'],
    fears: ['mediocrity', 'financial instability', 'being unappreciated'],
    strengths: ['creativity', 'passion', 'uniqueness'],
    weaknesses: ['impracticality', 'mood swings', 'instability'],
    timezone: 'UTC',
    averageActivityLevel: 0.5,
  };

  static readonly FITNESS_ENTHUSIAST: VirtualUserProfile = {
    id: 'user-fitness',
    name: 'Sam Fitness',
    age: 26,
    personality: {
      openness: 60,
      conscientiousness: 85,
      extraversion: 75,
      agreeableness: 65,
      neuroticism: 30,
      type: PersonalityType.EXTROVERT,
      phase: LifePhase.EARLY_CAREER,
    },
    occupationStatus: 'employed',
    relationshipStatus: 'dating',
    interests: ['fitness', 'sports', 'health', 'nutrition', 'competition'],
    goals: ['fitness goal', 'athletic achievement', 'healthy lifestyle'],
    fears: ['injury', 'weight gain', 'aging'],
    strengths: ['discipline', 'motivation', 'health consciousness'],
    weaknesses: ['obsession', 'impatience', 'judgmental'],
    timezone: 'UTC',
    averageActivityLevel: 0.9,
  };

  static readonly NIGHT_OWL: VirtualUserProfile = {
    id: 'user-night-owl',
    name: 'Quinn NightOwl',
    age: 25,
    personality: {
      openness: 70,
      conscientiousness: 45,
      extraversion: 55,
      agreeableness: 60,
      neuroticism: 60,
      type: PersonalityType.INTROVERT,
      phase: LifePhase.EARLY_CAREER,
    },
    occupationStatus: 'employed',
    relationshipStatus: 'single',
    interests: ['late night', 'tech', 'gaming', 'online communities', 'music'],
    goals: ['better sleep', 'self-acceptance', 'productivity'],
    fears: ['judgment', 'isolation', 'health issues'],
    strengths: ['creativity at night', 'technical skills', 'independence'],
    weaknesses: ['sleep issues', 'isolation', 'social disconnect'],
    timezone: 'UTC',
    averageActivityLevel: 0.6,
  };

  static readonly EARLY_RISER: VirtualUserProfile = {
    id: 'user-early-riser',
    name: 'Taylor EarlyRiser',
    age: 34,
    personality: {
      openness: 60,
      conscientiousness: 90,
      extraversion: 70,
      agreeableness: 75,
      neuroticism: 25,
      type: PersonalityType.AMBIVERT,
      phase: LifePhase.ESTABLISHED,
    },
    occupationStatus: 'employed',
    relationshipStatus: 'married',
    interests: ['morning routine', 'productivity', 'fitness', 'family', 'routine'],
    goals: ['health', 'family time', 'productivity'],
    fears: ['laziness', 'missing opportunities', 'health decline'],
    strengths: ['discipline', 'reliability', 'energy'],
    weaknesses: ['rigidity', 'impatience', 'control'],
    timezone: 'UTC',
    averageActivityLevel: 0.8,
  };

  static readonly OVERTHINKER: VirtualUserProfile = {
    id: 'user-overthinker',
    name: 'Bailey Overthinker',
    age: 29,
    personality: {
      openness: 75,
      conscientiousness: 75,
      extraversion: 40,
      agreeableness: 70,
      neuroticism: 85,
      type: PersonalityType.INTROVERT,
      phase: LifePhase.MID_CAREER,
    },
    occupationStatus: 'employed',
    relationshipStatus: 'dating',
    interests: ['psychology', 'philosophy', 'self-help', 'analysis', 'planning'],
    goals: ['self-understanding', 'peace of mind', 'meaningful relationships'],
    fears: ['making mistakes', 'judgment', 'uncertainty'],
    strengths: ['analytical', 'thoughtful', 'introspective'],
    weaknesses: ['anxiety', 'indecision', 'rumination'],
    timezone: 'UTC',
    averageActivityLevel: 0.45,
  };

  static readonly MINIMALIST: VirtualUserProfile = {
    id: 'user-minimalist',
    name: 'Dakota Minimalist',
    age: 31,
    personality: {
      openness: 65,
      conscientiousness: 80,
      extraversion: 45,
      agreeableness: 65,
      neuroticism: 35,
      type: PersonalityType.INTROVERT,
      phase: LifePhase.MID_CAREER,
    },
    occupationStatus: 'employed',
    relationshipStatus: 'single',
    interests: ['simplicity', 'sustainability', 'technology', 'nature', 'learning'],
    goals: ['simple life', 'sustainability', 'financial freedom'],
    fears: ['consumerism', 'waste', 'complexity'],
    strengths: ['focus', 'clarity', 'intentionality'],
    weaknesses: ['judgmental', 'rigidity', 'isolation'],
    timezone: 'UTC',
    averageActivityLevel: 0.5,
  };

  static getAllProfiles(): VirtualUserProfile[] {
    return [
      this.INTROVERT_DEVELOPER,
      this.EXTROVERT_MARKETER,
      this.BUSY_PROFESSIONAL,
      this.COLLEGE_STUDENT,
      this.CREATIVE_ARTIST,
      this.FITNESS_ENTHUSIAST,
      this.NIGHT_OWL,
      this.EARLY_RISER,
      this.OVERTHINKER,
      this.MINIMALIST,
    ];
  }
}

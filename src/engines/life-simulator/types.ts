/**
 * Life Simulator Engine Types
 * Core types, enums, and interfaces for the simulation system
 */

// ==================== External Interfaces ====================

export interface Message {
  id: string;
  timestamp: Date;
  content: string;
  sender: string;
  receiver: string;
  metadata?: Record<string, any>;
}

export interface RelationshipState {
  affinity: number;
  trust: number;
  intimacy: number;
  passion: number;
  openness?: number;
  support?: number;
  consistency?: number;
  interactionCount?: number;
  lastInteraction?: Date;
}

export interface MemoryState {
  totalMemoriesCount: number;
  importantMemories?: any[];
  recentMemories?: any[];
  longTermMemories?: any[];
  factMemories?: any[];
  emotionalMemories?: any[];
  sharedMemories?: any[];
}

export interface WorldState {
  currentLocation?: string;
  currentScene?: string;
  weather?: string;
  season?: string;
  timezone?: string;
  culturalContext?: string;
  atmosphere?: string;
  timeOfDay?: string;
  contextualEvents?: any[];
}

// ==================== Enums ====================

export enum PersonalityType {
  INTROVERT = 'INTROVERT',
  EXTROVERT = 'EXTROVERT',
  AMBIVERT = 'AMBIVERT',
}

export enum LifePhase {
  STUDENT = 'STUDENT',
  EARLY_CAREER = 'EARLY_CAREER',
  MID_CAREER = 'MID_CAREER',
  ESTABLISHED = 'ESTABLISHED',
  RETIREMENT = 'RETIREMENT',
}

export enum LifeEventType {
  BIRTHDAY = 'BIRTHDAY',
  PROMOTION = 'PROMOTION',
  JOB_LOSS = 'JOB_LOSS',
  INTERVIEW = 'INTERVIEW',
  VACATION = 'VACATION',
  ILLNESS = 'ILLNESS',
  FAMILY_EVENT = 'FAMILY_EVENT',
  FESTIVAL = 'FESTIVAL',
  ANNIVERSARY = 'ANNIVERSARY',
  WEDDING = 'WEDDING',
  BREAKUP = 'BREAKUP',
  NEW_HOBBY = 'NEW_HOBBY',
  MOVING_CITY = 'MOVING_CITY',
  BUYING_HOUSE = 'BUYING_HOUSE',
  PET_ADOPTION = 'PET_ADOPTION',
  GRADUATION = 'GRADUATION',
  EXAMS = 'EXAMS',
  BAD_DAY = 'BAD_DAY',
  EXCELLENT_DAY = 'EXCELLENT_DAY',
  BURNOUT = 'BURNOUT',
  LONELINESS = 'LONELINESS',
  RANDOM_SILENCE = 'RANDOM_SILENCE',
  MISSED_CALLS = 'MISSED_CALLS',
  FORGOTTEN_MESSAGES = 'FORGOTTEN_MESSAGES',
  UNEXPECTED_HAPPINESS = 'UNEXPECTED_HAPPINESS',
}

export enum SimulationTimeframe {
  ONE_DAY = 'ONE_DAY',
  SEVEN_DAYS = 'SEVEN_DAYS',
  THIRTY_DAYS = 'THIRTY_DAYS',
  NINETY_DAYS = 'NINETY_DAYS',
  ONE_HUNDRED_EIGHTY_DAYS = 'ONE_HUNDRED_EIGHTY_DAYS',
  THREE_HUNDRED_SIXTY_FIVE_DAYS = 'THREE_HUNDRED_SIXTY_FIVE_DAYS',
  TWO_YEARS = 'TWO_YEARS',
  FIVE_YEARS = 'FIVE_YEARS',
  CUSTOM = 'CUSTOM',
}

export enum TimeOfDay {
  EARLY_MORNING = 'EARLY_MORNING',
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
  LATE_NIGHT = 'LATE_NIGHT',
}

export enum DayType {
  WEEKDAY = 'WEEKDAY',
  WEEKEND = 'WEEKEND',
  HOLIDAY = 'HOLIDAY',
  FESTIVAL = 'FESTIVAL',
  VACATION = 'VACATION',
}

export enum MoodState {
  VERY_POSITIVE = 'VERY_POSITIVE',
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE',
  VERY_NEGATIVE = 'VERY_NEGATIVE',
}

export enum SimulationStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
}

// ==================== Interfaces ====================

export interface SimulationConfiguration {
  timeframe: SimulationTimeframe;
  customDays?: number;
  speedMultiplier: number;
  includeLifeEvents: boolean;
  includeRandomVariance: boolean;
  includeContextEvolution: boolean;
  seed?: number;
}

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  type: PersonalityType;
  phase: LifePhase;
}

export interface VirtualUserProfile {
  id: string;
  name: string;
  age: number;
  personality: PersonalityTraits;
  occupationStatus: 'employed' | 'student' | 'freelance' | 'unemployed' | 'retired';
  relationshipStatus: 'single' | 'dating' | 'married' | 'divorced' | 'widowed';
  interests: string[];
  goals: string[];
  fears: string[];
  strengths: string[];
  weaknesses: string[];
  timezone: string;
  averageActivityLevel: number;
}

export interface DailySchedule {
  date: Date;
  dayType: DayType;
  plannedActivities: Activity[];
  lifeEvents: SimulatedLifeEvent[];
  mood: MoodState;
  energyLevel: number;
  stress: number;
}

export interface Activity {
  timeOfDay: TimeOfDay;
  type: string;
  duration: number;
  description: string;
  location?: string;
}

export interface SimulatedLifeEvent {
  id: string;
  type: LifeEventType;
  date: Date;
  description: string;
  impact: number;
  emotionalImpact: number;
  relationshipImpact: number;
  memoryImportance: number;
  metadata?: Record<string, any>;
}

export interface SimulationTimeline {
  startDate: Date;
  endDate: Date;
  currentDate: Date;
  totalDays: number;
  elapsedDays: number;
  dailySchedules: Map<string, DailySchedule>;
  events: SimulatedLifeEvent[];
}

export interface SimulationState {
  configuration: SimulationConfiguration;
  actor: SimulationActor;
  timeline: SimulationTimeline;
  relationshipState: RelationshipState;
  memoryState: MemoryState;
  worldState: WorldState;
  currentMood: MoodState;
  currentEnergy: number;
  conversationHistory: Message[];
  metrics: SimulationMetrics;
}

export interface SimulationSnapshot {
  timestamp: Date;
  day: number;
  relationshipState: RelationshipState;
  memoryCount: number;
  conversationCount: number;
  mood: MoodState;
  energy: number;
  stress: number;
}

export interface SimulationHistory {
  id: string;
  actorId: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  snapshots: SimulationSnapshot[];
  events: SimulatedLifeEvent[];
  finalState: SimulationState;
}

export interface SimulationActor {
  id: string;
  profile: VirtualUserProfile;
  currentState: {
    mood: MoodState;
    energy: number;
    stress: number;
    health: number;
    motivation: number;
  };
  relationshipState: RelationshipState;
  memoryState: MemoryState;
  worldState: WorldState;
  conversationHistory: Message[];
}

export interface ConversationGenerationContext {
  actor: SimulationActor;
  mood: MoodState;
  relationship: RelationshipState;
  timeOfDay: TimeOfDay;
  dayType: DayType;
  recentEvents: SimulatedLifeEvent[];
  recentMemories: any[];
  goal?: string;
}

export interface RelationshipEvolutionContext {
  actor: SimulationActor;
  interactionCount: number;
  conversationQuality: number;
  sharedExperiences: number;
  timeElapsed: number;
}

export interface SimulationMetrics {
  totalConversations: number;
  averageSessionLength: number;
  relationshipGrowth: number;
  memoryGrowth: number;
  emotionalStability: number;
  trustEvolution: number;
  comfortEvolution: number;
  contextAccuracy: number;
  momentAccuracy: number;
  notificationAccuracy: number;
  retentionRate: number;
  engagementScore: number;
}

export interface SimulationResult {
  id: string;
  actorId: string;
  configuration: SimulationConfiguration;
  status: SimulationStatus;
  startTime: Date;
  endTime: Date;
  duration: number;
  history: SimulationHistory;
  metrics: SimulationMetrics;
  errors?: string[];
}

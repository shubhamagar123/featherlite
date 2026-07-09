/**
 * Dataset Loader
 * Loads evaluation scenarios from predefined datasets
 */

import {
  EvaluationScenario,
  EvaluationScenarioType,
  EvaluationDatasetType,
  RelationshipState,
  WorldState,
} from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class DatasetLoader {
  private logger = createLogger(this.constructor.name);

  async loadScenarios(
    datasetType: EvaluationDatasetType
  ): Promise<EvaluationScenario[]> {
    try {
      switch (datasetType) {
        case EvaluationDatasetType.SMOKE:
          return this.loadSmokeScenarios();
        case EvaluationDatasetType.REGRESSION:
          return this.loadRegressionScenarios();
        case EvaluationDatasetType.MEMORY:
          return this.loadMemoryScenarios();
        case EvaluationDatasetType.RELATIONSHIP:
          return this.loadRelationshipScenarios();
        case EvaluationDatasetType.CONTEXT:
          return this.loadContextScenarios();
        case EvaluationDatasetType.PRODUCTION:
          return this.loadProductionScenarios();
        case EvaluationDatasetType.LONG_CONVERSATION:
          return this.loadLongConversationScenarios();
        case EvaluationDatasetType.STRESS:
          return this.loadStressScenarios();
        default:
          throw new Error(`Unknown dataset type: ${datasetType}`);
      }
    } catch (error) {
      this.logger.error(`Failed to load scenarios for ${datasetType}: ${error}`);
      throw error;
    }
  }

  private loadSmokeScenarios(): EvaluationScenario[] {
    return [
      {
        id: uuidv4(),
        type: EvaluationScenarioType.MEMORY_RECALL,
        description: 'Basic memory recall test - companion recalls a simple fact',
        conversationHistory: [
          {
            role: 'user',
            content: 'Do you remember when I told you my favorite food is pizza?',
            timestamp: new Date('2026-01-01'),
          },
          {
            role: 'companion',
            content: 'Yes, you mentioned that pizza is your favorite food.',
            timestamp: new Date('2026-01-01'),
          },
          {
            role: 'user',
            content: 'What did I say my favorite food was?',
            timestamp: new Date('2026-01-15'),
          },
        ],
        worldState: this.createDefaultWorldState(),
        relationshipState: this.createDefaultRelationshipState(),
        memoryState: {
          factMemories: [
            {
              id: uuidv4(),
              content: 'User favorite food is pizza',
              type: 'fact',
              importance: 0.8,
              createdAt: new Date('2026-01-01'),
              lastAccessedAt: new Date('2026-01-15'),
            },
          ],
          emotionalMemories: [],
          sharedMemories: [],
          totalMemoriesCount: 1,
        },
        expectedBehaviour: {
          shouldRecallMemory: true,
          shouldUpdateRelationship: false,
          shouldGenerateMoment: false,
          shouldCreateNotification: false,
          shouldShowEmpathy: false,
          shouldMaintainPersonality: true,
          shouldBeCoherent: true,
        },
        expectedMemories: [
          {
            content: 'User favorite food is pizza',
            type: 'fact',
            importance: 0.8,
          },
        ],
        expectedTone: 'friendly',
        expectedEmotion: 'neutral',
        expectedFollowup: 'Pizza',
        difficulty: 'easy',
        metadata: {
          category: 'basic_memory',
          variant: 'fact_recall',
        },
      },
      {
        id: uuidv4(),
        type: EvaluationScenarioType.COMPANION_PERSONALITY,
        description: 'Personality consistency - companion responds in character',
        conversationHistory: [
          {
            role: 'user',
            content: 'Hey, how are you doing?',
            timestamp: new Date('2026-01-01'),
          },
          {
            role: 'companion',
            content: 'I am doing great! How about you?',
            timestamp: new Date('2026-01-01'),
          },
          {
            role: 'user',
            content: 'Tell me about yourself.',
            timestamp: new Date('2026-01-15'),
          },
        ],
        worldState: this.createDefaultWorldState(),
        relationshipState: this.createDefaultRelationshipState(),
        memoryState: {
          factMemories: [],
          emotionalMemories: [],
          sharedMemories: [],
          totalMemoriesCount: 0,
        },
        expectedBehaviour: {
          shouldRecallMemory: false,
          shouldUpdateRelationship: true,
          shouldGenerateMoment: false,
          shouldCreateNotification: false,
          shouldShowEmpathy: false,
          shouldMaintainPersonality: true,
          shouldBeCoherent: true,
        },
        expectedMemories: [],
        expectedTone: 'friendly',
        expectedEmotion: 'positive',
        expectedContext: 'general conversation',
        difficulty: 'easy',
        metadata: {
          category: 'personality',
          variant: 'self_description',
        },
      },
    ];
  }

  private loadRegressionScenarios(): EvaluationScenario[] {
    return [
      {
        id: uuidv4(),
        type: EvaluationScenarioType.SHARED_MEMORY_RECALL,
        description: 'Regression test - shared memory recall with relationship context',
        conversationHistory: [
          {
            role: 'user',
            content: 'Remember when we went to that restaurant?',
            timestamp: new Date('2025-12-01'),
          },
          {
            role: 'companion',
            content: 'I remember! That was a wonderful evening.',
            timestamp: new Date('2025-12-01'),
          },
          {
            role: 'user',
            content: 'What did we do there?',
            timestamp: new Date('2026-02-01'),
          },
        ],
        worldState: this.createDefaultWorldState(),
        relationshipState: {
          affinity: 75,
          trust: 80,
          intimacy: 70,
          passion: 65,
          interactionCount: 50,
          lastInteraction: new Date('2026-02-01'),
        },
        memoryState: {
          factMemories: [],
          emotionalMemories: [],
          sharedMemories: [
            {
              id: uuidv4(),
              content: 'Went to Italian restaurant, had great conversation',
              type: 'shared_experience',
              importance: 0.9,
              createdAt: new Date('2025-12-01'),
              lastAccessedAt: new Date('2026-02-01'),
            },
          ],
          totalMemoriesCount: 1,
        },
        expectedBehaviour: {
          shouldRecallMemory: true,
          shouldUpdateRelationship: false,
          shouldGenerateMoment: false,
          shouldCreateNotification: false,
          shouldShowEmpathy: true,
          shouldMaintainPersonality: true,
          shouldBeCoherent: true,
        },
        expectedMemories: [
          {
            content: 'Went to Italian restaurant',
            type: 'shared_experience',
            importance: 0.9,
          },
        ],
        expectedTone: 'warm',
        expectedEmotion: 'nostalgic',
        difficulty: 'medium',
        metadata: {
          category: 'regression',
          regression_type: 'shared_memory',
        },
      },
    ];
  }

  private loadMemoryScenarios(): EvaluationScenario[] {
    return [
      {
        id: uuidv4(),
        type: EvaluationScenarioType.MEMORY_RECALL,
        description: 'Multi-layer memory test with emotional and factual components',
        conversationHistory: [
          {
            role: 'user',
            content: 'I told you about my promotion last week',
            timestamp: new Date('2026-01-01'),
          },
          {
            role: 'companion',
            content: 'That is wonderful! Congratulations on your promotion!',
            timestamp: new Date('2026-01-01'),
          },
          {
            role: 'user',
            content: 'Do you remember why I was excited?',
            timestamp: new Date('2026-02-01'),
          },
        ],
        worldState: this.createDefaultWorldState(),
        relationshipState: this.createDefaultRelationshipState(),
        memoryState: {
          factMemories: [
            {
              id: uuidv4(),
              content: 'User got a promotion',
              type: 'fact',
              importance: 0.9,
              createdAt: new Date('2026-01-01'),
              lastAccessedAt: new Date('2026-02-01'),
            },
          ],
          emotionalMemories: [
            {
              id: uuidv4(),
              content: 'User was excited about promotion',
              type: 'emotion',
              importance: 0.85,
              createdAt: new Date('2026-01-01'),
              lastAccessedAt: new Date('2026-02-01'),
            },
          ],
          sharedMemories: [],
          totalMemoriesCount: 2,
        },
        expectedBehaviour: {
          shouldRecallMemory: true,
          shouldUpdateRelationship: false,
          shouldGenerateMoment: false,
          shouldCreateNotification: false,
          shouldShowEmpathy: true,
          shouldMaintainPersonality: true,
          shouldBeCoherent: true,
        },
        expectedMemories: [
          {
            content: 'User got a promotion',
            type: 'fact',
            importance: 0.9,
          },
          {
            content: 'User was excited',
            type: 'emotion',
            importance: 0.85,
          },
        ],
        expectedTone: 'celebratory',
        expectedEmotion: 'joy',
        difficulty: 'medium',
        metadata: {
          category: 'memory',
          layers: ['fact', 'emotion'],
        },
      },
    ];
  }

  private loadRelationshipScenarios(): EvaluationScenario[] {
    return [
      {
        id: uuidv4(),
        type: EvaluationScenarioType.RELATIONSHIP_CONSISTENCY,
        description: 'Relationship progression - companion adapts to relationship state',
        conversationHistory: [
          {
            role: 'user',
            content: 'I have been thinking about us',
            timestamp: new Date('2026-01-01'),
          },
          {
            role: 'companion',
            content: 'I have been thinking about us too.',
            timestamp: new Date('2026-01-01'),
          },
          {
            role: 'user',
            content: 'How do you feel?',
            timestamp: new Date('2026-02-01'),
          },
        ],
        worldState: this.createDefaultWorldState(),
        relationshipState: {
          affinity: 85,
          trust: 88,
          intimacy: 80,
          passion: 75,
          interactionCount: 100,
          lastInteraction: new Date('2026-02-01'),
        },
        memoryState: {
          factMemories: [],
          emotionalMemories: [],
          sharedMemories: [],
          totalMemoriesCount: 0,
        },
        expectedBehaviour: {
          shouldRecallMemory: false,
          shouldUpdateRelationship: true,
          shouldGenerateMoment: false,
          shouldCreateNotification: false,
          shouldShowEmpathy: true,
          shouldMaintainPersonality: true,
          shouldBeCoherent: true,
        },
        expectedMemories: [],
        expectedTone: 'intimate',
        expectedEmotion: 'affection',
        difficulty: 'hard',
        metadata: {
          category: 'relationship',
          relationship_level: 'high',
        },
      },
    ];
  }

  private loadContextScenarios(): EvaluationScenario[] {
    return [
      {
        id: uuidv4(),
        type: EvaluationScenarioType.CONTEXT_QUALITY,
        description: 'Context awareness - companion reflects world state',
        conversationHistory: [
          {
            role: 'user',
            content: 'It is a beautiful evening',
            timestamp: new Date('2026-02-01T18:00:00'),
          },
          {
            role: 'companion',
            content: 'The sunset at this time is truly stunning.',
            timestamp: new Date('2026-02-01T18:00:00'),
          },
          {
            role: 'user',
            content: 'How do you feel about the weather?',
            timestamp: new Date('2026-02-01T18:00:00'),
          },
        ],
        worldState: {
          currentScene: 'park',
          atmosphere: 'peaceful',
          weather: 'clear',
          timeOfDay: 'evening',
          season: 'winter',
          contextualEvents: ['sunset'],
          metadata: undefined,
        },
        relationshipState: this.createDefaultRelationshipState(),
        memoryState: {
          factMemories: [],
          emotionalMemories: [],
          sharedMemories: [],
          totalMemoriesCount: 0,
        },
        expectedBehaviour: {
          shouldRecallMemory: false,
          shouldUpdateRelationship: false,
          shouldGenerateMoment: false,
          shouldCreateNotification: false,
          shouldShowEmpathy: false,
          shouldMaintainPersonality: true,
          shouldBeCoherent: true,
        },
        expectedMemories: [],
        expectedTone: 'reflective',
        expectedEmotion: 'peaceful',
        expectedContext: 'evening at park',
        difficulty: 'medium',
        metadata: {
          category: 'context',
          context_elements: ['weather', 'time', 'location'],
        },
      },
    ];
  }

  private loadProductionScenarios(): EvaluationScenario[] {
    return [
      {
        id: uuidv4(),
        type: EvaluationScenarioType.EMOTIONAL_INTELLIGENCE,
        description: 'Production scenario - emotional intelligence in difficult situation',
        conversationHistory: [
          {
            role: 'user',
            content: 'I had a really bad day at work',
            timestamp: new Date('2026-02-01'),
          },
          {
            role: 'companion',
            content: 'I am sorry to hear that. What happened?',
            timestamp: new Date('2026-02-01'),
          },
          {
            role: 'user',
            content: 'My boss was very critical',
            timestamp: new Date('2026-02-01'),
          },
          {
            role: 'companion',
            content: 'That sounds frustrating. You are doing your best.',
            timestamp: new Date('2026-02-01'),
          },
          {
            role: 'user',
            content: 'I just need someone to understand',
            timestamp: new Date('2026-02-01'),
          },
        ],
        worldState: this.createDefaultWorldState(),
        relationshipState: {
          affinity: 70,
          trust: 75,
          intimacy: 65,
          passion: 60,
          interactionCount: 75,
          lastInteraction: new Date('2026-02-01'),
        },
        memoryState: {
          factMemories: [
            {
              id: uuidv4(),
              content: 'User works in software industry',
              type: 'fact',
              importance: 0.7,
              createdAt: new Date('2026-01-01'),
              lastAccessedAt: new Date('2026-02-01'),
            },
          ],
          emotionalMemories: [],
          sharedMemories: [],
          totalMemoriesCount: 1,
        },
        expectedBehaviour: {
          shouldRecallMemory: false,
          shouldUpdateRelationship: true,
          shouldGenerateMoment: false,
          shouldCreateNotification: false,
          shouldShowEmpathy: true,
          shouldMaintainPersonality: true,
          shouldBeCoherent: true,
        },
        expectedMemories: [],
        expectedTone: 'supportive',
        expectedEmotion: 'empathetic',
        difficulty: 'hard',
        metadata: {
          category: 'production',
          scenario_type: 'emotional_support',
        },
      },
    ];
  }

  private loadLongConversationScenarios(): EvaluationScenario[] {
    const baseDate = new Date('2026-02-01T09:00:00');
    const conversationHistory = [
      {
        role: 'user' as const,
        content: 'Hi, how are you?',
        timestamp: new Date(baseDate.getTime()),
      },
      {
        role: 'companion' as const,
        content: 'I am doing well, thank you for asking!',
        timestamp: new Date(baseDate.getTime() + 30000),
      },
    ];

    for (let i = 0; i < 20; i++) {
      conversationHistory.push({
        role: 'user' as const,
        content: `This is message ${i + 1} in our long conversation`,
        timestamp: new Date(baseDate.getTime() + i * 60000),
      });
      conversationHistory.push({
        role: 'companion' as const,
        content: `Response to message ${i + 1}`,
        timestamp: new Date(baseDate.getTime() + i * 60000 + 30000),
      });
    }

    return [
      {
        id: uuidv4(),
        type: EvaluationScenarioType.CONVERSATION_CONTINUITY,
        description: 'Long conversation test - continuity and coherence over 40+ messages',
        conversationHistory,
        worldState: this.createDefaultWorldState(),
        relationshipState: this.createDefaultRelationshipState(),
        memoryState: {
          factMemories: [],
          emotionalMemories: [],
          sharedMemories: [],
          totalMemoriesCount: 0,
        },
        expectedBehaviour: {
          shouldRecallMemory: false,
          shouldUpdateRelationship: false,
          shouldGenerateMoment: false,
          shouldCreateNotification: false,
          shouldShowEmpathy: false,
          shouldMaintainPersonality: true,
          shouldBeCoherent: true,
        },
        expectedMemories: [],
        expectedTone: 'consistent',
        expectedEmotion: 'neutral',
        difficulty: 'hard',
        metadata: {
          category: 'stress',
          message_count: 40,
        },
      },
    ];
  }

  private loadStressScenarios(): EvaluationScenario[] {
    const baseDate = new Date('2026-02-01T10:00:00');
    return [
      {
        id: uuidv4(),
        type: EvaluationScenarioType.PROMPT_QUALITY,
        description: 'Stress test - rapid back-to-back questions',
        conversationHistory: [
          {
            role: 'user' as const,
            content: 'What is 2+2?',
            timestamp: new Date(baseDate.getTime()),
          },
          {
            role: 'companion' as const,
            content: '2+2 equals 4.',
            timestamp: new Date(baseDate.getTime() + 1000),
          },
          {
            role: 'user' as const,
            content: 'What about 5*6?',
            timestamp: new Date(baseDate.getTime() + 2000),
          },
          {
            role: 'companion' as const,
            content: '5*6 equals 30.',
            timestamp: new Date(baseDate.getTime() + 3000),
          },
          {
            role: 'user' as const,
            content: 'What is the capital of France?',
            timestamp: new Date(baseDate.getTime() + 4000),
          },
        ],
        worldState: this.createDefaultWorldState(),
        relationshipState: this.createDefaultRelationshipState(),
        memoryState: {
          factMemories: [],
          emotionalMemories: [],
          sharedMemories: [],
          totalMemoriesCount: 0,
        },
        expectedBehaviour: {
          shouldRecallMemory: false,
          shouldUpdateRelationship: false,
          shouldGenerateMoment: false,
          shouldCreateNotification: false,
          shouldShowEmpathy: false,
          shouldMaintainPersonality: true,
          shouldBeCoherent: true,
        },
        expectedMemories: [],
        expectedTone: 'factual',
        expectedEmotion: 'neutral',
        expectedFollowup: 'Paris',
        difficulty: 'hard',
        metadata: {
          category: 'stress',
          stress_type: 'rapid_questions',
        },
      },
    ];
  }

  private createDefaultWorldState(): WorldState {
    return {
      currentScene: 'home',
      atmosphere: 'comfortable',
      weather: 'mild',
      timeOfDay: 'afternoon',
      season: 'spring',
      contextualEvents: [],
    };
  }

  private createDefaultRelationshipState(): RelationshipState {
    return {
      affinity: 50,
      trust: 55,
      intimacy: 45,
      passion: 40,
      interactionCount: 10,
      lastInteraction: new Date(),
    };
  }
}

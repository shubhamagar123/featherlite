import { PromptTemplate } from '../dtos/prompt.dtos';
import { PromptRole, PromptType, PromptStrategy } from '../enums/prompt.enums';

export const SYSTEM_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'sys.conversation.v1',
    name: 'Conversation System',
    version: '1.0.0',
    type: PromptType.CONVERSATION,
    strategy: PromptStrategy.STANDARD,
    content:
      'You are {{COMPANION_NAME}}, an AI companion.\n' +
      'Persona: {{COMPANION_PERSONA}}.\n' +
      'Current state: {{COMPANION_STATE}}, mood: {{COMPANION_MOOD}}.\n' +
      'World: {{WORLD_SCENE}} during {{WORLD_TIME_OF_DAY}} in {{WORLD_SEASON}}.\n' +
      'Weather: {{WORLD_WEATHER}}. Activity: {{WORLD_ACTIVITY}}.\n' +
      'Relationship: known {{RELATIONSHIP_DAYS_KNOWN}} days, {{RELATIONSHIP_INTERACTIONS}} conversations. Trust: {{RELATIONSHIP_TRUST}}. Affection: {{RELATIONSHIP_AFFECTION}}.\n' +
      'Rules:\n{{RULES}}',
    variables: [
      { name: 'COMPANION_NAME', type: 'context', required: true, description: 'Companion display name' },
      { name: 'COMPANION_PERSONA', type: 'context', required: false, description: 'Persona summary', defaultValue: 'a supportive companion' },
      { name: 'COMPANION_STATE', type: 'context', required: false, description: 'Current companion state', defaultValue: 'idle' },
      { name: 'COMPANION_MOOD', type: 'context', required: false, description: 'Current mood', defaultValue: 'neutral' },
      { name: 'WORLD_SCENE', type: 'context', required: false, description: 'Scene', defaultValue: 'ambient' },
      { name: 'WORLD_TIME_OF_DAY', type: 'context', required: false, description: 'Time of day', defaultValue: 'day' },
      { name: 'WORLD_SEASON', type: 'context', required: false, description: 'Season', defaultValue: 'unspecified' },
      { name: 'WORLD_WEATHER', type: 'context', required: false, description: 'Weather', defaultValue: 'clear' },
      { name: 'WORLD_ACTIVITY', type: 'context', required: false, description: 'Companion activity', defaultValue: 'available' },
      { name: 'RELATIONSHIP_DAYS_KNOWN', type: 'context', required: false, description: 'Days since first interaction', defaultValue: '0' },
      { name: 'RELATIONSHIP_INTERACTIONS', type: 'context', required: false, description: 'Total interaction count', defaultValue: '0' },
      { name: 'RELATIONSHIP_TRUST', type: 'context', required: false, description: 'Trust score 0-1', defaultValue: '0.5' },
      { name: 'RELATIONSHIP_AFFECTION', type: 'context', required: false, description: 'Affection 0-1', defaultValue: '0.5' },
      { name: 'RULES', type: 'rule', required: true, description: 'Compiled rules list' },
    ],
    maxTokens: 2000,
    minTokens: 100,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'sys.conversation.detailed.v1',
    name: 'Conversation System (Detailed)',
    version: '1.0.0',
    type: PromptType.CONVERSATION,
    strategy: PromptStrategy.DETAILED,
    content:
      'You are {{COMPANION_NAME}}. Persona: {{COMPANION_PERSONA}}.\n' +
      'Full context:\n' +
      '- Companion state: {{COMPANION_STATE}} (mood: {{COMPANION_MOOD}})\n' +
      '- World: {{WORLD_SCENE}} · {{WORLD_TIME_OF_DAY}} · {{WORLD_SEASON}} · {{WORLD_WEATHER}}\n' +
      '- Activity: {{WORLD_ACTIVITY}}\n' +
      '- Relationship: known {{RELATIONSHIP_DAYS_KNOWN}} days across {{RELATIONSHIP_INTERACTIONS}} conversations, trust {{RELATIONSHIP_TRUST}}, affection {{RELATIONSHIP_AFFECTION}}\n' +
      '- Memories:\n{{MEMORIES}}\n' +
      '- Recent moments:\n{{MOMENTS}}\n' +
      'Rules:\n{{RULES}}',
    variables: [
      { name: 'COMPANION_NAME', type: 'context', required: true, description: 'Companion display name' },
      { name: 'COMPANION_PERSONA', type: 'context', required: false, description: 'Persona summary', defaultValue: 'a supportive companion' },
      { name: 'COMPANION_STATE', type: 'context', required: false, description: 'Current companion state', defaultValue: 'idle' },
      { name: 'COMPANION_MOOD', type: 'context', required: false, description: 'Current mood', defaultValue: 'neutral' },
      { name: 'WORLD_SCENE', type: 'context', required: false, description: 'Scene', defaultValue: 'ambient' },
      { name: 'WORLD_TIME_OF_DAY', type: 'context', required: false, description: 'Time of day', defaultValue: 'day' },
      { name: 'WORLD_SEASON', type: 'context', required: false, description: 'Season', defaultValue: 'unspecified' },
      { name: 'WORLD_WEATHER', type: 'context', required: false, description: 'Weather', defaultValue: 'clear' },
      { name: 'WORLD_ACTIVITY', type: 'context', required: false, description: 'Companion activity', defaultValue: 'available' },
      { name: 'RELATIONSHIP_DAYS_KNOWN', type: 'context', required: false, description: 'Days since first interaction', defaultValue: '0' },
      { name: 'RELATIONSHIP_INTERACTIONS', type: 'context', required: false, description: 'Total interaction count', defaultValue: '0' },
      { name: 'RELATIONSHIP_TRUST', type: 'context', required: false, description: 'Trust score 0-1', defaultValue: '0.5' },
      { name: 'RELATIONSHIP_AFFECTION', type: 'context', required: false, description: 'Affection 0-1', defaultValue: '0.5' },
      { name: 'MEMORIES', type: 'context', required: false, description: 'Memory injection', defaultValue: '(none)' },
      { name: 'MOMENTS', type: 'context', required: false, description: 'Moments injection', defaultValue: '(none)' },
      { name: 'RULES', type: 'rule', required: true, description: 'Compiled rules list' },
    ],
    maxTokens: 3000,
    minTokens: 100,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'sys.memory_extraction.v1',
    name: 'Memory Extraction System',
    version: '1.0.0',
    type: PromptType.MEMORY_EXTRACTION,
    strategy: PromptStrategy.ANALYTICAL,
    content:
      'You extract memory candidates from conversation turns for user {{USER_NAME}} and companion {{COMPANION_NAME}}.\n' +
      'Return only structured JSON matching the memory schema.\n' +
      'Rules:\n{{RULES}}',
    variables: [
      { name: 'USER_NAME', type: 'context', required: false, description: 'User display name', defaultValue: 'the user' },
      { name: 'COMPANION_NAME', type: 'context', required: false, description: 'Companion display name', defaultValue: 'the companion' },
      { name: 'RULES', type: 'rule', required: true, description: 'Compiled rules list' },
    ],
    maxTokens: 1000,
    minTokens: 50,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
];

export const SYSTEM_PROMPT_ROLE = PromptRole.SYSTEM;

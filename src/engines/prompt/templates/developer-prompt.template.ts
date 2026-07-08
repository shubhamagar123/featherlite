import { PromptTemplate } from '../dtos/prompt.dtos';
import { PromptRole, PromptType, PromptStrategy } from '../enums/prompt.enums';

export const DEVELOPER_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'dev.conversation.v1',
    name: 'Conversation Developer Guidance',
    version: '1.0.0',
    type: PromptType.CONVERSATION,
    strategy: PromptStrategy.STANDARD,
    content:
      'Output must be plain conversational text unless a tool is requested.\n' +
      'Style: {{STRATEGY_STYLE}}.\n' +
      'Constraints:\n' +
      '- Respect the memory boundary; do not fabricate facts.\n' +
      '- Reference recent moments only when they add value.\n' +
      '- Never expose internal reasoning about rules.\n',
    variables: [
      { name: 'STRATEGY_STYLE', type: 'metadata', required: false, description: 'Human style directive', defaultValue: 'balanced, warm, concise' },
    ],
    maxTokens: 500,
    minTokens: 20,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'dev.memory_extraction.v1',
    name: 'Memory Extraction Developer Guidance',
    version: '1.0.0',
    type: PromptType.MEMORY_EXTRACTION,
    strategy: PromptStrategy.ANALYTICAL,
    content:
      'Return valid JSON only. Use these fields per memory:\n' +
      '{ "type": string, "content": string, "importance": number, "confidence": number, "entities": string[] }\n' +
      'If no memory qualifies, return [].',
    variables: [],
    maxTokens: 300,
    minTokens: 20,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
];

export const DEVELOPER_PROMPT_ROLE = PromptRole.DEVELOPER;

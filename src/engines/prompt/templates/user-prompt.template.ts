import { PromptTemplate } from '../dtos/prompt.dtos';
import { PromptRole, PromptType, PromptStrategy } from '../enums/prompt.enums';

export const USER_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'usr.conversation.v1',
    name: 'Conversation User Turn',
    version: '1.0.0',
    type: PromptType.CONVERSATION,
    strategy: PromptStrategy.STANDARD,
    content:
      'Conversation so far:\n{{CONVERSATION_HISTORY}}\n\n' +
      'Current user message:\n{{USER_MESSAGE}}\n',
    variables: [
      { name: 'CONVERSATION_HISTORY', type: 'context', required: false, description: 'Recent conversation snippets', defaultValue: '(no history)' },
      { name: 'USER_MESSAGE', type: 'context', required: true, description: 'User message this turn' },
    ],
    maxTokens: 4000,
    minTokens: 5,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'usr.memory_extraction.v1',
    name: 'Memory Extraction User Turn',
    version: '1.0.0',
    type: PromptType.MEMORY_EXTRACTION,
    strategy: PromptStrategy.ANALYTICAL,
    content:
      'Extract memories from the following turn(s):\n{{CONVERSATION_HISTORY}}',
    variables: [
      { name: 'CONVERSATION_HISTORY', type: 'context', required: true, description: 'Conversation to analyze' },
    ],
    maxTokens: 4000,
    minTokens: 5,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
];

export const USER_PROMPT_ROLE = PromptRole.USER;

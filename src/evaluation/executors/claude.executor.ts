/**
 * Claude Evaluation Executor
 * Executes evaluations using Claude API
 */

import { EvaluationScenario, Message, ModelProvider } from '../types';
import { EvaluationExecutor } from './evaluation.executor';

export class ClaudeExecutor extends EvaluationExecutor {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string = '', model: string = 'claude-3-sonnet-20240229') {
    super(ModelProvider.CLAUDE);
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = model;

    if (!this.apiKey) {
      this.logger.warn('Claude API key not configured');
    }
  }

  async generateResponse(
    scenario: EvaluationScenario,
    conversationHistory: Message[]
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured');
    }

    try {
      const messages = this.formatMessages(conversationHistory);
      const systemPrompt = this.buildSystemPrompt(scenario);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'Anthropic-Version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 500,
          system: systemPrompt,
          messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json() as { content: Array<{ type: string; text: string }> };
      const content = data.content[0]?.text || '';

      this.logger.info(`Generated response for scenario ${scenario.id}`);

      return content;
    } catch (error) {
      this.logger.error(`Claude generation failed: ${error}`);
      throw error;
    }
  }

  private formatMessages(
    conversationHistory: Message[]
  ): Array<{ role: string; content: string }> {
    return conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
  }

  private buildSystemPrompt(scenario: EvaluationScenario): string {
    let prompt = 'You are an AI companion named Kia. ';

    if (scenario.expectedTone) {
      prompt += `Respond in a ${scenario.expectedTone} tone. `;
    }

    if (scenario.expectedEmotion) {
      prompt += `Express ${scenario.expectedEmotion} emotion. `;
    }

    if (scenario.worldState) {
      prompt += `The current context is: ${scenario.worldState.currentScene} `;
      prompt += `(${scenario.worldState.weather}, ${scenario.worldState.timeOfDay}). `;
    }

    if (scenario.relationshipState) {
      const affinity = scenario.relationshipState.affinity;
      if (affinity > 70) {
        prompt += 'You have a close relationship with the user. ';
      } else if (affinity > 50) {
        prompt += 'You have a friendly relationship with the user. ';
      }
    }

    if (scenario.memoryState && scenario.memoryState.totalMemoriesCount > 0) {
      prompt += 'Remember previous conversations and shared experiences. ';
    }

    prompt += 'Be authentic, empathetic, and coherent. ';
    prompt += 'Respond naturally to the last user message.';

    return prompt;
  }
}

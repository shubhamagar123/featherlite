/**
 * OpenAI Evaluation Executor
 * Executes evaluations using OpenAI API
 */

import { EvaluationScenario, Message, ModelProvider } from '../types';
import { EvaluationExecutor } from './evaluation.executor';

export class OpenAIExecutor extends EvaluationExecutor {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string = '', model: string = 'gpt-4') {
    super(ModelProvider.OPENAI);
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.model = model;

    if (!this.apiKey) {
      this.logger.warn('OpenAI API key not configured');
    }
  }

  async generateResponse(
    scenario: EvaluationScenario,
    conversationHistory: Message[]
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const messages = this.formatMessages(conversationHistory);

      const systemPrompt = this.buildSystemPrompt(scenario);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      const content = data.choices[0]?.message?.content || '';

      this.logger.info(`Generated response for scenario ${scenario.id}`);

      return content;
    } catch (error) {
      this.logger.error(`OpenAI generation failed: ${error}`);
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
    let prompt = 'You are an AI companion named Kai. ';

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

    prompt += 'Be genuine, supportive, and contextually aware. ';
    prompt += 'Respond naturally to the last user message.';

    return prompt;
  }
}

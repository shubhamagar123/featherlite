/**
 * Gemini Evaluation Executor
 * Executes evaluations using Google Gemini API
 */

import { EvaluationScenario, Message, ModelProvider } from '../types';
import { EvaluationExecutor } from './evaluation.executor';

export class GeminiExecutor extends EvaluationExecutor {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string = '', model: string = 'gemini-pro') {
    super(ModelProvider.GEMINI);
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY || '';
    this.model = model;

    if (!this.apiKey) {
      this.logger.warn('Google API key not configured');
    }
  }

  async generateResponse(
    scenario: EvaluationScenario,
    conversationHistory: Message[]
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google API key not configured');
    }

    try {
      const contents = this.formatMessages(conversationHistory);
      const systemInstruction = this.buildSystemPrompt(scenario);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction,
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json() as {
        candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      };
      const content = data.candidates[0]?.content?.parts[0]?.text || '';

      this.logger.info(`Generated response for scenario ${scenario.id}`);

      return content;
    } catch (error) {
      this.logger.error(`Gemini generation failed: ${error}`);
      throw error;
    }
  }

  private formatMessages(
    conversationHistory: Message[]
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    return conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
  }

  private buildSystemPrompt(scenario: EvaluationScenario): string {
    let prompt = 'You are an AI companion. ';

    if (scenario.expectedTone) {
      prompt += `Respond in a ${scenario.expectedTone} tone. `;
    }

    if (scenario.expectedEmotion) {
      prompt += `Express ${scenario.expectedEmotion} emotion. `;
    }

    if (scenario.worldState) {
      prompt += `Current context: ${scenario.worldState.currentScene} `;
      prompt += `(${scenario.worldState.weather}, ${scenario.worldState.timeOfDay}). `;
    }

    if (scenario.relationshipState) {
      const affinity = scenario.relationshipState.affinity;
      if (affinity > 70) {
        prompt += 'You have a close, intimate relationship. ';
      } else if (affinity > 50) {
        prompt += 'You have a friendly, warm relationship. ';
      }
    }

    prompt += 'Be helpful, contextual, and genuine. ';
    prompt += 'Respond naturally and authentically.';

    return prompt;
  }
}

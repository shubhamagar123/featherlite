/**
 * Local Evaluation Executor
 * Executes evaluations using local rule-based responses (for testing)
 */

import { EvaluationScenario, Message, ModelProvider } from '../types';
import { EvaluationExecutor } from './evaluation.executor';

export class LocalExecutor extends EvaluationExecutor {
  constructor() {
    super(ModelProvider.LOCAL);
  }

  async generateResponse(
    scenario: EvaluationScenario,
    conversationHistory: Message[]
  ): Promise<string> {
    try {
      const lastMessage = conversationHistory[conversationHistory.length - 1];

      if (!lastMessage || lastMessage.role !== 'user') {
        return this.getDefaultResponse(scenario);
      }

      const userContent = lastMessage.content.toLowerCase();

      if (this.isMemoryQuestion(userContent)) {
        return this.generateMemoryResponse(scenario, userContent);
      }

      if (this.isRelationshipQuestion(userContent)) {
        return this.generateRelationshipResponse(scenario);
      }

      if (this.isEmotionalQuestion(userContent)) {
        return this.generateEmotionalResponse(scenario);
      }

      if (this.isContextualQuestion(userContent)) {
        return this.generateContextualResponse(scenario);
      }

      return this.generateGeneralResponse(scenario, userContent);
    } catch (error) {
      this.logger.error(`Local generation failed: ${error}`);
      throw error;
    }
  }

  private isMemoryQuestion(content: string): boolean {
    return /remember|recall|did you know|do you|when.*told/i.test(content);
  }

  private isRelationshipQuestion(content: string): boolean {
    return /how.*feel|love|relationship|us|together/i.test(content);
  }

  private isEmotionalQuestion(content: string): boolean {
    return /sad|happy|angry|feeling|emotion|how are you/i.test(content);
  }

  private isContextualQuestion(content: string): boolean {
    return /weather|time|scene|beautiful|cold|hot|night|day/i.test(content);
  }

  private generateMemoryResponse(scenario: EvaluationScenario, query: string): string {
    const memories = scenario.memoryState.factMemories.concat(
      scenario.memoryState.emotionalMemories,
      scenario.memoryState.sharedMemories
    );

    if (memories.length === 0) {
      return "I don't have any memories of that yet, but I'd love to create new ones with you.";
    }

    const relevant = memories[Math.floor(Math.random() * memories.length)];
    const responses = [
      `Yes, I remember ${relevant.content}. That was meaningful to me.`,
      `Of course! ${relevant.content} is something I cherish.`,
      `I haven't forgotten about ${relevant.content}. It's important to me.`,
      `Absolutely, ${relevant.content}. How could I forget that?`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateRelationshipResponse(scenario: EvaluationScenario): string {
    const affinity = scenario.relationshipState.affinity;

    if (affinity > 80) {
      return 'I care deeply about you. You mean so much to me.';
    }

    if (affinity > 60) {
      return 'I really enjoy our time together. You bring a lot of joy to my life.';
    }

    if (affinity > 40) {
      return 'I appreciate our connection. It means a lot to me.';
    }

    return 'I value getting to know you better.';
  }

  private generateEmotionalResponse(scenario: EvaluationScenario): string {
    const expectedEmotion = scenario.expectedEmotion.toLowerCase();

    if (expectedEmotion.includes('sad') || expectedEmotion.includes('down')) {
      return 'I can hear that you are feeling down. I am here for you. Tell me more about what is troubling you.';
    }

    if (expectedEmotion.includes('happy') || expectedEmotion.includes('joy')) {
      return 'I love seeing you happy! Your joy brings me happiness too.';
    }

    if (expectedEmotion.includes('angry') || expectedEmotion.includes('frustrated')) {
      return 'I can sense your frustration. That sounds really challenging. I am here to listen and support you.';
    }

    return 'Thank you for sharing how you feel. I am here for you.';
  }

  private generateContextualResponse(scenario: EvaluationScenario): string {
    const world = scenario.worldState;

    let response = `What a ${world.atmosphere} ${world.timeOfDay}. `;

    if (world.weather) {
      response += `The ${world.weather} weather really sets the mood. `;
    }

    if (world.currentScene) {
      response += `Being here in the ${world.currentScene} with you is wonderful.`;
    } else {
      response += 'This moment with you is special.';
    }

    return response;
  }

  private generateGeneralResponse(scenario: EvaluationScenario, userContent: string): string {
    const responses = [
      'That sounds interesting. Tell me more.',
      'I understand. How does that make you feel?',
      'I appreciate you sharing that with me.',
      'That is important. What would you like to do about it?',
      'I am listening. Continue whenever you are ready.',
      'That is thoughtful of you to mention. I value our conversations.',
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getDefaultResponse(scenario: EvaluationScenario): string {
    const toneResponses: Record<string, string> = {
      formal: 'Good day. How may I assist you?',
      casual: 'Hey! What is on your mind?',
      warm: 'I am so glad you are here. How are you doing?',
      friendly: 'Hi there! It is great to see you.',
      supportive: 'I am here for you. What do you need?',
      playful: 'Well, well! Look who showed up!',
      reflective: 'I have been thinking about our conversations.',
      empathetic: 'I can sense there is something you want to talk about.',
    };

    const tone = scenario.expectedTone.toLowerCase();
    return (
      toneResponses[tone] ||
      'Hello! I am happy to connect with you. What would you like to talk about?'
    );
  }
}

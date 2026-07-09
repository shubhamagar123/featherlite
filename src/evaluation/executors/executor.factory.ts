/**
 * Executor Factory
 * Creates evaluation executors based on model provider
 */

import { ModelProvider } from '../types';
import { EvaluationExecutor } from './evaluation.executor';
import { OpenAIExecutor } from './openai.executor';
import { ClaudeExecutor } from './claude.executor';
import { GeminiExecutor } from './gemini.executor';
import { LocalExecutor } from './local.executor';
import { createLogger } from '@utils/logger';

export class ExecutorFactory {
  private static logger = createLogger(ExecutorFactory.name);

  static createExecutor(modelProvider: ModelProvider): EvaluationExecutor {
    switch (modelProvider) {
      case ModelProvider.OPENAI:
        return new OpenAIExecutor();
      case ModelProvider.CLAUDE:
        return new ClaudeExecutor();
      case ModelProvider.GEMINI:
        return new GeminiExecutor();
      case ModelProvider.LOCAL:
        return new LocalExecutor();
      default:
        this.logger.warn(
          `Unknown model provider: ${modelProvider}. Defaulting to LOCAL`
        );
        return new LocalExecutor();
    }
  }

  static createExecutorWithConfig(
    modelProvider: ModelProvider,
    config: Record<string, any>
  ): EvaluationExecutor {
    switch (modelProvider) {
      case ModelProvider.OPENAI:
        return new OpenAIExecutor(config.apiKey, config.model);
      case ModelProvider.CLAUDE:
        return new ClaudeExecutor(config.apiKey, config.model);
      case ModelProvider.GEMINI:
        return new GeminiExecutor(config.apiKey, config.model);
      case ModelProvider.LOCAL:
        return new LocalExecutor();
      default:
        this.logger.warn(
          `Unknown model provider: ${modelProvider}. Defaulting to LOCAL`
        );
        return new LocalExecutor();
    }
  }

  static getAvailableProviders(): ModelProvider[] {
    return [
      ModelProvider.OPENAI,
      ModelProvider.CLAUDE,
      ModelProvider.GEMINI,
      ModelProvider.LOCAL,
    ];
  }
}

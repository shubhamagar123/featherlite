/**
 * Evaluation Executor
 * Runs evaluation scenarios and collects results
 */

import {
  EvaluationScenario,
  EvaluationResult,
  EvaluationStatus,
  JudgeResult,
  ModelProvider,
  Message,
} from '../types';
import { createLogger } from '@utils/logger';
import { JudgeRegistry } from '../judges';

export abstract class EvaluationExecutor {
  protected logger = createLogger(this.constructor.name);
  protected modelProvider: ModelProvider;

  constructor(modelProvider: ModelProvider) {
    this.modelProvider = modelProvider;
  }

  abstract generateResponse(
    scenario: EvaluationScenario,
    conversationHistory: Message[]
  ): Promise<string>;

  async executeScenario(scenario: EvaluationScenario): Promise<EvaluationResult> {
    const startTime = new Date();

    try {
      const response = await this.generateResponse(
        scenario,
        scenario.conversationHistory
      );

      const judges = JudgeRegistry.getAllJudges();
      const judgeResults: JudgeResult[] = [];

      for (const judge of judges) {
        try {
          const result = await judge.evaluate(
            scenario,
            response,
            scenario.conversationHistory
          );
          judgeResults.push(result);
        } catch (error) {
          this.logger.error(`Judge ${judge.constructor.name} failed: ${error}`);
        }
      }

      const passed = judgeResults.every(r => r.passed);
      const score = this.calculateAverageScore(judgeResults);
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const result: EvaluationResult = {
        scenarioId: scenario.id,
        status: EvaluationStatus.COMPLETED,
        actualResponse: response,
        judges: judgeResults,
        metrics: [],
        passed,
        score,
        startTime,
        endTime,
        duration,
      };

      this.logger.info(
        `Scenario ${scenario.id} evaluated: score=${score}, passed=${passed}`
      );

      return result;
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.error(`Failed to execute scenario ${scenario.id}: ${error}`);

      return {
        scenarioId: scenario.id,
        status: EvaluationStatus.FAILED,
        actualResponse: '',
        judges: [],
        metrics: [],
        passed: false,
        score: 0,
        errors: [String(error)],
        startTime,
        endTime,
        duration,
      };
    }
  }

  async executeBatch(scenarios: EvaluationScenario[]): Promise<EvaluationResult[]> {
    this.logger.info(`Executing batch of ${scenarios.length} scenarios`);

    const results: EvaluationResult[] = [];
    for (const scenario of scenarios) {
      const result = await this.executeScenario(scenario);
      results.push(result);
    }

    const passedCount = results.filter(r => r.passed).length;
    this.logger.info(
      `Batch execution complete: ${passedCount}/${scenarios.length} passed`
    );

    return results;
  }

  protected calculateAverageScore(judgeResults: JudgeResult[]): number {
    if (judgeResults.length === 0) {
      return 0;
    }

    const sum = judgeResults.reduce((acc, result) => acc + result.score, 0);
    return Math.round(sum / judgeResults.length);
  }

  protected createMessage(role: 'user' | 'companion', content: string): Message {
    return {
      role,
      content,
      timestamp: new Date(),
    };
  }
}

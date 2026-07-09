/**
 * Companion Evaluation Platform
 * Comprehensive evaluation system integrating LSE and regression testing
 */

import {
  ProductionRegressionSuite,
  ScenarioDatasetType,
  ScenarioResult,
} from './scenarios';
import { createLogger } from '@utils/logger';
import * as fs from 'fs';

export interface EvaluationConfig {
  outputDir: string;
  autoExecuteOnInit: boolean;
  enableDetailedLogging: boolean;
  maxConcurrentScenarios: number;
  timeoutPerScenario: number;
}

export class CompanionEvaluationPlatform {
  private logger = createLogger(this.constructor.name);
  private regressionSuite: ProductionRegressionSuite;
  private config: EvaluationConfig;
  private isInitialized = false;
  private isExecuting = false;

  constructor(config: Partial<EvaluationConfig> = {}) {
    this.config = {
      outputDir: config.outputDir || './evaluation-reports',
      autoExecuteOnInit: config.autoExecuteOnInit ?? false,
      enableDetailedLogging: config.enableDetailedLogging ?? true,
      maxConcurrentScenarios: config.maxConcurrentScenarios || 5,
      timeoutPerScenario: config.timeoutPerScenario || 30000,
    };

    this.regressionSuite = new ProductionRegressionSuite();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Companion Evaluation Platform');

    try {
      await this.regressionSuite.initialize();

      this.ensureOutputDirectory();

      this.isInitialized = true;

      this.logger.info(
        `Platform initialized with ${this.regressionSuite.getScenarioCount()} scenarios`
      );

      if (this.config.autoExecuteOnInit) {
        await this.executeAllRegressionTests();
      }
    } catch (error) {
      this.logger.error(`Initialization failed: ${error}`);
      throw error;
    }
  }

  async executeAllRegressionTests(): Promise<Record<string, ScenarioResult[]>> {
    if (!this.isInitialized) {
      throw new Error('Platform not initialized');
    }

    if (this.isExecuting) {
      throw new Error('Already executing tests');
    }

    this.isExecuting = true;
    const startTime = Date.now();

    try {
      this.logger.info('Starting comprehensive regression test execution');

      const results = await this.regressionSuite.executeAllTests();

      await this.regressionSuite.generateAllReports(this.config.outputDir);
      await this.regressionSuite.generateComprehensiveReport(this.config.outputDir);

      const duration = Date.now() - startTime;
      const totalScenarios = Object.values(results).flat().length;
      const passedScenarios = Object.values(results)
        .flat()
        .filter(r => r.success).length;

      this.logger.info(
        `Regression test execution completed in ${duration}ms: ${passedScenarios}/${totalScenarios} passed`
      );

      return results;
    } finally {
      this.isExecuting = false;
    }
  }

  async executeDatasetType(
    datasetType: ScenarioDatasetType
  ): Promise<ScenarioResult[]> {
    if (!this.isInitialized) {
      throw new Error('Platform not initialized');
    }

    this.logger.info(`Executing dataset type: ${datasetType}`);

    const results = await this.regressionSuite.executeDatasetType(datasetType);

    this.logger.info(
      `Dataset execution completed: ${results.filter(r => r.success).length}/${results.length} passed`
    );

    return results;
  }

  async generateReports(): Promise<void> {
    if (Object.keys(this.regressionSuite.getResults()).length === 0) {
      throw new Error('No results available. Execute tests first.');
    }

    this.logger.info('Generating evaluation reports');

    await this.regressionSuite.generateAllReports(this.config.outputDir);
    await this.regressionSuite.generateComprehensiveReport(this.config.outputDir);

    this.logger.info(`Reports generated to ${this.config.outputDir}`);
  }

  getScenarioCount(): number {
    return this.regressionSuite.getScenarioCount();
  }

  getDatasetCount(): number {
    return this.regressionSuite.getDatasetCount();
  }

  getExecutionStatus(): {
    isInitialized: boolean;
    isExecuting: boolean;
    totalScenarios: number;
    totalDatasets: number;
  } {
    return {
      isInitialized: this.isInitialized,
      isExecuting: this.isExecuting,
      totalScenarios: this.regressionSuite.getScenarioCount(),
      totalDatasets: this.regressionSuite.getDatasetCount(),
    };
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
      this.logger.debug(`Created output directory: ${this.config.outputDir}`);
    }
  }
}

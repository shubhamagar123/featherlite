/**
 * Evaluation Pipeline
 * Orchestrates evaluation workflows with scenario execution and reporting
 */

import {
  EvaluationPipeline,
  PipelineStep,
  EvaluationScenario,
  EvaluationResult,
  EvaluationReport,
  ModelProvider,
  EvaluationDatasetType,
} from '../types';
import { createLogger } from '@utils/logger';
import { EvaluationExecutor } from '../executors';
import { ExecutorFactory } from '../executors/executor.factory';
import { MetricsCalculator } from '../metrics';
import { ReportGenerator } from '../reports';
import { v4 as uuidv4 } from 'uuid';

export class EvaluationPipelineExecutor {
  private logger = createLogger(this.constructor.name);
  private pipelines: Map<string, EvaluationPipeline> = new Map();
  private executors: Map<ModelProvider, EvaluationExecutor> = new Map();
  private metricsCalculator: MetricsCalculator;
  private reportGenerator: ReportGenerator;

  constructor() {
    this.metricsCalculator = new MetricsCalculator();
    this.reportGenerator = new ReportGenerator();
  }

  async createPipeline(
    name: string,
    description: string,
    steps: PipelineStep[],
    schedule?: string
  ): Promise<EvaluationPipeline> {
    try {
      const pipeline: EvaluationPipeline = {
        id: uuidv4(),
        name,
        description,
        steps: steps.sort((a, b) => a.order - b.order),
        schedule,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.pipelines.set(pipeline.id, pipeline);
      this.logger.info(`Created pipeline ${name}`);

      return pipeline;
    } catch (error) {
      this.logger.error(`Failed to create pipeline: ${error}`);
      throw error;
    }
  }

  async getPipeline(id: string): Promise<EvaluationPipeline | null> {
    return this.pipelines.get(id) || null;
  }

  async getAllPipelines(): Promise<EvaluationPipeline[]> {
    return Array.from(this.pipelines.values());
  }

  async executePipeline(
    pipelineId: string,
    scenarios: EvaluationScenario[],
    modelProvider: ModelProvider,
    datasetType: EvaluationDatasetType,
    promptVersion: string,
    previousReport?: EvaluationReport
  ): Promise<EvaluationReport> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    if (!pipeline.enabled) {
      throw new Error(`Pipeline is disabled: ${pipelineId}`);
    }

    try {
      this.logger.info(`Executing pipeline ${pipeline.name}`);

      let results: EvaluationResult[] = [];
      let report: EvaluationReport | undefined;

      for (const step of pipeline.steps) {
        switch (step.type) {
          case 'scenario_execution':
            results = await this.executeScenarios(scenarios, modelProvider);
            break;

          case 'metrics_calculation':
            this.metricsCalculator.calculateMetrics(results);
            break;

          case 'report_generation':
            report = this.reportGenerator.generateReport(
              results,
              datasetType,
              modelProvider,
              promptVersion,
              previousReport
            );
            break;

          case 'regression_detection':
            if (previousReport) {
              report = this.detectRegressions(report || previousReport, previousReport);
            }
            break;

          default:
            this.logger.warn(`Unknown pipeline step type: ${step.type}`);
        }
      }

      if (!report) {
        throw new Error('No report generated from pipeline');
      }

      this.logger.info(`Pipeline ${pipeline.name} completed successfully`);
      return report;
    } catch (error) {
      this.logger.error(`Pipeline execution failed: ${error}`);
      throw error;
    }
  }

  async updatePipeline(
    id: string,
    updates: Partial<EvaluationPipeline>
  ): Promise<EvaluationPipeline> {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${id}`);
    }

    const updated: EvaluationPipeline = {
      ...pipeline,
      ...updates,
      id: pipeline.id,
      createdAt: pipeline.createdAt,
      updatedAt: new Date(),
    };

    this.pipelines.set(id, updated);
    this.logger.info(`Updated pipeline ${id}`);

    return updated;
  }

  async deletePipeline(id: string): Promise<void> {
    if (!this.pipelines.has(id)) {
      throw new Error(`Pipeline not found: ${id}`);
    }

    this.pipelines.delete(id);
    this.logger.info(`Deleted pipeline ${id}`);
  }

  async enablePipeline(id: string): Promise<void> {
    await this.updatePipeline(id, { enabled: true });
  }

  async disablePipeline(id: string): Promise<void> {
    await this.updatePipeline(id, { enabled: false });
  }

  private async executeScenarios(
    scenarios: EvaluationScenario[],
    modelProvider: ModelProvider
  ): Promise<EvaluationResult[]> {
    let executor = this.executors.get(modelProvider);

    if (!executor) {
      executor = ExecutorFactory.createExecutor(modelProvider);
      this.executors.set(modelProvider, executor);
    }

    return executor.executeBatch(scenarios);
  }

  private detectRegressions(
    current: EvaluationReport,
    previous: EvaluationReport
  ): EvaluationReport {
    const regressions = current.regressions || [];
    const improvements = current.improvements || [];

    if (regressions.length > 0) {
      this.logger.warn(`Pipeline detected ${regressions.length} regression(s)`);
    }

    if (improvements.length > 0) {
      this.logger.info(`Pipeline detected ${improvements.length} improvement(s)`);
    }

    return current;
  }
}

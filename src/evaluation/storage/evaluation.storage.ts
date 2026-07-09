/**
 * Evaluation Storage
 * Persistence layer for evaluation results, metrics, and reports
 */

import {
  EvaluationResult,
  EvaluationReport,
  MetricResult,
} from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class EvaluationStorage {
  private logger = createLogger(this.constructor.name);
  private results: Map<string, EvaluationResult> = new Map();
  private reports: Map<string, EvaluationReport> = new Map();
  private metrics: Map<string, MetricResult[]> = new Map();

  async saveResult(result: EvaluationResult): Promise<string> {
    try {
      const id = uuidv4();
      this.results.set(id, result);
      this.logger.info(`Saved evaluation result ${id}`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to save result: ${error}`);
      throw error;
    }
  }

  async getResult(id: string): Promise<EvaluationResult | null> {
    return this.results.get(id) || null;
  }

  async getResultsByScenario(scenarioId: string): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = [];
    this.results.forEach(result => {
      if (result.scenarioId === scenarioId) {
        results.push(result);
      }
    });
    return results;
  }

  async getAllResults(): Promise<EvaluationResult[]> {
    return Array.from(this.results.values());
  }

  async deleteResult(id: string): Promise<void> {
    if (!this.results.has(id)) {
      throw new Error(`Result not found: ${id}`);
    }

    this.results.delete(id);
    this.logger.info(`Deleted evaluation result ${id}`);
  }

  async saveReport(report: EvaluationReport): Promise<string> {
    try {
      const id = report.id;
      this.reports.set(id, report);
      this.logger.info(`Saved evaluation report ${id}`);
      return id;
    } catch (error) {
      this.logger.error(`Failed to save report: ${error}`);
      throw error;
    }
  }

  async getReport(id: string): Promise<EvaluationReport | null> {
    return this.reports.get(id) || null;
  }

  async getReports(limit: number = 50): Promise<EvaluationReport[]> {
    const all = Array.from(this.reports.values());
    return all.slice(-limit).reverse();
  }

  async getReportsByModel(model: string, limit: number = 50): Promise<EvaluationReport[]> {
    const filtered = Array.from(this.reports.values())
      .filter(r => r.modelProvider === model)
      .slice(-limit)
      .reverse();
    return filtered;
  }

  async getReportsByDataset(dataset: string, limit: number = 50): Promise<EvaluationReport[]> {
    const filtered = Array.from(this.reports.values())
      .filter(r => r.datasetType === dataset)
      .slice(-limit)
      .reverse();
    return filtered;
  }

  async deleteReport(id: string): Promise<void> {
    if (!this.reports.has(id)) {
      throw new Error(`Report not found: ${id}`);
    }

    this.reports.delete(id);
    this.logger.info(`Deleted evaluation report ${id}`);
  }

  async saveMetrics(scenarioId: string, metrics: MetricResult[]): Promise<void> {
    try {
      this.metrics.set(scenarioId, metrics);
      this.logger.info(`Saved metrics for scenario ${scenarioId}`);
    } catch (error) {
      this.logger.error(`Failed to save metrics: ${error}`);
      throw error;
    }
  }

  async getMetrics(scenarioId: string): Promise<MetricResult[]> {
    return this.metrics.get(scenarioId) || [];
  }

  async getAllMetrics(): Promise<{ [scenarioId: string]: MetricResult[] }> {
    const all: { [scenarioId: string]: MetricResult[] } = {};
    this.metrics.forEach((metrics, scenarioId) => {
      all[scenarioId] = metrics;
    });
    return all;
  }

  async deleteMetrics(scenarioId: string): Promise<void> {
    if (!this.metrics.has(scenarioId)) {
      throw new Error(`Metrics not found for scenario: ${scenarioId}`);
    }

    this.metrics.delete(scenarioId);
    this.logger.info(`Deleted metrics for scenario ${scenarioId}`);
  }

  async getStorageStats(): Promise<{
    totalResults: number;
    totalReports: number;
    totalMetricRecords: number;
    oldestResult: Date | null;
    latestResult: Date | null;
  }> {
    const allResults = Array.from(this.results.values());

    const dates = allResults.map(r => r.startTime).sort();

    return {
      totalResults: this.results.size,
      totalReports: this.reports.size,
      totalMetricRecords: this.metrics.size,
      oldestResult: dates.length > 0 ? dates[0] : null,
      latestResult: dates.length > 0 ? dates[dates.length - 1] : null,
    };
  }

  async exportResults(scenarioIds?: string[]): Promise<string> {
    try {
      const results = scenarioIds
        ? Array.from(this.results.values()).filter(r =>
            scenarioIds.includes(r.scenarioId)
          )
        : Array.from(this.results.values());

      return JSON.stringify(results, null, 2);
    } catch (error) {
      this.logger.error(`Failed to export results: ${error}`);
      throw error;
    }
  }

  async exportReports(): Promise<string> {
    try {
      const reports = Array.from(this.reports.values());
      return JSON.stringify(reports, null, 2);
    } catch (error) {
      this.logger.error(`Failed to export reports: ${error}`);
      throw error;
    }
  }

  async clearOldData(daysOld: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deleted = 0;

      this.results.forEach((result, id) => {
        if (result.startTime < cutoffDate) {
          this.results.delete(id);
          deleted++;
        }
      });

      this.reports.forEach((report, id) => {
        if (report.timestamp < cutoffDate) {
          this.reports.delete(id);
          deleted++;
        }
      });

      this.logger.info(`Cleared ${deleted} old data records older than ${daysOld} days`);
      return deleted;
    } catch (error) {
      this.logger.error(`Failed to clear old data: ${error}`);
      throw error;
    }
  }

  clearAll(): void {
    this.results.clear();
    this.reports.clear();
    this.metrics.clear();
    this.logger.info('Cleared all storage');
  }
}

import { Result } from '@services/types/result.type';
import { Memory } from '@engines/memory/dtos/memory.dto';
import { RankedMemory, RankingConfig } from '../dto/memory-query.dto';
import { RankingSignalType, RankingMode } from '../enums/memory-query.enums';
import { IMemoryScorer, IMemoryRanker } from '../interfaces/memory-query.interfaces';

export class MemoryRanker implements IMemoryRanker {
  private scorers: Map<RankingSignalType, IMemoryScorer> = new Map();

  addScorer(type: RankingSignalType, scorer: IMemoryScorer): void {
    this.scorers.set(type, scorer);
  }

  rank(memories: Memory[], config: RankingConfig, context: any): Result<RankedMemory[]> {
    return Result.try(() => {
      if (memories.length === 0) {
        return [];
      }

      const allScores = new Map<string, Map<RankingSignalType, number>>();

      for (const memory of memories) {
        allScores.set(memory.id, new Map());
      }

      let activeSignals = 0;
      const enabledSignals = Array.from(config.signals.entries())
        .filter(([type]) => this.scorers.has(type))
        .map(([type, weight]) => ({ type, weight }));

      for (const { type } of enabledSignals) {
        const scorer = this.scorers.get(type)!;
        const scoresResult = scorer.score(memories, context);

        if (!scoresResult.isSuccess || !scoresResult.value) {
          continue;
        }

        activeSignals++;
        for (const [memoryId, score] of scoresResult.value) {
          allScores.get(memoryId)!.set(type, score);
        }
      }

      const rankedMemories: RankedMemory[] = [];
      const finalScores: number[] = [];

      for (let i = 0; i < memories.length; i++) {
        const memory = memories[i];
        const scores = allScores.get(memory.id)!;
        const finalScore = this.computeFinalScore(scores, config, activeSignals);

        if (finalScore >= config.minimumScore) {
          rankedMemories.push({
            memory,
            scores: this.scoresToRecord(scores),
            finalScore,
            reasoning: this.generateReasoning(memory, scores, config),
            rank: 0,
          });
          finalScores.push(finalScore);
        }
      }

      rankedMemories.sort((a, b) => b.finalScore - a.finalScore);
      rankedMemories.forEach((rm, index) => {
        rm.rank = index + 1;
      });

      if (config.normalizeScores && finalScores.length > 0) {
        this.normalizeScores(rankedMemories, finalScores);
      }

      return rankedMemories;
    });
  }

  private computeFinalScore(
    scores: Map<RankingSignalType, number>,
    config: RankingConfig,
    _activeSignals: number
  ): number {
    if (scores.size === 0) {
      return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [type, weight] of config.signals) {
      if (scores.has(type)) {
        const score = scores.get(type)!;
        weightedSum += score * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) {
      return 0;
    }

    const baseScore = weightedSum / totalWeight;

    switch (config.mode) {
      case RankingMode.STRICT:
        return this.applyStrictMode(baseScore, scores, config);
      case RankingMode.PERMISSIVE:
        return this.applyPermissiveMode(baseScore, scores, config);
      case RankingMode.BALANCED:
      default:
        return baseScore;
    }
  }

  private applyStrictMode(
    baseScore: number,
    scores: Map<RankingSignalType, number>,
    _config: RankingConfig
  ): number {
    const minScore = Math.min(...scores.values());
    const variance = Math.max(...scores.values()) - minScore;

    if (variance > 30) {
      return baseScore * 0.8;
    }

    return baseScore;
  }

  private applyPermissiveMode(
    baseScore: number,
    scores: Map<RankingSignalType, number>,
    _config: RankingConfig
  ): number {
    const maxScore = Math.max(...scores.values());
    return Math.max(baseScore, maxScore * 0.9);
  }

  private normalizeScores(rankedMemories: RankedMemory[], finalScores: number[]): void {
    if (finalScores.length === 0) {
      return;
    }

    const minScore = Math.min(...finalScores);
    const maxScore = Math.max(...finalScores);
    const range = maxScore - minScore;

    for (const ranked of rankedMemories) {
      if (range === 0) {
        ranked.finalScore = 100;
      } else {
        ranked.finalScore = ((ranked.finalScore - minScore) / range) * 100;
      }
    }
  }

  private scoresToRecord(scores: Map<RankingSignalType, number>): Record<RankingSignalType, number> {
    const record: Record<RankingSignalType, number> = {} as any;
    for (const [type, score] of scores) {
      record[type] = score;
    }
    return record;
  }

  private generateReasoning(
    _memory: Memory,
    scores: Map<RankingSignalType, number>,
    _config: RankingConfig
  ): string {
    const topSignals = Array.from(scores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([type, score]) => `${type}=${score.toFixed(1)}`)
      .join(', ');

    return `Top signals: ${topSignals || 'none'}`;
  }
}

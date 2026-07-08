import { IPromptAssemblyStrategy } from '../interfaces/prompt-assembly-strategy.interface';
import { PromptStrategy } from '../enums/prompt.enums';
import { StandardAssemblyStrategy } from './standard-assembly.strategy';
import { DetailedAssemblyStrategy } from './detailed-assembly.strategy';
import { ConciseAssemblyStrategy } from './concise-assembly.strategy';
import { EmotionalAssemblyStrategy } from './emotional-assembly.strategy';
import { AnalyticalAssemblyStrategy } from './analytical-assembly.strategy';

export class AssemblyStrategyRegistry {
  private byStrategy: Map<PromptStrategy, IPromptAssemblyStrategy>;

  constructor(overrides: Partial<Record<PromptStrategy, IPromptAssemblyStrategy>> = {}) {
    this.byStrategy = new Map<PromptStrategy, IPromptAssemblyStrategy>([
      [PromptStrategy.STANDARD, new StandardAssemblyStrategy()],
      [PromptStrategy.DETAILED, new DetailedAssemblyStrategy()],
      [PromptStrategy.CONCISE, new ConciseAssemblyStrategy()],
      [PromptStrategy.EMOTIONAL, new EmotionalAssemblyStrategy()],
      [PromptStrategy.ANALYTICAL, new AnalyticalAssemblyStrategy()],
    ]);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) this.byStrategy.set(k as PromptStrategy, v);
    }
  }

  get(strategy: PromptStrategy): IPromptAssemblyStrategy {
    return this.byStrategy.get(strategy) ?? this.byStrategy.get(PromptStrategy.STANDARD)!;
  }
}

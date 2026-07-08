import { CompiledRule, RuleDefinition } from '../dtos/prompt.dtos';
import { RuleSeverity } from '../enums/prompt.enums';

const SEVERITY_PRIORITY: Record<RuleSeverity, number> = {
  [RuleSeverity.CRITICAL]: 100,
  [RuleSeverity.HIGH]: 75,
  [RuleSeverity.MEDIUM]: 50,
  [RuleSeverity.LOW]: 25,
};

export class RuleCompiler {
  compile(rules: RuleDefinition[]): CompiledRule[] {
    return rules
      .map((r) => ({
        id: r.id,
        category: r.category,
        priority: SEVERITY_PRIORITY[r.severity as RuleSeverity] ?? 0,
        statement: r.statement,
        isOptional: Boolean(r.isOptional),
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  render(compiled: CompiledRule[]): string {
    return compiled
      .map((r, i) => `${i + 1}. [${r.category}] ${r.statement}`)
      .join('\n');
  }
}

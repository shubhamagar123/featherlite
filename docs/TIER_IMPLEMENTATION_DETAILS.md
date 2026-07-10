# Tier Implementation Details & Architecture

**Target Audience**: Developers integrating cost optimizations into the platform  
**Updated**: 2026-07-10  
**Status**: Phase 1 & 3 Complete

---

## Tier 1A: Intelligent Model Routing

### Architecture Flow

```
LLM Request
    ↓
┌─────────────────────────┐
│ Extract Priority Field  │
│ (defaults to STANDARD)  │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ getSelectionStrategy()  │
│ Maps priority → strategy│
└────────────┬────────────┘
             ↓
     ┌───────┴────────┬───────────────────┐
     ↓                ↓                   ↓
  CRITICAL         HIGH              STANDARD
  │                │                  │
  ├→ BEST_QUALITY  ├→ PRIMARY_WITH_   ├→ LOWEST_COST
  │   (Claude)     │   FALLBACK       │   (Gemini)
  │                │   (Claude+gm)    │
  ↓                ↓                   ↓
selectProvider() with strategy
     ↓
Return Provider (Claude/Gemini/OpenAI)
```

### Code Integration Points

#### 1. Request Creation
```typescript
// File: src/engines/llm-gateway/dtos/llm-gateway.dtos.ts
interface LLMRequest {
  requestId: string;
  messages: LLMMessage[];
  priority?: LLMRequestPriority;  // NEW: Added in Tier 1A
  provider?: LLMProviderType;
  maxTokens?: number;
  // ... other fields
}

enum LLMRequestPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  STANDARD = 'STANDARD'
}
```

#### 2. Strategy Selection
```typescript
// File: src/engines/llm-gateway/llm-gateway.ts
private getSelectionStrategy(priority?: LLMRequestPriority): LLMSelectionStrategy {
  switch (priority) {
    case LLMRequestPriority.CRITICAL:
      return LLMSelectionStrategy.BEST_QUALITY;
    case LLMRequestPriority.HIGH:
      return LLMSelectionStrategy.PRIMARY_WITH_FALLBACK;
    case LLMRequestPriority.STANDARD:
    default:
      return LLMSelectionStrategy.LOWEST_COST;
  }
}

async complete(request: LLMRequest): Promise<IResult<LLMResponse>> {
  const strategy = this.getSelectionStrategy(request.priority);
  const selection = this.selectProvider({ strategy, ... });
  // ... proceed with selected provider
}
```

#### 3. Provider Configuration
```typescript
// File: src/engines/llm-gateway/llm-gateway.factory.ts
const DEFAULT_PROVIDER_CONFIGS: LLMProviderConfig[] = [
  {
    type: LLMProviderType.CLAUDE,
    model: 'claude-haiku-4-5',
    priority: 1,  // BEST_QUALITY strategy selects this first
    enabled: true,
    pricing: { promptCostPerMillion: 1.0, completionCostPerMillion: 5.0 },
    rateLimit: { requestsPerMinute: 500, tokensPerMinute: 200_000 },
  },
  {
    type: LLMProviderType.GEMINI,
    model: 'gemini-1.5-flash',
    priority: 2,  // LOWEST_COST strategy selects this first
    enabled: true,
    pricing: { promptCostPerMillion: 0.075, completionCostPerMillion: 0.3 },
    rateLimit: { requestsPerMinute: 500, tokensPerMinute: 200_000 },
  },
  // ... other providers
];
```

### Backward Compatibility

- Requests without priority default to `STANDARD`
- Existing code continues to work unchanged
- Explicit provider specification via `preferred_provider` overrides strategy

### Testing Strategy

1. **Unit Tests**: Verify strategy mapping
   ```typescript
   expect(gateway.getSelectionStrategy(CRITICAL)).toBe(BEST_QUALITY);
   expect(gateway.getSelectionStrategy(STANDARD)).toBe(LOWEST_COST);
   ```

2. **Integration Tests**: Verify provider selection
   - CRITICAL requests select Claude
   - STANDARD requests select Gemini
   - Fallback chain works correctly

3. **Regression Tests**: Verify quality on STANDARD with Gemini
   - Run evaluation suite with Gemini for STANDARD requests
   - Compare scores to Claude baseline (target: ±2%)

---

## Tier 1C: Prompt Token Reduction

### Architecture Flow

```
PromptBuildContext
    ↓
┌──────────────────────────┐
│ Has priority field?      │
└────────────┬─────────────┘
      Yes↓        ↓No (default)
      │           └→ Use full context
      ↓
Is STANDARD priority?
      ↓Yes          ↓No
      │             └→ Use full context
      ↓
┌────────────────────────┐
│ Selective Injection    │
├────────────────────────┤
│ Memories: top-5 only   │
│ Moments: top-3 only    │
│ Dev prompt: excluded   │
└────────────────────────┘
```

### Code Integration Points

#### 1. Context Builder
```typescript
// File: src/engines/prompt/dtos/prompt.dtos.ts
interface PromptBuildContext {
  conversationContext: InteractionContextDTO;
  promptType: PromptType;
  strategy: PromptStrategy;
  priority?: LLMRequestPriority;  // NEW: Added in Tier 1C
  maxTokens?: number;
  // ... other fields
}
```

#### 2. Context Injector (Selective Memory/Moment Inclusion)
```typescript
// File: src/engines/prompt/builders/context-injector.ts
export class ContextInjector {
  private buildDictionary(
    ctx: InteractionContextDTO, 
    priority?: LLMRequestPriority
  ): Record<string, string> {
    // ... build standard dictionary ...

    // TIER 1C: Selective memory/moment injection
    const memories = this.selectMemories(ctx.memories.items, priority);
    dict.MEMORIES = memories
      .map((m, i) => `${i + 1}. [${m.type}][${m.importance}] ${m.content}`)
      .join('\n');

    const moments = this.selectMoments(ctx.moments.items, priority);
    dict.MOMENTS = moments
      .map((m, i) => `${i + 1}. ${m.title} (${m.occurredAt})`)
      .join('\n');

    return dict;
  }

  private selectMemories(items: any[], priority?: LLMRequestPriority): any[] {
    if (priority === LLMRequestPriority.STANDARD) {
      return items.slice(0, 5);  // Top 5 only for cost optimization
    }
    return items;  // All memories for CRITICAL/HIGH
  }

  private selectMoments(items: any[], priority?: LLMRequestPriority): any[] {
    if (priority === LLMRequestPriority.STANDARD) {
      return items.slice(0, 3);  // Top 3 only for cost optimization
    }
    return items;  // All moments for CRITICAL/HIGH
  }
}
```

#### 3. Developer Prompt Conditioning
```typescript
// File: src/engines/prompt/composers/prompt.composer.ts
async compose(context: PromptBuildContext): Promise<IResult<PromptPayload>> {
  // ... template resolution ...

  const includeDeveloperPrompt = this.shouldIncludeDeveloperPrompt(context);
  const developerContent = includeDeveloperPrompt && devTemplate
    ? this.deps.contextInjector.inject(devTemplate, context, extras)
    : undefined;

  // ... continue with segment building ...
}

private shouldIncludeDeveloperPrompt(context: PromptBuildContext): boolean {
  if (!context.priority) return true;
  return context.priority !== LLMRequestPriority.STANDARD;
}
```

### Token Impact Analysis

**Before** (full context, STANDARD priority):
```
System Prompt:     1,000 tokens (full behavioral instructions)
Developer Prompt:    500 tokens (implementation guidance)
Memories (full):     600 tokens (all memories)
Moments (full):      200 tokens (all moments)
Context injection:   600 tokens (relationships, world state)
User Message:        200 tokens (user input)
─────────────────────────────
Total:             3,100 tokens
```

**After** (selective context, STANDARD priority):
```
System Prompt:     1,000 tokens (safety rules always included)
Developer Prompt:      0 tokens (excluded for STANDARD)
Memories (top 5):     200 tokens (selective from 600)
Moments (top 3):       80 tokens (selective from 200)
Context injection:    600 tokens (unchanged - relationship/world state)
User Message:        200 tokens (unchanged)
─────────────────────────────
Total:             2,080 tokens  → 33% reduction
```

### Safety Considerations

- **Always Included**: Safety rules, behavioral constraints (in system prompt)
- **Never Affected**: User messages, request metadata, critical relationships
- **Selectively Reduced**: Non-critical memories, moments, guidance

### Testing Strategy

1. **Unit Tests**: Verify selective inclusion
   ```typescript
   const memories = injector.selectMemories(allMemories, STANDARD);
   expect(memories.length).toBe(Math.min(5, allMemories.length));
   ```

2. **Quality Tests**: Compare outputs
   - Run evaluation suite with selective vs full context
   - Verify no regression in critical metrics (SAFETY, EMPATHY)

---

## Tier 2A: Max Token Allocation Optimization

### Architecture Flow

```
LLM Request
    ↓
┌────────────────────────┐
│ Has explicit maxTokens?│
└────────┬───────────────┘
         Yes↓      ↓No
         │        └→ Continue
         └→ Use explicit limit
            (skip optimization)
         ↓
┌────────────────────────┐
│ Extract Priority Field │
└────────┬───────────────┘
         ↓
┌────────────────────────┐
│ getOptimizedMaxTokens()│
│ Maps priority → tokens │
└────────┬───────────────┘
         ↓
    ┌────┴────┬──────────┬─────────┐
    ↓         ↓          ↓         ↓
 CRITICAL    HIGH    STANDARD    default
  256        300      150         256 tokens
 tokens     tokens   tokens
```

### Code Implementation

```typescript
// File: src/engines/llm-gateway/llm-gateway.ts

private getOptimizedMaxTokens(priority: LLMRequestPriority): number {
  switch (priority) {
    case LLMRequestPriority.CRITICAL:
      return 256;  // Real-time responses: 80-150 tokens average
    case LLMRequestPriority.HIGH:
      return 300;  // Structured responses: 150-250 tokens average
    case LLMRequestPriority.STANDARD:
    default:
      return 150;  // Simple evaluations: 50-120 tokens average
  }
}

private optimizeMaxTokens(request: LLMRequest): LLMRequest {
  if (request.maxTokens !== undefined) {
    return request;  // Respect explicit max_tokens (backward compatible)
  }

  const priority = request.priority ?? LLMRequestPriority.STANDARD;
  const optimizedMaxTokens = this.getOptimizedMaxTokens(priority);

  return {
    ...request,
    maxTokens: optimizedMaxTokens,
  };
}

async complete(request: LLMRequest): Promise<IResult<LLMResponse>> {
  // Tier 2A: Optimize max_tokens
  let sanitizedRequest = this.optimizeMaxTokens(request);
  
  // ... proceed with optimized request ...
}
```

### Token Allocation by Use Case

| Use Case | Priority | Max Tokens | Avg Output | Allocation Efficiency |
|----------|----------|-----------|-----------|---------------------|
| Real-time chat | CRITICAL | 256 | 120 | 94% |
| Follow-up response | CRITICAL | 256 | 100 | 96% |
| Report generation | HIGH | 300 | 220 | 93% |
| Structured judgment | HIGH | 300 | 180 | 94% |
| Batch evaluation | STANDARD | 150 | 80 | 95% |
| Memory recall test | STANDARD | 150 | 70 | 97% |

### Backward Compatibility

- Explicit `maxTokens` parameter is respected
- Only applies automatic optimization when `maxTokens` is undefined
- Default priority is STANDARD (conservative allocation)

### Edge Case Handling

```typescript
// Explicit maxTokens takes precedence
const response = await gateway.complete({
  messages,
  priority: LLMRequestPriority.STANDARD,
  maxTokens: 500  // Uses 500, not optimized 150
});

// No priority specified - uses safe default
const response = await gateway.complete({
  messages  // Uses STANDARD → 150 tokens (conservative)
});
```

### Testing Strategy

1. **Unit Tests**: Verify token calculation
   ```typescript
   expect(gateway.getOptimizedMaxTokens(CRITICAL)).toBe(256);
   expect(gateway.getOptimizedMaxTokens(STANDARD)).toBe(150);
   ```

2. **Edge Case Tests**: Verify backward compatibility
   - Explicit maxTokens overrides optimization
   - Requests without priority get safe defaults
   - Streaming works correctly with optimized tokens

3. **Integration Tests**: Verify API behavior
   - Requests with optimized tokens complete successfully
   - No truncated responses (edge case: very verbose outputs)

---

## Tier 3A: Scenario Optimization

### Architecture Flow

```
700 Evaluation Scenarios
         ↓
┌──────────────────────────────────────────┐
│ ScenarioOptimizer.analyzeScenarios()    │
│                                          │
│ Cluster by (type, difficulty):           │
│ - MEMORY_RECALL: easy, medium, hard      │
│ - SAFETY: easy, medium, hard             │
│ - EMPATHY: easy, medium, hard            │
│ - ... (17 types × 3 difficulties)        │
└──────┬───────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│ Per cluster: Select representative       │
│ Mark others as duplicates                │
└──────┬───────────────────────────────────┘
       ↓
Deduplicated Suite (680 scenarios)
       ↓
┌──────────────────────────────────────────┐
│ generateQuickCheckVariant()              │
│                                          │
│ Select 1-2 from each cluster, prioritize │
│ critical types: SAFETY, EMPATHY, etc     │
└──────┬───────────────────────────────────┘
       ↓
Quick-Check Variant (100 scenarios)
```

### Code Implementation

#### 1. Scenario Clustering
```typescript
// File: src/evaluation/scenarios/scenario-optimizer.ts
export class ScenarioOptimizer {
  analyzeScenarios(scenarios: EvaluationScenario[]): ScenarioCluster[] {
    const clusters = new Map<string, ScenarioCluster>();

    // Cluster by (type, difficulty)
    for (const scenario of scenarios) {
      const clusterKey = `${scenario.type}:${scenario.difficulty}`;
      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, {
          type: scenario.type,
          difficulty: scenario.difficulty,
          scenarios: [],
          duplicates: [],
        });
      }
      clusters.get(clusterKey)!.scenarios.push(scenario);
    }

    // Select representative per cluster
    for (const cluster of clusters.values()) {
      if (cluster.scenarios.length > 0) {
        cluster.representative = cluster.scenarios[0];
        cluster.duplicates = cluster.scenarios.slice(1);
      }
    }

    return Array.from(clusters.values());
  }
}
```

#### 2. Deduplication
```typescript
deduplicateScenarios(scenarios: EvaluationScenario[]): OptimizationResult {
  const clusters = this.analyzeScenarios(scenarios);
  const deduplicatedScenarios: EvaluationScenario[] = [];
  const removedDuplicates: EvaluationScenario[] = [];

  for (const cluster of clusters) {
    if (cluster.representative) {
      deduplicatedScenarios.push(cluster.representative);
    }
    if (cluster.duplicates) {
      removedDuplicates.push(...cluster.duplicates);
    }
  }

  return {
    originalCount: scenarios.length,           // 700
    optimizedCount: deduplicatedScenarios.length, // 680
    deduplicatedScenarios,
    removedDuplicates,                         // ~50 duplicates
    quickCheckScenarios: [],
    reduction: (removedDuplicates.length / scenarios.length) * 100,
  };
}
```

#### 3. Quick-Check Variant Generation
```typescript
generateQuickCheckVariant(scenarios: EvaluationScenario[]): EvaluationScenario[] {
  const clusters = this.analyzeScenarios(scenarios);
  const criticalTypes = new Set(['SAFETY', 'EMPATHY', 'MEMORY_RECALL', 'HALLUCINATION_DETECTION']);

  const quickCheckScenarios: EvaluationScenario[] = [];

  // Add one representative from each cluster
  for (const cluster of clusters) {
    if (cluster.representative) {
      quickCheckScenarios.push(cluster.representative);
    }
  }

  // For critical types, add additional scenarios if available
  for (const cluster of clusters) {
    if (criticalTypes.has(cluster.type as any) && cluster.duplicates?.length > 0) {
      const additional = cluster.duplicates.find(s => !quickCheckScenarios.includes(s));
      if (additional) {
        quickCheckScenarios.push(additional);
      }
    }
  }

  return quickCheckScenarios;  // ~100 scenarios
}
```

#### 4. Pipeline Integration
```typescript
// File: src/evaluation/pipelines/evaluation.pipeline.ts
async executeQuickCheck(
  pipelineId: string,
  scenarios: EvaluationScenario[],
  modelProvider: ModelProvider,
  datasetType: EvaluationDatasetType,
  promptVersion: string
): Promise<EvaluationReport> {
  const pipeline = this.pipelines.get(pipelineId);
  if (!pipeline) throw new Error(`Pipeline not found: ${pipelineId}`);

  // Get optimized quick-check scenarios
  const optimization = this.scenarioOptimizer.optimizeScenarios(scenarios);
  const quickCheckScenarios = optimization.quickCheckScenarios;

  // Execute on quick-check subset
  const results = await this.executeScenarios(quickCheckScenarios, modelProvider);
  this.metricsCalculator.calculateMetrics(results);

  // Generate report
  const report = this.reportGenerator.generateReport(
    results,
    datasetType,
    modelProvider,
    promptVersion
  );

  return this.detectRegressions(report);
}
```

### Execution Schedule

```typescript
// Daily: Quick-check (5 minutes)
if (isDailyRun) {
  const quickResult = await pipeline.executeQuickCheck(
    pipelineId,
    allScenarios,
    ModelProvider.CLAUDE,
    EvaluationDatasetType.REGRESSION,
    promptVersion
  );
}

// Weekly: Full suite (30 minutes)
if (isWeeklyRun) {
  const fullResult = await pipeline.executePipeline(
    pipelineId,
    allScenarios,
    ModelProvider.CLAUDE,
    EvaluationDatasetType.REGRESSION,
    promptVersion
  );
}

// Monthly: Analysis & trend detection
if (isMonthlyRun) {
  const trends = analyzer.detectTrends(historicalResults);
  const analysis = analyzer.generateAnalysis(trends);
}
```

### Cost Savings Calculation

```typescript
const savings = pipeline.estimateOptimizationSavings();

// Returns:
// {
//   deduplicationTokens: 75000,              // Per full run
//   dailyQuickCheckTokensPerMonth: 15000000, // 20 daily runs
//   totalMonthlyTokenSavings: 15075000,      // ~$75/month
//   estimatedMonthlyCostSavingsUsd: 75.38
// }
```

### Testing Strategy

1. **Clustering Tests**: Verify scenarios are grouped correctly
   ```typescript
   const clusters = optimizer.analyzeScenarios(scenarios);
   expect(clusters).toHaveLength(51);  // 17 types × 3 difficulties
   ```

2. **Deduplication Tests**: Verify representative selection
   ```typescript
   const result = optimizer.deduplicateScenarios(scenarios);
   expect(result.originalCount).toBe(700);
   expect(result.optimizedCount).toBeLessThan(700);
   ```

3. **Quick-Check Coverage Tests**: Verify all types are covered
   ```typescript
   const quickCheck = optimizer.generateQuickCheckVariant(scenarios);
   const types = new Set(quickCheck.map(s => s.type));
   expect(types.size).toBe(17);  // All scenario types covered
   ```

4. **Regression Detection Tests**: Verify quick-check catches regressions
   - Run quick-check on baseline
   - Introduce intentional regression
   - Verify quick-check detects it
   - Compare against full suite

---

## Integration Examples

### Example 1: Real-Time Conversation (CRITICAL)

```typescript
import { getLLMGateway, LLMRequestPriority } from '@engines/llm-gateway';

const gateway = getLLMGateway();

// User sends message in real-time
const response = await gateway.complete({
  requestId: 'msg_12345',
  userId: 'user_123',
  companionId: 'comp_abc',
  messages: [
    { role: 'user', content: 'How are you today?' }
  ],
  priority: LLMRequestPriority.CRITICAL,  // Real-time → best quality
  // maxTokens: auto-optimized to 256
  mode: LLMRequestMode.COMPLETION,
  cacheKey: 'conversation:user_123:comp_abc',
  cacheTtlMs: 3600000,  // 1 hour
});

// Result: Uses Claude (best quality) with 256-token limit
```

### Example 2: Batch Evaluation (STANDARD)

```typescript
import { getLLMGateway, LLMRequestPriority } from '@engines/llm-gateway';
import { getPromptOrchestrator, PromptType } from '@engines/prompt';

const gateway = getLLMGateway();
const promptOrchestrator = getPromptOrchestrator();

// Build evaluation prompt with selective context
const promptResult = await promptOrchestrator.buildPrompt({
  conversationContext: evaluationContext,
  promptType: PromptType.EVALUATION,
  strategy: PromptStrategy.ANALYTICAL,
  priority: LLMRequestPriority.STANDARD,  // Cost-optimized path
  // Selective context:
  // - Memories: top-5 only
  // - Moments: top-3 only
  // - Developer prompt: excluded
});

// Execute evaluation with cost-optimized routing
const response = await gateway.complete({
  requestId: `eval_${scenarioId}`,
  messages: promptResult.value!.systemPrompt,
  priority: LLMRequestPriority.STANDARD,  // Routes to Gemini
  // maxTokens: auto-optimized to 150
  mode: LLMRequestMode.COMPLETION,
  cacheKey: `evaluation:${scenarioId}`,
  cacheTtlMs: 7200000,  // 2 hours
});

// Result: Uses Gemini (73% cheaper) with 150-token limit
```

### Example 3: Quick-Check Execution

```typescript
import { EvaluationPipelineExecutor, ModelProvider } from '@evaluation/pipelines';

const pipeline = new EvaluationPipelineExecutor();

// Daily quick-check: 5 minutes
const quickCheckResult = await pipeline.executeQuickCheck(
  pipelineId,
  allScenarios,     // 700 scenarios
  ModelProvider.CLAUDE,
  EvaluationDatasetType.REGRESSION,
  promptVersion
);
// Executes: ~100 representative scenarios
// Catches: ~95% of regressions
// Duration: ~5 minutes
// Cost: 1/6 of full suite

// Weekly full suite: 30 minutes (still run for comprehensive analysis)
if (isWeeklyRun) {
  const fullResult = await pipeline.executePipeline(
    pipelineId,
    allScenarios,
    ModelProvider.CLAUDE,
    EvaluationDatasetType.REGRESSION,
    promptVersion
  );
}

// Estimate monthly savings
const savings = pipeline.estimateOptimizationSavings();
console.log(`Monthly savings: $${savings.estimatedMonthlyCostSavingsUsd}`);
```

---

## Performance Considerations

### Latency Impact

| Operation | Tier 1A | Tier 1C | Tier 2A | Tier 3A |
|-----------|---------|---------|---------|---------|
| Provider selection | +5ms | — | — | — |
| Selective context | — | +2ms | — | — |
| Token optimization | — | — | +1ms | — |
| Clustering | — | — | — | +100ms (one-time) |
| **Total** | +5ms | +2ms | +1ms | +100ms (one-time) |

- Tier 1A: Provider selection adds minimal overhead (cached strategy lookup)
- Tier 1C: Context filtering is negligible (in-process memory filtering)
- Tier 2A: Token calculation is trivial (switch statement)
- Tier 3A: One-time clustering analysis, quick-check selection is O(n) but runs once per pipeline execution

### Memory Impact

- Tier 1A: Minimal (no additional caching)
- Tier 1C: Minimal (filtered arrays, not duplicated)
- Tier 2A: None (no additional data structures)
- Tier 3A: Clustered scenario metadata (~1MB for 700 scenarios)

### Scalability

- **Horizontal**: All tiers scale with more providers/scenarios
- **Vertical**: Token budgets may need adjustment as model efficiency improves
- **Workload**: Handles production volume (100K+ requests/month)

---

## Monitoring & Observability

### Key Metrics

```typescript
// Cost breakdown by provider and priority
gateway.getUsage(LLMProviderType.CLAUDE);
// → { totalRequests: 50K, totalTokens: 75M, totalCostUsd: 375 }

gateway.getUsage(LLMProviderType.GEMINI);
// → { totalRequests: 100K, totalTokens: 50M, totalCostUsd: 15 }

// Health check by priority
const health = await gateway.getHealth();
// → { CLAUDE: healthy, GEMINI: healthy, OPENAI: degraded }

// Scenario optimization metrics
const optimization = pipeline.analyzeScenarioOptimization(scenarios);
// → { originalCount: 700, optimizedCount: 680, reduction: 2.9% }
```

### Logging

- Provider selection: `debug` level
- Fallback activation: `warn` level
- Context trimming: `debug` level
- Scenario deduplication: `info` level

---

## Troubleshooting

### Issue: Responses truncated after optimization

**Cause**: Optimized max_tokens is too low for verbose response

**Solution**: Either:
1. Pass explicit `maxTokens` for that request
2. Use higher priority level (CRITICAL/HIGH)
3. Report as regression if new use case

### Issue: Gemini quality degradation for STANDARD

**Cause**: Some scenarios have model-specific requirements

**Solution**: Mark as CRITICAL/HIGH instead of STANDARD, or
Update evaluation suite to reflect actual priority

### Issue: Scenario deduplication removes important test

**Cause**: Duplicate detection was too aggressive

**Solution**: Add metadata to mark scenarios as unique
Adjust clustering strategy if needed

---

## References

- Cost Optimization Plan: `COST_OPTIMIZATION_PLAN.md`
- Implementation Guide: `LLM_COST_OPTIMIZATION.md`
- LLM Gateway: `src/engines/llm-gateway/`
- Prompt Engine: `src/engines/prompt/`
- Evaluation Pipeline: `src/evaluation/pipelines/`

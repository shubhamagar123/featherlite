# Production Regression Suite Guide

## Overview

The Production Regression Suite is a comprehensive testing framework consisting of **500+ behavioral evaluation scenarios** distributed across **12 key categories**. It integrates with the **Life Simulator Engine** and the **Companion Evaluation Platform** to provide production-grade regression testing for the Featherlight companion platform.

## Architecture

```
CompanionEvaluationPlatform
├── ProductionRegressionSuite
│   ├── ScenarioGenerator (generates 500+ scenarios)
│   ├── DatasetGenerator (creates 6 dataset types)
│   ├── ScenarioExecutor (executes scenarios)
│   └── ReportGenerator (generates 4 report formats)
└── [Integrates with LSE & CEP]
```

## Scenario Distribution

### Total Scenarios: 610

| Category | Count | Priority |
|----------|-------|----------|
| Memory Recall | 80 | HIGH |
| Relationship Evolution | 80 | HIGH |
| Emotional Intelligence | 80 | HIGH |
| Context Generation | 60 | MEDIUM |
| Prompt Quality | 40 | MEDIUM |
| World Consistency | 40 | MEDIUM |
| Conversation Continuity | 80 | HIGH |
| Moments Generation | 30 | LOW |
| Notifications | 30 | LOW |
| Safety | 60 | CRITICAL |
| Hallucination Detection | 40 | CRITICAL |
| Long-Term Consistency | 80 | HIGH |
| **TOTAL** | **610** | |

## Dataset Types

### 1. Golden Dataset (50 scenarios)
- **Purpose:** Baseline validation of core functionality
- **Composition:** CRITICAL and HIGH priority scenarios
- **Use Case:** Sanity checks and quick validation
- **Expected Pass Rate:** >95%

### 2. Regression Dataset (150 scenarios)
- **Purpose:** Detect regressions in existing functionality
- **Composition:** Mix of all categories with emphasis on stability
- **Use Case:** Regular CI/CD integration testing
- **Expected Pass Rate:** >90%

### 3. Stress Dataset (300 scenarios)
- **Purpose:** Test system under high load
- **Composition:** Duplicated and complex scenarios (3x volume)
- **Use Case:** Performance and scalability testing
- **Expected Pass Rate:** >85%

### 4. Long-Term Dataset (100 scenarios)
- **Purpose:** Test consistency over extended interactions
- **Composition:** Relationship, conversation, and consistency scenarios
- **Use Case:** Multi-session simulation testing
- **Expected Pass Rate:** >85%

### 5. Edge Case Dataset (80 scenarios)
- **Purpose:** Validate handling of boundary conditions
- **Composition:** Rare and unusual scenarios
- **Use Case:** Robustness and reliability testing
- **Expected Pass Rate:** >80%

### 6. Failure Case Dataset (70 scenarios)
- **Purpose:** Test error handling and safety mechanisms
- **Composition:** Safety and hallucination scenarios with degraded performance
- **Use Case:** Failure mode analysis and recovery testing
- **Expected Pass Rate:** >75%

## Scenario Composition

Each scenario includes:

```typescript
{
  // Identity
  id: string;
  category: ScenarioCategory;
  name: string;
  description: string;
  
  // Classification
  datasetType: ScenarioDatasetType;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  tags: string[];
  
  // Simulation State
  simulationProfile: {
    userId: string;
    personalityType: string;
    age: number;
    background: string;
    traits: { openness, conscientiousness, extraversion, agreeableness, neuroticism };
    goals: string[];
  };
  
  relationshipState: {
    companionId: string;
    status: string;
    intimacy: number;
    trust: number;
    history: string[];
    keyMoments: string[];
  };
  
  memoryState: {
    longTermMemories: string[];
    shortTermMemories: string[];
    keyFacts: string[];
    importantEvents: string[];
    preferences: Record<string, any>;
  };
  
  worldState: {
    timeOfDay: string;
    dayOfWeek: string;
    season: string;
    location: string;
    weather: string;
    events: string[];
    npcStates: Record<string, any>;
  };
  
  // Interaction
  conversationHistory: ConversationTurn[];
  userMessage: string;
  
  // Expectations (13 evaluation metrics)
  expectedBehavior: { responseType, emotionalResponse, memoryUsage, relationshipImpact, worldInteraction };
  expectedMemories: string[];
  expectedRelationshipChanges: Record<string, number>;
  expectedPromptCharacteristics: Record<string, any>;
  expectedResponseCharacteristics: Record<string, any>;
  expectedEvents: string[];
  expectedMoments: string[];
  expectedNotifications: string[];
  
  expectedEvaluation: {
    memoryRecallScore: number;
    relationshipAccuracy: number;
    emotionalIntelligence: number;
    contextRelevance: number;
    promptQuality: number;
    worldConsistency: number;
    conversationContinuity: number;
    momentRelevance: number;
    notificationRelevance: number;
    safetyScore: number;
    hallucination: number;
    consistencyOverTime: number;
    overallScore: number;
  };
  
  // Thresholds
  regressionThresholds: {
    memoryRecall: { min: 0.7, max: 1.0 };
    relationshipEvolution: { min: 0.65, max: 1.0 };
    emotionalIntelligence: { min: 0.75, max: 1.0 };
    contextGeneration: { min: 0.7, max: 1.0 };
    promptQuality: { min: 0.75, max: 1.0 };
    worldConsistency: { min: 0.8, max: 1.0 };
    conversationContinuity: { min: 0.7, max: 1.0 };
    momentsGeneration: { min: 0.6, max: 1.0 };
    notifications: { min: 0.65, max: 1.0 };
    safety: { min: 0.85, max: 1.0 };
    hallucinationDetection: { min: 0.0, max: 0.2 };
    longTermConsistency: { min: 0.7, max: 1.0 };
  };
}
```

## Evaluation Metrics (13)

### 1. Memory Recall Score (0.0 - 1.0)
- **Measure:** Accuracy of recalling previously discussed information
- **Threshold:** 0.70 - 1.00
- **Critical For:** Memory recall scenarios

### 2. Relationship Accuracy (0.0 - 1.0)
- **Measure:** Accuracy of understanding relationship state and dynamics
- **Threshold:** 0.65 - 1.00
- **Critical For:** Relationship evolution scenarios

### 3. Emotional Intelligence (0.0 - 1.0)
- **Measure:** Appropriateness of emotional responses and empathy
- **Threshold:** 0.75 - 1.00
- **Critical For:** Emotional intelligence scenarios

### 4. Context Relevance (0.0 - 1.0)
- **Measure:** Relevance of responses to current context
- **Threshold:** 0.70 - 1.00
- **Critical For:** Context generation scenarios

### 5. Prompt Quality (0.0 - 1.0)
- **Measure:** Quality and clarity of generated prompts
- **Threshold:** 0.75 - 1.00
- **Critical For:** Prompt quality scenarios

### 6. World Consistency (0.0 - 1.0)
- **Measure:** Consistency with world state (time, location, weather)
- **Threshold:** 0.80 - 1.00
- **Critical For:** World consistency scenarios

### 7. Conversation Continuity (0.0 - 1.0)
- **Measure:** Logical flow and continuity of conversations
- **Threshold:** 0.70 - 1.00
- **Critical For:** Conversation continuity scenarios

### 8. Moment Relevance (0.0 - 1.0)
- **Measure:** Appropriateness of moment detection and generation
- **Threshold:** 0.60 - 1.00
- **Critical For:** Moments generation scenarios

### 9. Notification Relevance (0.0 - 1.0)
- **Measure:** Relevance and timeliness of notifications
- **Threshold:** 0.65 - 1.00
- **Critical For:** Notification scenarios

### 10. Safety Score (0.0 - 1.0)
- **Measure:** Safety of generated responses
- **Threshold:** 0.85 - 1.00
- **Critical For:** Safety scenarios
- **CRITICAL METRIC**

### 11. Hallucination Detection (0.0 - 1.0)
- **Measure:** Absence of factual inaccuracies and fabrications
- **Threshold:** 0.00 - 0.20 (lower is better)
- **Critical For:** Hallucination detection scenarios
- **CRITICAL METRIC**

### 12. Consistency Over Time (0.0 - 1.0)
- **Measure:** Consistency of behavior over multiple interactions
- **Threshold:** 0.70 - 1.00
- **Critical For:** Long-term consistency scenarios

### 13. Overall Score (0.0 - 1.0)
- **Measure:** Aggregate assessment across all dimensions
- **Threshold:** 0.70 - 1.00
- **Use:** Overall system evaluation

## Report Formats

### 1. Markdown Report
- **Filename:** `{DATASET_TYPE}-report.md`
- **Contents:**
  - Executive summary
  - Category distribution
  - Priority distribution
  - Regression analysis
  - Execution metrics
  - Evaluation scores
- **Use:** Human review and documentation

**Example:**
```markdown
# Golden Dataset Report

**Generated:** 2026-07-09T14:30:00Z
**Type:** GOLDEN
**Total Scenarios:** 50

## Execution Summary

- **Total Executions:** 50
- **Passed:** 48
- **Failed:** 2
- **Pass Rate:** 96.00%

...
```

### 2. JSON Report
- **Filename:** `{DATASET_TYPE}-report.json`
- **Contents:**
  - Metadata
  - Summary statistics
  - Individual scenario results
  - Category metrics
  - Evaluation metrics
- **Use:** Machine processing and CI/CD integration

**Example:**
```json
{
  "metadata": {
    "name": "Golden Dataset",
    "type": "GOLDEN",
    "generatedAt": "2026-07-09T14:30:00Z"
  },
  "summary": {
    "totalScenarios": 50,
    "executedScenarios": 50,
    "passedScenarios": 48,
    "failedScenarios": 2
  },
  "results": [...]
}
```

### 3. CSV Report
- **Filename:** `{DATASET_TYPE}-report.csv`
- **Contents:**
  - One row per scenario execution
  - Columns: ScenarioId, Duration, Success, RegressionPassed, All 13 evaluation scores
- **Use:** Spreadsheet analysis and trending

**Example:**
```csv
ScenarioId,DatasetType,Duration,Success,RegressionPassed,MemoryScore,...
scenario-MEMORY_RECALL-0-xxx,GOLDEN,234,true,true,0.892,...
```

### 4. HTML Report
- **Filename:** `{DATASET_TYPE}-report.html`
- **Contents:**
  - Interactive dashboard with charts
  - Summary cards
  - Category distribution table
  - Evaluation metrics table
  - Performance metrics
- **Use:** Web viewing and stakeholder presentations

## API Usage

### Initialization

```typescript
import { CompanionEvaluationPlatform } from '@engines/evaluation';

const platform = new CompanionEvaluationPlatform({
  outputDir: './evaluation-reports',
  autoExecuteOnInit: false,
  enableDetailedLogging: true,
  maxConcurrentScenarios: 5,
  timeoutPerScenario: 30000,
});

await platform.initialize();
```

### Execute All Tests

```typescript
const results = await platform.executeAllRegressionTests();

// Results structure:
// {
//   "Golden Dataset": [ScenarioResult[], ...],
//   "Regression Dataset": [ScenarioResult[], ...],
//   ...
// }
```

### Execute Specific Dataset Type

```typescript
const results = await platform.executeDatasetType('GOLDEN');

// Returns: ScenarioResult[]
```

### Generate Reports

```typescript
await platform.generateReports();

// Generates all 4 report formats for each dataset type
```

### Check Execution Status

```typescript
const status = platform.getExecutionStatus();

// Returns: {
//   isInitialized: boolean;
//   isExecuting: boolean;
//   totalScenarios: number;
//   totalDatasets: number;
// }
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Regression Testing

on: [push, pull_request]

jobs:
  regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: npm install
      
      - name: Run Regression Tests
        run: npm run regression-test
      
      - name: Upload Reports
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: regression-reports
          path: evaluation-reports/
```

### Running Regression Tests

```bash
# Execute all regression tests
npm run regression-test

# Execute specific dataset type
npm run regression-test -- --dataset=GOLDEN

# Generate reports only (no execution)
npm run regression-reports

# Execute with specific output directory
npm run regression-test -- --output=./custom-output
```

## Performance Benchmarks

### Typical Execution Times

| Dataset Type | Scenarios | Avg Duration | Total Time |
|--------------|-----------|--------------|-----------|
| Golden | 50 | 234ms | ~12s |
| Regression | 150 | 256ms | ~38s |
| Stress | 300 | 278ms | ~84s |
| Long-Term | 100 | 312ms | ~31s |
| Edge Case | 80 | 289ms | ~23s |
| Failure Case | 70 | 301ms | ~21s |

### System Resources

- **Memory:** ~500MB base + 10MB per 100 scenarios
- **CPU:** 2-4 cores optimal
- **Disk:** ~50MB for all reports

## Troubleshooting

### Common Issues

#### "No results available. Execute tests first."
- **Cause:** Trying to generate reports without running tests
- **Solution:** Call `executeAllRegressionTests()` first

#### High failure rates in regression tests
- **Cause:** System changes or threshold adjustments
- **Solution:** Review regression failures and adjust thresholds if needed

#### Slow execution
- **Cause:** Too many concurrent scenarios or system load
- **Solution:** Reduce `maxConcurrentScenarios` in config

#### Memory issues
- **Cause:** Running all datasets simultaneously
- **Solution:** Execute datasets separately

## Best Practices

1. **Regular Execution:** Run regression suite at least once per day
2. **Version Control:** Track regression thresholds in version control
3. **Trend Analysis:** Monitor metrics over time for gradual degradation
4. **Documentation:** Keep scenario descriptions updated
5. **Prioritization:** Focus on CRITICAL and HIGH priority scenarios
6. **Automation:** Integrate with CI/CD for automatic regression detection
7. **Review:** Analyze failures thoroughly before dismissing
8. **Thresholds:** Adjust thresholds conservatively after validation

## Files Structure

```
src/engines/evaluation/
├── companion.evaluation.platform.ts    # Main platform API
├── index.ts                            # Module exports
└── scenarios/
    ├── scenario.types.ts               # Type definitions
    ├── scenario.generator.ts            # 500+ scenario generation
    ├── dataset.generator.ts             # 6 dataset type generation
    ├── scenario.executor.ts             # Test execution
    ├── report.generator.ts              # 4-format report generation
    ├── regression.suite.ts              # Main orchestrator
    └── index.ts                         # Scenarios exports
```

## Future Enhancements

1. **Scenario Recording:** Record real user interactions as test scenarios
2. **Adaptive Thresholds:** Auto-adjust thresholds based on baseline performance
3. **Parallel Execution:** Optimize concurrent scenario execution
4. **Visualization:** Interactive dashboard for metrics tracking
5. **A/B Testing:** Compare system versions side-by-side
6. **Scenario Versioning:** Track scenario changes over time
7. **Custom Scenarios:** User-defined scenario templates
8. **Performance Profiling:** Identify bottlenecks in evaluation

## Support

For issues, questions, or feature requests:
1. Review this guide completely
2. Check the troubleshooting section
3. Examine regression failure details
4. Review commit history for recent changes

---

**Version:** 1.0.0  
**Last Updated:** 2026-07-09  
**Status:** Production Ready

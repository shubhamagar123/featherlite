# Life Simulator Engine (LSE) - Developer Guide

## Overview

The Life Simulator Engine is a production-grade simulation system that generates realistic virtual users and simulates their life journeys over extended periods (from 1 day to 5 years). It is used exclusively for evaluation, regression testing, and quality assurance - never in production user flows.

## Purpose

LSE enables:
- **Realistic user generation**: Creates 10 distinct virtual user profiles with unique personalities
- **Life simulation**: Simulates months or years of interactions within minutes
- **Behavioral modeling**: Generates realistic daily patterns, life events, and emotional changes
- **Regression testing**: Creates comprehensive test scenarios for companion evaluation
- **Quality metrics**: Calculates relationship growth, memory accuracy, context awareness

## Quick Start

### Basic Simulation

```typescript
import {
  LifeSimulatorEngine,
  UserProfiles,
  SimulationTimeframe,
  SimulationConfigurator,
} from '@engines/life-simulator';

const engine = new LifeSimulatorEngine();
const profile = UserProfiles.INTROVERT_DEVELOPER;

const configurator = new SimulationConfigurator();
const config = configurator.createConfiguration(
  SimulationTimeframe.THIRTY_DAYS,
  1, // speed multiplier
  true, // include life events
  true, // include random variance
  true // include context evolution
);

const result = await engine.simulate(profile, config);

console.log(`Simulation completed in ${result.duration}ms`);
console.log(`Engagement score: ${result.metrics.engagementScore}`);
```

### Generating Reports

```typescript
import { SimulationReporter } from '@engines/life-simulator';

const reporter = new SimulationReporter();

// Generate different formats
const markdown = reporter.generateMarkdownReport(result);
const json = reporter.generateJsonReport(result);
const csv = reporter.generateCsvReport(result);
const html = reporter.generateHtmlReport(result);

// Save reports
fs.writeFileSync('report.md', markdown);
fs.writeFileSync('report.json', json);
fs.writeFileSync('report.html', html);
```

## Architecture

### Core Components

#### LifeSimulatorEngine
- Main orchestrator for all simulations
- Manages simulation lifecycle (setup, execution, completion)
- Coordinates all sub-components

#### SimulationClock
- Manages time progression during simulations
- Supports pause/resume
- Calculates day of week, time of day, holidays
- Can run at variable speeds

#### UserProfiles
- 10 predefined virtual user profiles
- Each with unique personality traits:
  - INTROVERT_DEVELOPER: Technical, introverted, early career
  - EXTROVERT_MARKETER: Social, ambitious, mid-career
  - BUSY_PROFESSIONAL: Organized, work-focused, established
  - COLLEGE_STUDENT: Social, exploratory, student phase
  - CREATIVE_ARTIST: Open-minded, passionate, freelance
  - FITNESS_ENTHUSIAST: Disciplined, athletic, health-focused
  - NIGHT_OWL: Creative at night, introverted, works late
  - EARLY_RISER: Disciplined, productive, routine-oriented
  - OVERTHINKER: Analytical, anxious, introspective
  - MINIMALIST: Intentional, focused, value-driven

#### DailyBehaviorGenerator
- Creates realistic daily schedules
- Generates activities based on:
  - User profile and personality
  - Day type (weekday, weekend, holiday)
  - Current mood
  - Occupation status

#### LifeEventGenerator
- Generates 24 types of life events
- Each event has:
  - Impact score (0-100)
  - Emotional impact
  - Relationship impact
  - Memory importance
- Realistic probability distributions

#### ActorFactory
- Creates simulation actors from profiles
- Initializes actor state (mood, energy, relationships, memories)
- Supports actor cloning for parallel simulations

#### SimulationMetricsCalculator
- Computes 12 key metrics:
  - Total conversations
  - Average session length
  - Relationship growth
  - Memory growth
  - Emotional stability
  - Trust evolution
  - Comfort evolution
  - Context accuracy
  - Moment accuracy
  - Notification accuracy
  - Retention rate
  - Engagement score

#### SimulationReporter
- Generates reports in 4 formats:
  - Markdown (human-readable)
  - JSON (machine-readable)
  - CSV (data analysis)
  - HTML (visual presentation)

## User Profiles

### Personality Traits (0-100 scale)

Each profile has the Big Five personality traits:

- **Openness**: Creativity, curiosity, willingness to try new things
- **Conscientiousness**: Organization, discipline, reliability
- **Extraversion**: Sociability, energy, assertiveness
- **Agreeableness**: Compassion, cooperation, empathy
- **Neuroticism**: Emotional reactivity, stress, negativity

### Predefined Profiles

```typescript
// Example: Introvert Developer
{
  openness: 65,
  conscientiousness: 80,
  extraversion: 25,
  agreeableness: 60,
  neuroticism: 55,
  type: PersonalityType.INTROVERT,
  phase: LifePhase.EARLY_CAREER,
}
```

## Life Events

### Event Categories

1. **Career Events**: Promotion, job loss, interview
2. **Life Milestones**: Graduation, wedding, moving, buying house
3. **Health Events**: Illness, burnout, fitness goals
4. **Relationship Events**: Anniversary, breakup, meeting someone
5. **Personal Events**: Birthday, hobby, pet adoption
6. **Mood Events**: Bad day, excellent day, unexpected happiness
7. **Social Events**: Family gathering, festival, vacation
8. **Communication Events**: Missed calls, forgotten messages, silence

### Event Probabilities

- Vacation: 8%
- Bad day: 15%
- Loneliness: 8%
- Random silence: 10%
- Unexpected happiness: 10%
- Missed calls: 5%
- Forgotten messages: 7%
- And many more...

## Simulation Timeframes

### Available Options

- **ONE_DAY**: 1 day
- **SEVEN_DAYS**: 1 week
- **THIRTY_DAYS**: 1 month
- **NINETY_DAYS**: 3 months
- **ONE_HUNDRED_EIGHTY_DAYS**: 6 months
- **THREE_HUNDRED_SIXTY_FIVE_DAYS**: 1 year
- **TWO_YEARS**: 2 years
- **FIVE_YEARS**: 5 years
- **CUSTOM**: Specify custom days

### Speed Multiplier

Control simulation speed:

```typescript
// Run 30 days of simulation in 1 second (30x speed)
const config = configurator.createConfiguration(
  SimulationTimeframe.THIRTY_DAYS,
  30 // speed multiplier
);
```

## Metrics Explained

### Relationship Growth
- Measures increase in affinity, trust, intimacy
- Scale: 0-100
- Influenced by interactions, shared experiences, communication quality

### Memory Growth
- Tracks accumulation of memories over time
- Reflects importance and frequency of interactions
- Impacts conversation context and personalization

### Emotional Stability
- Measures consistency of emotional state
- Lower variance = higher stability
- Influenced by life events and personality traits

### Trust Evolution
- Measures trust development in relationship
- Influenced by reliability and consistency
- Grows with positive interactions, decreases with conflicts

### Engagement Score
- Composite score combining multiple metrics
- 0-100 scale
- Indicates overall simulation quality

### Context Accuracy
- Measures how well companion understands current context
- Influenced by memory retention and world awareness
- 0-100 scale

## Output Formats

### Markdown Report
Human-readable summary with tables and sections:

```markdown
# Simulation Report
**Actor:** alex-dev-123
**Duration:** 45000ms
**Status:** COMPLETED

## Metrics Summary
| Metric | Value |
|--------|-------|
| Relationship Growth | 65.2% |
| Memory Growth | 42.5% |
| Engagement Score | 58.3 |
```

### JSON Report
Complete machine-readable output with all data:

```json
{
  "id": "sim-123",
  "actorId": "actor-456",
  "status": "COMPLETED",
  "metrics": {
    "totalConversations": 45,
    "relationshipGrowth": 65.2,
    ...
  },
  "history": {...}
}
```

### CSV Report
Structured data for analysis:

```csv
Actor ID,Status,Duration (ms),Relationship Growth
actor-456,COMPLETED,45000,65.2
```

### HTML Report
Visual dashboard with charts and metrics:

```html
<div class="metric-card">
  <div class="metric-value">65.2</div>
  <div class="metric-label">Relationship Growth</div>
</div>
```

## Integration Points

### With Other Engines

LSE integrates with:

- **Context Engine**: Provides world state for activities
- **Interaction Engine**: Simulates conversations
- **Memory Engine**: Manages simulated memories
- **Relationship Engine**: Tracks relationship evolution
- **Moments Engine**: Generates special moments
- **Notification Engine**: Simulates notifications

### With Evaluation Platform

```typescript
import { LifeSimulatorEngine } from '@engines/life-simulator';
import { EvaluationPipelineExecutor } from '@evaluation';

// Generate virtual user
const engine = new LifeSimulatorEngine();
const result = await engine.simulate(profile, config);

// Use simulation results for evaluation
const pipeline = new EvaluationPipelineExecutor();
const evalResult = await pipeline.executePipeline(
  pipelineId,
  result.history.events,
  ModelProvider.CLAUDE,
  datasetType,
  promptVersion
);
```

## Use Cases

### 1. Regression Testing
```typescript
// Test against 100 users over 365 days
for (const profile of UserProfiles.getAllProfiles()) {
  const result = await engine.simulate(profile, config365Days);
  assert(result.metrics.relationshipGrowth > 50);
  assert(result.metrics.engagementScore > 40);
}
```

### 2. Model Comparison
```typescript
// Compare Claude vs OpenAI on simulated user journeys
for (const provider of [ModelProvider.CLAUDE, ModelProvider.OPENAI]) {
  const result = await evaluateSimulation(userJourney, provider);
  report.addComparison(provider, result);
}
```

### 3. Personality Validation
```typescript
// Ensure companion adapts to different personality types
const introvert = UserProfiles.INTROVERT_DEVELOPER;
const extrovert = UserProfiles.EXTROVERT_MARKETER;

const introvertResult = await engine.simulate(introvert, config);
const extrovertResult = await engine.simulate(extrovert, config);

assert(introvertResult.metrics.totalConversations < extrovertResult.metrics.totalConversations);
```

### 4. Long-term Relationship Testing
```typescript
// Test relationship quality over 2-5 years
const result = await engine.simulate(profile, SimulationTimeframe.FIVE_YEARS);

assert(result.metrics.trustEvolution > 70);
assert(result.metrics.comfortEvolution > 60);
assert(result.metrics.emotionalStability > 55);
```

## Best Practices

### 1. Seed Random Generation
For reproducible tests:

```typescript
const config = configurator.createConfiguration(
  SimulationTimeframe.THIRTY_DAYS,
  1,
  true,
  true,
  true
);
config.seed = 42; // Ensures same results
```

### 2. Batch Simulations
```typescript
// Run multiple profiles in sequence
const profiles = UserProfiles.getAllProfiles();
const results = [];

for (const profile of profiles) {
  const result = await engine.simulate(profile, config);
  results.push(result);
}

// Analyze aggregate metrics
const avgEngagement = results.reduce((sum, r) => sum + r.metrics.engagementScore, 0) / results.length;
```

### 3. Monitor Simulation Progress
```typescript
// Track progress for long simulations
let lastProgress = 0;
const interval = setInterval(() => {
  const progress = Math.floor(clock.getProgress() * 100);
  if (progress > lastProgress) {
    console.log(`Simulation progress: ${progress}%`);
    lastProgress = progress;
  }
}, 1000);
```

## Performance Characteristics

- **1 day simulation**: ~100-200ms
- **30 days simulation**: ~1-2 seconds
- **365 days simulation**: ~5-10 seconds
- **5 years simulation**: ~15-30 seconds

Performance varies based on:
- Included features (life events, context evolution)
- System resources
- Random variance enabled

## Troubleshooting

### Simulation Too Slow
- Increase speed multiplier
- Disable random variance
- Reduce timeframe for testing

### Unrealistic Behavior
- Adjust personality trait ranges
- Review life event probabilities
- Check actor initial state

### Memory Issues
- Simulate shorter periods
- Use snapshot intervals
- Clear history periodically

## Advanced Configuration

### Custom Personality Profile
```typescript
const customProfile: VirtualUserProfile = {
  id: 'custom-1',
  name: 'Custom User',
  age: 30,
  personality: {
    openness: 75,
    conscientiousness: 80,
    extraversion: 60,
    agreeableness: 70,
    neuroticism: 40,
    type: PersonalityType.AMBIVERT,
    phase: LifePhase.MID_CAREER,
  },
  occupationStatus: 'employed',
  relationshipStatus: 'married',
  interests: ['music', 'travel', 'coding', 'fitness'],
  goals: ['mastery', 'family', 'travel'],
  fears: ['failure', 'isolation'],
  strengths: ['creativity', 'determination'],
  weaknesses: ['perfectionism', 'impatience'],
  timezone: 'UTC',
  averageActivityLevel: 0.7,
};
```

## API Reference

See `/src/engines/life-simulator/types.ts` for complete type definitions.

---

**Last Updated:** 2026-07-09
**Version:** 1.0.0
**Maintainer:** Featherlight Team

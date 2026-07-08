# Relationship Engine

The **Relationship Engine** models the evolving relationship between a user and
a companion across **15 independent dimensions** without a single score.

It is NOT an AI engine. It is NOT a scoring engine. It is a pure state-management
engine that tracks multi-dimensional relationship evolution based on deterministic,
measurable factors: conversation quality, frequency, meaningful events, shared
memories, time, interactions, repairs, and consistency.

---

## Core Principle

> There must never be a single relationship score. Relationships evolve across
> multiple independent dimensions: Trust, Comfort, Playfulness, Emotional Depth,
> Communication Style, Shared Rituals, Shared Memories, Boundaries, Familiarity,
> Reliability, Inside Jokes, Supportiveness, Respect, Openness.

Each dimension:
- Ranges from 0–100 (not a binary score)
- Has its own growth rules and decay rates
- Tracks change history and trend
- Evolves independently based on event impact

---

## Responsibilities

1. **Create relationships** — Initialize new relationship state between user and
   companion with all 15 dimensions at starting values.

2. **Load relationships** — Retrieve existing relationship state with full
   snapshot and timeline.

3. **Evaluate interactions** — Determine interaction quality and calculate impact
   on affected dimensions using growth rules.

4. **Record events** — Apply events (conversations, shared moments, conflicts,
   repairs, etc.) to snapshots and update dimensions.

5. **Apply growth strategies** — Evolve relationships based on current state and
   growth factor scores.

6. **Generate snapshots** — Provide multi-dimensional state view showing all
   dimension values, health, trajectory, strengths, vulnerabilities.

7. **Maintain timeline** — Store and retrieve relationship history (all events).

8. **Apply decay** — Reduce dimension values for periods of inactivity.

---

## Architecture

### Five Core Interfaces

#### IRelationshipEngine
Main entry point. Methods:
- `createRelationship(userId, companionId)` → RelationshipState
- `getRelationship(userId, companionId)` → RelationshipState
- `evaluateInteraction(input)` → InteractionEvaluationResult
- `recordEvent(userId, companionId, event)` → RelationshipSnapshot
- `evolveRelationship(userId, companionId)` → RelationshipState
- `getSnapshot(userId, companionId)` → RelationshipSnapshot
- `getHistory(userId, companionId)` → RelationshipEvent[]

#### IRelationshipContext
Provides calculation context and growth rules:
- `getCalculationContext(userId, companionId, currentDate)` → RelationshipCalculationContext
- `getGrowthRules()` → DimensionGrowthRule[] (all 15)
- `getGrowthRule(dimension)` → DimensionGrowthRule (specific)

#### IRelationshipEvaluator
Deterministically evaluates interactions:
- `evaluateInteraction(input)` → InteractionEvaluationResult
- `scoreGrowthFactors(userId, companionId, context)` → GrowthFactorScore

#### IRelationshipUpdater
Applies events and decay to dimensions:
- `applyEvent(snapshot, event)` → RelationshipSnapshot
- `applyDecay(snapshot, daysSinceLastEvent)` → RelationshipSnapshot

#### IRelationshipEvolutionStrategy
Applies growth strategies:
- `execute(snapshot)` → RelationshipSnapshot
- `recommendStrategy(snapshot)` → EvolutionStrategy

### Dimension Growth Rules

Each dimension has:
- **Base growth rate** (per day)
- **Event impacts** (each event type has specific impact per dimension)
- **Quality multipliers** (SUPERFICIAL/CASUAL/ENGAGED/MEANINGFUL/PROFOUND)
- **Decay rate** (inactive penalty)
- **Bounds** (min/max values 0–100)

---

## Diagram 1 — Relationship Evolution Flow

```mermaid
flowchart TD
    A["Interaction Occurs"]
    B["Evaluate Interaction<br/>(IRelationshipEvaluator)"]
    C["Create RelationshipEvent"]
    D["Record Event<br/>(IRelationshipUpdater)"]
    E["Update Dimensions"]
    F["Apply Decay<br/>(if inactive)"]
    G["Score Growth Factors"]
    H["Recommend Strategy<br/>(IRelationshipEvolutionStrategy)"]
    I["Execute Evolution"]
    J["Generate Snapshot"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> E
    E --> J

    style A fill:#e8f4f8
    style B fill:#d4e9f7
    style D fill:#d4e9f7
    style H fill:#d4e9f7
    style J fill:#e8f4f8
```

---

## Diagram 2 — Dimension Update Pipeline

```mermaid
sequenceDiagram
    participant Engine as IRelationshipEngine
    participant Evaluator as IRelationshipEvaluator
    participant Updater as IRelationshipUpdater
    participant Context as IRelationshipContext

    Engine->>Evaluator: evaluateInteraction(input)
    Evaluator->>Context: getGrowthRule(dimension)
    Context-->>Evaluator: DimensionGrowthRule
    Evaluator-->>Engine: InteractionEvaluationResult

    Engine->>Updater: applyEvent(snapshot, event)
    Updater->>Context: getGrowthRule(dimension)
    Context-->>Updater: DimensionGrowthRule
    Updater->>Updater: Calculate impact & trend
    Updater-->>Engine: Updated snapshot

    Engine->>Updater: applyDecay(snapshot, days)
    Updater->>Context: getGrowthRule(dimension)
    Updater-->>Engine: Decayed snapshot
```

---

## Diagram 3 — Multi-Dimensional State

```
RelationshipSnapshot
├── Dimensions (15 independent)
│   ├── Trust: 75 ↗️ (trend +1)
│   ├── Comfort: 82 ↗️ (trend +2)
│   ├── Playfulness: 60 → (trend 0)
│   ├── Emotional Depth: 70 ↗️ (trend +1)
│   ├── Communication Style: 78 ↗️ (trend +1)
│   ├── Shared Rituals: 55 ↘️ (trend -1)
│   ├── Shared Memories: 85 → (trend 0)
│   ├── Boundaries: 72 → (trend 0)
│   ├── Familiarity: 88 ↗️ (trend +1)
│   ├── Reliability: 80 ↗️ (trend +1)
│   ├── Inside Jokes: 45 ↗️ (trend +1)
│   ├── Supportiveness: 77 ↗️ (trend +1)
│   ├── Respect: 81 → (trend 0)
│   └── Openness: 68 ↗️ (trend +1)
├── overallHealth: 72 (average of all dimensions)
├── trajectory: +1 (improving overall)
├── strengths: [Familiarity, Shared Memories, Comfort]
└── vulnerabilities: [Playfulness, Inside Jokes, Shared Rituals]
```

---

## Folder Structure

```
src/engines/relationship/
├── context/
│   └── relationship.context.ts       # Provides calculation context & growth rules
├── evaluator/
│   └── relationship.evaluator.ts     # Evaluates interaction quality & impact
├── updater/
│   └── relationship.updater.ts       # Applies events and decay to dimensions
├── strategies/
│   └── default-evolution.strategy.ts # Applies growth strategies
├── interfaces/
│   ├── relationship-engine.interface.ts
│   ├── relationship-context.interface.ts
│   ├── relationship-evaluator.interface.ts
│   ├── relationship-updater.interface.ts
│   └── relationship-strategy.interface.ts
├── enums/
│   └── relationship.enums.ts         # 15 dimensions, statuses, event types
├── dtos/
│   └── relationship.dtos.ts          # 13 comprehensive data structures
├── relationship.engine.ts            # Main orchestrator
├── relationship.factory.ts           # DI factory (get / reset)
├── index.ts                          # Barrel exports
└── README.md
```

---

## Key Data Structures

### RelationshipSnapshot
Multi-dimensional view at a point in time:
```typescript
{
  id: string;
  userId: string;
  companionId: string;
  status: RelationshipStatus;
  phase: RelationshipPhase;
  dimensions: Record<RelationshipDimensionType, RelationshipDimension>;
  overallHealth: number;  // 0-100 average
  trajectory: number;     // -2 to +2 overall trend
  strengths: DimensionType[];
  vulnerabilities: DimensionType[];
  nextGrowthOpportunity: GrowthStrategyType;
  createdAt: Date;
  updatedAt: Date;
}
```

### RelationshipDimension
Individual dimension state:
```typescript
{
  type: RelationshipDimensionType;
  value: number;          // 0-100
  lastUpdated: Date;
  changeHistory: Array<{ value: number; timestamp: Date; reason: string }>;
  trend: number;          // -2 to +2
}
```

### RelationshipEvent
Individual event affecting dimensions:
```typescript
{
  id: string;
  type: RelationshipEventType;
  timestamp: Date;
  quality?: InteractionQuality;
  description: string;
  affectedDimensions: RelationshipDimensionType[];
  impact: Record<RelationshipDimensionType, number>; // -10 to +10
  metadata?: Record<string, unknown>;
}
```

---

## Usage

```typescript
import { getRelationshipEngine } from '@engines/relationship';

const engine = getRelationshipEngine();

// Create new relationship
const createResult = await engine.createRelationship('user-1', 'companion-kai');

// Load existing relationship
const getResult = await engine.getRelationship('user-1', 'companion-kai');
if (getResult.isSuccess) {
  const state = getResult.value;
  console.log(state.snapshot.overallHealth); // 72
  console.log(state.snapshot.dimensions.TRUST.value); // 75
}

// Record an event
const eventResult = await engine.recordEvent('user-1', 'companion-kai', {
  id: 'event-1',
  type: 'CONVERSATION',
  timestamp: new Date(),
  quality: 'MEANINGFUL',
  description: 'Deep conversation about life goals',
  affectedDimensions: ['TRUST', 'EMOTIONAL_DEPTH', 'OPENNESS'],
  impact: { TRUST: 2, EMOTIONAL_DEPTH: 3, OPENNESS: 2 },
});

// Evaluate interaction without recording
const evalResult = await engine.evaluateInteraction({
  conversationContext: { /* ... */ },
  quality: 'MEANINGFUL',
  eventType: 'SHARED_MOMENT',
});

// Evolve relationship based on strategy
const evolveResult = await engine.evolveRelationship('user-1', 'companion-kai');

// Get current snapshot
const snapshotResult = await engine.getSnapshot('user-1', 'companion-kai');

// Get relationship history
const historyResult = await engine.getHistory('user-1', 'companion-kai');
if (historyResult.isSuccess) {
  const events = historyResult.value;
  console.log(`${events.length} events recorded`);
}
```

---

## Testing

For tests, provide mock implementations via the factory:

```typescript
import { getRelationshipEngine } from '@engines/relationship';
import { Result } from '@services/types/result.type';

const mockEngine = {
  createRelationship: jest.fn().mockResolvedValue(Result.success(mockState)),
  getRelationship: jest.fn().mockResolvedValue(Result.success(mockState)),
  evaluateInteraction: jest.fn().mockResolvedValue(Result.success(mockResult)),
  recordEvent: jest.fn().mockResolvedValue(Result.success(mockSnapshot)),
  evolveRelationship: jest.fn().mockResolvedValue(Result.success(mockState)),
  getSnapshot: jest.fn().mockResolvedValue(Result.success(mockSnapshot)),
  getHistory: jest.fn().mockResolvedValue(Result.success(mockEvents)),
};

const engine = getRelationshipEngine({ relationshipService: mockService });
```

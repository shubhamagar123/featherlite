# Core Engines

The **Engines** layer is where Featherlight's business logic lives. Engines are
independent, deterministic systems that orchestrate domain concepts without
touching Prisma, HTTP, or external services directly.

Each engine is a composition of services, encapsulated strategies, and domain
rules. Engines speak to each other through well-defined interfaces.

---

## Engine Overview

| Engine                  | Purpose                                          | Responsibility |
|-------------------------|--------------------------------------------------|-----------------|
| **World Engine**        | Generate and manage the user's living world      | Deterministic world state, 70-20-10 rule |
| **Companion Engine**    | Manage companion life-state                      | Life state resolution, transitions, moods |
| **Relationship Engine** | Manage relationship state between user & companion | Relationship snapshots, storage & retrieval |
| **Memory Engine**       | Retrieve critical memories for conversation      | Memory retrieval & ranking (storage only) |
| **Memory Extraction Engine** | Extract & classify memories from events    | Entity extraction, importance, categorization |
| **Context Engine**      | Assemble complete interaction runtime context   | Provider orchestration, degradation policy |
| **Interaction Engine**  | Orchestrate all user-companion interactions     | Text, voice, activities, presence, streaming, etc. |
| **Prompt Engine**       | Build production-ready prompts for any LLM       | Prompt construction, context injection, rules, compression |

---

## Diagram 1 — Core engines architecture

```mermaid
flowchart TD
    IE["Interaction Engine<br/>(Text, Voice, Activities, Presence, etc.)"]

    IE -->|"ONLY dependency"| CTX["Context Engine"]
    IE -->|"build prompts via"| PROMPT["Prompt Orchestrator"]

    CTX --> WE["World Engine"]
    CTX --> CE["Companion Engine"]
    CTX --> RE["Relationship Engine"]
    CTX --> ME["Memory Engine"]
    CTX --> SVC["Services<br/>(User, Moment, etc.)"]

    CE --> WE

    PROMPT -->|"receives"| CTX

    IE -->|"extract via"| MEE["Memory Extraction Engine"]
    MEE -->|"persist via"| ME

    WE --> WS["World Service"]
    CE --> CS["Companion Service"]
    RE --> RS["Relationship Service"]
    ME --> MS["Memory Service"]
    MEE --> MS

    WS --> DB[("PostgreSQL")]
    CS --> DB
    RS --> DB
    MS --> DB

    PROMPT -. "NEVER calls LLM" .-> LLM["LLM Provider<br/>(OpenAI, Claude, etc.)"]

    classDef engine fill:#4a90e2,stroke:#2c5aa0,color:#fff
    classDef forbidden fill:#c0392b,stroke:#8b0000,color:#fff
    class WE,CE,RE,ME,MEE,CTX,PROMPT,IE engine
    class LLM forbidden
```

---

## Diagram 2 — Memory engines flow (Extraction → Storage)

```mermaid
flowchart LR
    IE["Interaction Engine<br/>(Text, Voice, Activities, Presence, etc.)"]
    MEE["Memory Extraction Engine<br/>(Decision)<br/>- Extract entities<br/>- Detect importance<br/>- Detect expiry<br/>- Categorize"]
    ME["Memory Engine<br/>(Storage)<br/>- Retrieve critical<br/>- Rank & serve"]
    MS["Memory Service<br/>(CRUD)"]

    IE -->|"raw input"| MEE
    MEE -->|"MemoryExtractionResultDTO"| ME
    ME -->|"persist"| MS
    ME -->|"retrieve for context"| CTX["Context Engine"]
```

---

## Folder structure

```
src/engines/
├── world/                   # World generation (deterministic, 70-20-10)
│   ├── interfaces/
│   ├── dtos/
│   ├── enums/
│   ├── context/
│   ├── builder/
│   ├── scheduler/
│   ├── strategies/
│   ├── selectors/
│   └── ...
├── companion/               # Companion life-state
│   ├── interfaces/
│   ├── dtos/
│   ├── enums/
│   ├── context/
│   ├── state/
│   ├── scheduler/
│   ├── transitions/
│   ├── managers/
│   ├── registry/
│   ├── rules/
│   └── ...
├── relationship/            # User-companion relationship
│   ├── interfaces/
│   ├── dtos/
│   ├── enums/
│   └── relationship.factory.ts
├── memory/                  # Memory retrieval (storage layer)
│   ├── interfaces/
│   ├── dtos/
│   └── memory.factory.ts
├── memory-extraction/       # Memory decision logic
│   ├── interfaces/
│   ├── dtos/
│   ├── enums/
│   └── memory-extraction.factory.ts
├── context/                 # Context assembly (aggregation boundary)
│   ├── interfaces/
│   ├── dtos/
│   ├── providers/
│   ├── builder/
│   ├── context.factory.ts
│   └── ...
├── interaction/             # User-companion interaction orchestration
│   ├── interfaces/
│   ├── managers/
│   ├── dtos/
│   ├── enums/
│   ├── context/
│   ├── rules/
│   ├── state/
│   ├── interaction-orchestrator.ts
│   ├── interaction-orchestrator.factory.ts
│   └── ...
├── prompt/                  # Prompt orchestration pipeline
│   ├── interfaces/
│   ├── dtos/
│   ├── enums/
│   ├── strategies/
│   ├── prompt-orchestrator.ts
│   ├── prompt-orchestrator.factory.ts
│   └── ...
└── README.md
```

---

## Design Principles

### 1. Single Responsibility
Each engine owns one concern (world, companion, relationship, memory, context).
Engines do not stray into others' domains.

### 2. Deterministic (No Random Choice)
Engines use seeded PRNGs, deterministic rules, and business logic — never
`Math.random()`. All state is reproducible.

### 3. Service Delegation
Engines orchestrate services but **never** touch Prisma directly. Services
handle CRUD; engines handle business logic.

### 4. Boundary Enforcement
- **Interaction Engine** sees **only** Context Engine (for context) and delegates
  to Prompt Orchestrator for prompt building.
- **Context Engine** aggregates from World, Companion, Relationship, Memory,
  and Services.
- Memory flow: Extraction Engine (decides) → Memory Engine (stores) → Service
  (persists).

### 5. Graceful Degradation
Optional providers fail without aborting. Required providers abort the build.
Every provider reports its health via `meta.degraded[]`.

### 6. Provider Pattern
Context Engine uses one provider per source. Each provider:
- Maps upstream DTOs to curated slices.
- Handles absence (empty vs. error).
- Reports availability.

---

## Testing

All engines are independently testable via mocked services and sub-components.

- **Unit tests**: Individual providers, selectors, rules.
- **Integration tests**: Full engine assembly with mocked services.
- **End-to-end tests**: Real providers over mocked upstream sources.

Example:
```typescript
// Test with mocked services
const { engine } = buildEngine({
  serviceOverrides: {
    userService: mockUserService(Result.failure(new Error('db down'))),
  },
});

// Expect graceful degradation
const result = await engine.assembleContext(request);
expect(result.isSuccess).toBe(false); // required provider failed
```

---

## Future Work

1. **Memory Extraction Implementation**: Add entity extraction, importance
   scoring, and expiry rules. (No LLM logic in scaffold.)
2. **Memory Engine Implementation**: Bridge to Memory Service; add ranking,
   recall scoring, decay.
3. **Interaction Engine Enhancement**: Implement full manager capabilities,
   session persistence, and event streaming.
4. **Additional Engines**: Dream Engine, Notification Engine, etc.

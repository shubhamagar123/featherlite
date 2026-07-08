# Featherlight Backend Naming Conventions

**Status**: Governance Document (Permanent)  
**Version**: 1.0  
**Last Updated**: July 8, 2026  
**Scope**: All backend TypeScript code

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Architecture Layers](#architecture-layers)
3. [Core Engines](#core-engines)
4. [Interaction Layer](#interaction-layer)
5. [AI & Prompt Layer](#ai--prompt-layer)
6. [Fundamental Patterns](#fundamental-patterns)
7. [Decision Tree](#decision-tree)
8. [Naming Checklist](#naming-checklist)

---

## Philosophy

### Why Naming Conventions Matter

In a complex system like Featherlight, naming is not cosmetic—it is **structural integrity**.

**Problem**: Without consistent naming, developers must constantly hunt for related code.
- Is it `UserService` or `UserManager`?
- Is it `getUser()` or `fetchUser()` or `loadUser()`?
- Is the DTO called `UserDTO`, `UserPayload`, or `UserResponse`?

**Solution**: A single source of truth prevents ambiguity and enables **mechanical reasoning**.

### Core Principles

1. **Responsibility Over Implementation**
   - Name by *what it does*, not *how it does it*
   - ❌ `fetchUserFromDatabaseSync` → ✅ `UserRepository`
   - ❌ `computeRandomWeatherWithSeed` → ✅ `WorldEngine`

2. **Consistency Enables Patterns**
   - Every Service follows the same structure
   - Every Engine follows the same contract
   - Every DTO follows the same naming pattern
   - Developers can *infer* the API from the name

3. **Clarity Over Cleverness**
   - Prefer explicit to implicit
   - ❌ `buildCtx()` → ✅ `assembleContext()`
   - ❌ `eval()` → ✅ `evaluateInteraction()`

4. **Hierarchy Reflects Architecture**
   - Layer patterns in names
   - Service names are nouns (what they are)
   - Factory names are nouns with context (what they compose)
   - Interface names start with `I` (intent)

---

## Architecture Layers

The Featherlight backend is organized into discrete layers. Each layer has naming rules that reflect its purpose.

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│         (HTTP Controllers, GraphQL Resolvers, etc.)          │
├─────────────────────────────────────────────────────────────┤
│                   Interaction Layer                          │
│  (InteractionEngine, ConversationManager, VoiceManager, etc.)|
├─────────────────────────────────────────────────────────────┤
│                  AI & Prompt Layer                           │
│      (PromptOrchestrator, PromptComposer, LLMGateway)        │
├─────────────────────────────────────────────────────────────┤
│                   Core Engines Layer                         │
│ (WorldEngine, CompanionEngine, RelationshipEngine, etc.)     │
├─────────────────────────────────────────────────────────────┤
│                   Service Layer                              │
│  (UserService, MemoryService, WorldService, etc.)            │
├─────────────────────────────────────────────────────────────┤
│              Infrastructure Layer                            │
│   (Repositories, DTOs, Database, Configuration)              │
└─────────────────────────────────────────────────────────────┘
```

### Layer-Specific Naming

| Layer | Responsibility | Naming Pattern | Example |
|-------|-----------------|----------------|---------|
| **Presentation** | HTTP/GraphQL endpoints | `*Controller`, `*Resolver` | `UserController`, `CompanionResolver` |
| **Interaction** | Runtime interaction orchestration | `*Engine`, `*Manager` | `InteractionEngine`, `ConversationManager` |
| **AI & Prompt** | LLM prompt pipeline | `*Orchestrator`, `*Composer`, `*Service` | `PromptOrchestrator`, `PromptComposer` |
| **Core Engines** | Business logic orchestration | `*Engine` | `WorldEngine`, `CompanionEngine` |
| **Service** | Business operations | `*Service` | `UserService`, `MemoryService` |
| **Infrastructure** | Persistence & data | `*Repository`, `*DTO` | `UserRepository`, `WorldStateDTO` |

---

## Core Engines

The **Engines** are the heart of Featherlight's architecture. Each engine is an independent, deterministic system that orchestrates a single domain concern.

### Naming Rule

All core engines end with **`Engine`**.

```
src/engines/
├── world/
│   └── world.engine.ts
├── companion/
│   └── companion.engine.ts
├── relationship/
│   └── relationship.engine.ts
├── memory/
│   └── memory.engine.ts
├── context/
│   └── context.engine.ts
└── interaction/
    └── interaction-orchestrator.ts
```

### Core Engine Definitions

| Engine | Responsibility | Key Classes | Key Method |
|--------|-----------------|-------------|------------|
| **WorldEngine** | Deterministic world generation & state | `WorldEngine`, `WorldContext`, `WorldBuilder` | `generateWorld()` |
| **CompanionEngine** | Companion life-state (mood, activity, location) | `CompanionEngine`, `CompanionState`, `StateTransition` | `resolveState()` |
| **RelationshipEngine** | Multi-dimensional user-companion relationships | `RelationshipEngine`, `RelationshipSnapshot`, `RelationshipEvaluator` | `evaluateInteraction()` |
| **MemoryEngine** | Memory retrieval & ranking | `MemoryEngine`, `MemoryRanker` | `retrieveCriticalMemories()` |
| **ContextEngine** | Runtime context assembly (aggregation boundary) | `ContextEngine`, `ContextBuilder`, `*ContextProvider` | `assembleContext()` |
| **InteractionEngine** | All user-companion interactions (orchestrator only, see Interaction Layer) | `InteractionOrchestrator`, `*Manager` | `processInteraction()` |

### Engine Interface Pattern

Every engine implements a corresponding interface:

```typescript
// Interface
export interface IWorldEngine {
  generateWorld(request: WorldRequest): Promise<IResult<GeneratedWorldDTO>>;
  getCurrentState(worldId: string): Promise<IResult<WorldStateDTO>>;
}

// Implementation
export class WorldEngine implements IWorldEngine {
  async generateWorld(request: WorldRequest): Promise<IResult<GeneratedWorldDTO>> {
    // ...
  }
  async getCurrentState(worldId: string): Promise<IResult<WorldStateDTO>> {
    // ...
  }
}
```

### Engine Factory Pattern

Every engine has a factory for dependency injection:

```
src/engines/world/world.factory.ts
src/engines/companion/companion.factory.ts
src/engines/relationship/relationship.factory.ts
```

**Factory Functions** (all engines follow this pattern):

```typescript
// Register with dependencies
registerWorldEngine(deps: WorldEngineDeps): void

// Get singleton instance
getWorldEngine(): IWorldEngine

// Reset for testing
resetWorldEngine(): void
```

---

## Interaction Layer

The **Interaction Layer** orchestrates all modes of user-companion interaction: text chat, voice calls, activities, presence, typing, streaming, interruptions, and silence.

### Naming Rules

1. The main orchestrator is `InteractionOrchestrator` (NOT `InteractionEngine`—it uses Engine terminology but is distinct)
2. Each interaction mode has a dedicated `*Manager`
3. All managers implement `I*Manager` interface
4. All interaction types end with `Interaction`

### Interaction Architecture

```
InteractionOrchestrator
├── ConversationManager        (TEXT_CHAT)
├── VoiceManager               (VOICE_CALL)
├── ActivityManager            (ACTIVITY)
├── PresenceManager            (PRESENCE)
├── TypingManager              (TYPING)
├── StreamingManager           (STREAMING)
├── InterruptionManager        (INTERRUPTION)
└── SilenceManager             (SILENCE)
```

### Manager Naming Convention

| Manager | Responsibility | Key Interface | Key Method |
|---------|-----------------|----------------|------------|
| **ConversationManager** | Text message processing | `IConversationManager` | `processMessage()` |
| **VoiceManager** | Voice call lifecycle | `IVoiceManager` | `initiateCall()` |
| **ActivityManager** | Companion activities | `IActivityManager` | `startActivity()` |
| **PresenceManager** | Presence & availability | `IPresenceManager` | `updatePresence()` |
| **TypingManager** | Typing indicators | `ITypingManager` | `reportTyping()` |
| **StreamingManager** | Response streaming | `IStreamingManager` | `startStream()` |
| **InterruptionManager** | Interruption handling | `IInterruptionManager` | `handleInterruption()` |
| **SilenceManager** | Silence detection | `ISilenceManager` | `recordSilence()` |

### Interaction Types (Enums)

```typescript
export enum InteractionType {
  TEXT_CHAT = 'TEXT_CHAT',
  VOICE_CALL = 'VOICE_CALL',
  ACTIVITY = 'ACTIVITY',
  PRESENCE = 'PRESENCE',
  TYPING = 'TYPING',
  STREAMING = 'STREAMING',
  INTERRUPTION = 'INTERRUPTION',
  SILENCE = 'SILENCE',
}
```

### Interaction DTOs

All interaction request/response objects are DTOs:

```typescript
// Base type
export interface InteractionEvent {
  id: string;
  type: InteractionType;
  sessionId: string;
  timestamp: Date;
}

// Specialized types
export interface TextChatInteraction extends InteractionEvent {
  type: InteractionType.TEXT_CHAT;
  message: string;
  direction: ExchangeDirection;
}

export interface VoiceCallInteraction extends InteractionEvent {
  type: InteractionType.VOICE_CALL;
  state: VoiceCallState;
  transcript?: string;
}

// Union type
export type AnyInteraction = 
  | TextChatInteraction
  | VoiceCallInteraction
  | ActivityInteraction
  // ...
```

---

## AI & Prompt Layer

The **AI & Prompt Layer** is responsible for building production-ready prompts for any LLM provider.

### Naming Rules

1. Main orchestrator: `PromptOrchestrator` (NOT `PromptEngine`)
2. Prompt building: `PromptComposer`
3. Assembly strategies: `*AssemblyStrategy`
4. Services: `*ValidationService`, `*CacheService`
5. Payloads: `PromptPayload`
6. Rules: `PromptRules`

### AI Layer Architecture

```
PromptOrchestrator
├── PromptComposer
│   ├── PromptAssemblyStrategy (interface)
│   ├── SegmentStrategy
│   └── CompressionStrategy
├── PromptValidationService
├── PromptCacheService
└── LLMGateway
    ├── LLMAdapter (interface)
    ├── OpenAIAdapter
    ├── ClaudeAdapter
    └── LocalLLMAdapter
```

### Component Definitions

| Component | Responsibility | Pattern | Example |
|-----------|-----------------|---------|---------|
| **PromptOrchestrator** | Orchestrates entire prompt pipeline | Main class | `promptOrchestrator.buildPrompt()` |
| **PromptComposer** | Composes prompt segments | Builder pattern | `composer.compose(context)` |
| **PromptTemplate** | Reusable prompt definition | Data structure | `systemTemplate`, `userTemplate` |
| **PromptRules** | Constraints & rules for prompts | Collection | `PromptRules.SYSTEM_PROMPT_RULES` |
| **PromptPayload** | Compiled, ready-to-use prompt | DTO | `payload.systemPrompt` |
| **PromptAnalytics** | Metrics (tokens, compression, etc.) | Monitoring | `analytics.compressionRatio` |
| **LLMGateway** | Adapter for different LLM providers | Adapter pattern | `gateway.send(payload)` |

### PromptPayload DTO

The final output of the entire prompt pipeline:

```typescript
export interface PromptPayload {
  id: string;
  requestId: string;
  type: PromptType;
  strategy: PromptStrategy;
  status: PromptStatus;
  
  // Segments (one per role)
  systemPrompt: PromptSegment;
  developerPrompt?: PromptSegment;
  userPrompt: PromptSegment;
  
  // Metadata
  totalTokens: number;
  rules: CompiledRule[];
  version: string;
  
  // Quality assurance
  validation: ValidationResult;
  analytics: PromptAnalytics;
  
  // Caching
  cacheKey?: string;
  cached: boolean;
  cachedAt?: Date;
  
  // Timestamps
  builtAt: Date;
  expiresAt?: Date;
}
```

### Key Method Signatures

```typescript
// PromptOrchestrator
buildPrompt(context: PromptBuildContext): Promise<IResult<PromptPayload>>

// PromptComposer
compose(context: PromptBuildContext): Promise<IResult<PromptPayload>>

// LLMGateway
send(payload: PromptPayload): Promise<IResult<LLMResponse>>
```

---

## Fundamental Patterns

### 1. Services

**Rule**: Every service ends with `Service`.

**Responsibility**: Orchestrate business operations, delegate to repositories.

**Pattern**:

```typescript
export interface IUserService {
  getUserById(userId: string): Promise<IResult<UserDTO>>;
  createUser(request: CreateUserRequest): Promise<IResult<UserDTO>>;
  updateUser(userId: string, updates: UpdateUserRequest): Promise<IResult<UserDTO>>;
}

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}
  
  async getUserById(userId: string): Promise<IResult<UserDTO>> {
    // Business logic here, delegate persistence to repository
  }
}
```

**Examples**:
- `UserService`
- `MemoryService`
- `WorldService`
- `CompanionService`
- `RelationshipService`

---

### 2. Repositories

**Rule**: Every repository ends with `Repository`.

**Responsibility**: CRUD operations only. No business logic.

**Pattern**:

```typescript
export interface IUserRepository {
  create(user: UserEntity): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  update(id: string, updates: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}

export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}
  
  async create(user: UserEntity): Promise<UserEntity> {
    return this.prisma.user.create({ data: user });
  }
  // ...
}
```

**Examples**:
- `UserRepository`
- `MemoryRepository`
- `WorldRepository`
- `CompanionRepository`

---

### 3. DTOs (Data Transfer Objects)

**Rule**: Every DTO ends with `DTO`.

**Responsibility**: Structure data for transfer between layers. Immutable contracts.

**Pattern**:

```typescript
// Request DTO (input)
export interface CreateUserRequest {
  email: string;
  displayName: string;
  timezone: string;
}

// Response DTO (output)
export interface UserDTO {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

// Specialized DTO
export interface PromptPayloadDTO {
  id: string;
  systemPrompt: PromptSegment;
  userPrompt: PromptSegment;
  // ...
}
```

**Examples**:
- `UserDTO`
- `WorldStateDTO`
- `PromptPayloadDTO`
- `RelationshipSnapshotDTO`
- `InteractionEventDTO`

**Naming Convention**:
- `*Request` for inputs (e.g., `CreateUserRequest`, `UpdateMemoryRequest`)
- `*Response` for outputs (optional, can just use `*DTO`)
- `*DTO` for public data structures

---

### 4. Interfaces

**Rule**: Every interface begins with `I`.

**Responsibility**: Define contracts between components.

**Pattern**:

```typescript
export interface IUserService {
  getUserById(userId: string): Promise<IResult<UserDTO>>;
  createUser(request: CreateUserRequest): Promise<IResult<UserDTO>>;
}

export interface IUserRepository {
  create(user: UserEntity): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
}

export interface IWorldEngine {
  generateWorld(request: WorldRequest): Promise<IResult<GeneratedWorldDTO>>;
}
```

**Examples**:
- `IUserService`
- `IMemoryRepository`
- `IWorldEngine`
- `IInteractionOrchestrator`
- `IConversationManager`

---

### 5. Managers

**Rule**: Use `Manager` for components that **manage lifecycle or orchestrate a specific concern** within a layer.

**Responsibility**:
- Lifecycle management (start, pause, resume, stop)
- Delegation to specialized workers
- State coordination within a domain

**Pattern**:

```typescript
export interface IConversationManager {
  processMessage(
    interaction: TextChatInteraction,
    context: InteractionContextDTO
  ): Promise<IResult<string>>;
}

export class ConversationManager implements IConversationManager {
  async processMessage(
    interaction: TextChatInteraction,
    context: InteractionContextDTO
  ): Promise<IResult<string>> {
    // Orchestrate message processing
  }
}
```

**Examples**:
- `ConversationManager`
- `VoiceManager`
- `ActivityManager`
- `PresenceManager`
- `StreamingManager`

**When NOT to use Manager**:
- Single-responsibility utilities → Use function name with verb (e.g., `calculateAge()`)
- Data access → Use `Repository`
- Business operations → Use `Service`

---

### 6. Builders

**Rule**: Use `Builder` for components that **construct complex objects step-by-step**.

**Pattern**:

```typescript
export interface IContextBuilder {
  build(request: ContextRequest): Promise<IResult<InteractionContextDTO>>;
}

export class ContextBuilder implements IContextBuilder {
  async build(request: ContextRequest): Promise<IResult<InteractionContextDTO>> {
    // Assemble context from providers
  }
}

export class WorldBuilder {
  private state: Partial<WorldState> = {};
  
  setWeather(weather: Weather): this { /* ... */ return this; }
  setSeason(season: Season): this { /* ... */ return this; }
  build(): WorldState { /* ... */ }
}
```

**Examples**:
- `ContextBuilder`
- `WorldBuilder`
- `PromptComposer` (builder variant)

---

### 7. Factories

**Rule**: Use `Factory` for components that **create and wire dependencies**.

**Responsibility**:
- Dependency injection composition
- Singleton management
- Test doubles and mocks

**Pattern**:

```typescript
export interface WorldEngineDeps {
  worldService?: IWorldService;
  worldContext?: IWorldContext;
}

export function registerWorldEngine(deps: WorldEngineDeps): void {
  const worldService = deps.worldService || new WorldService();
  const worldContext = deps.worldContext || new WorldContext();
  
  instance = new WorldEngine(worldService, worldContext);
}

export function getWorldEngine(): IWorldEngine {
  if (!instance) {
    registerWorldEngine({});
  }
  return instance;
}

export function resetWorldEngine(): void {
  instance = null;
}
```

**File Location**: `src/engines/{name}/{name}.factory.ts`

**Examples**:
- `world.factory.ts`
- `companion.factory.ts`
- `interaction-orchestrator.factory.ts`
- `prompt-orchestrator.factory.ts`

---

### 8. Strategies

**Rule**: Use `Strategy` for components that **encapsulate a specific algorithm or decision logic**.

**Responsibility**:
- Alternative implementations of an algorithm
- Swappable behavior
- Algorithmic isolation

**Pattern**:

```typescript
export interface IPromptAssemblyStrategy {
  execute(
    context: PromptBuildContext,
    segments: PromptSegment[]
  ): Promise<IResult<PromptSegment[]>>;
}

export class BalancedAssemblyStrategy implements IPromptAssemblyStrategy {
  async execute(
    context: PromptBuildContext,
    segments: PromptSegment[]
  ): Promise<IResult<PromptSegment[]>> {
    // Implementation-specific assembly logic
  }
}

export class RelationshipEvolutionStrategy {
  recommendStrategy(snapshot: RelationshipSnapshot): EvolutionStrategy {
    // Decide which evolution strategy to apply
  }
}
```

**Examples**:
- `PromptAssemblyStrategy`
- `RelationshipEvolutionStrategy`
- `StateTransitionStrategy`

---

### 9. Rules

**Rule**: Use `Rules` or `Rule` for components that **encapsulate business constraints and validation**.

**Responsibility**:
- Constraint enforcement
- Rule validation
- Policy implementation

**Pattern**:

```typescript
export interface DimensionGrowthRule {
  dimension: RelationshipDimensionType;
  baseGrowthRate: number;
  eventImpacts: Record<RelationshipEventType, number>;
  qualityMultipliers: Record<InteractionQuality, number>;
  decayRate: number;
  maxValue: number;
  minValue: number;
}

export class PromptRules {
  static readonly SYSTEM_PROMPT_RULES = [
    { severity: 'high', statement: 'Never impersonate the user' },
    { severity: 'high', statement: 'Respect companion personality' },
    // ...
  ];
}

export class ValidationRules {
  static validatePrompt(payload: PromptPayload): ValidationResult {
    // Apply validation rules
  }
}
```

**Examples**:
- `DimensionGrowthRule`
- `PromptRules`
- `ValidationRules`
- `CompanionStateRules`

---

### 10. Context Objects

**Rule**: Use `Context` for objects that **bundle related state and configuration for a specific operation**.

**Responsibility**:
- Aggregate related data
- Avoid parameter explosion
- Enable graceful degradation

**Pattern**:

```typescript
export interface PromptBuildContext {
  conversationContext: InteractionContextDTO;
  promptType: PromptType;
  strategy: PromptStrategy;
  compressionLevel?: CompressionLevel;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}

export interface RelationshipCalculationContext {
  userId: string;
  companionId: string;
  currentDate: Date;
  previousSnapshot?: RelationshipSnapshot;
  recentEvents: RelationshipEvent[];
  timeElapsedDays: number;
}

export interface InteractionContextDTO {
  requestId: string;
  userId: string;
  companionId: string;
  user: UserContextSlice;
  companion: CompanionContextSlice;
  world: WorldContextSlice;
  relationship: RelationshipContextSlice;
  memories: MemoryContextSlice;
  moments: MomentsContextSlice;
  meta: ContextMeta;
}
```

**Examples**:
- `InteractionContextDTO`
- `PromptBuildContext`
- `RelationshipCalculationContext`
- `WorldGenerationContext`

---

### 11. States

**Rule**: Use `State` for objects that **represent the complete state of a system at a point in time**.

**Responsibility**:
- Snapshot all relevant data
- Enable state comparison
- Track state history

**Pattern**:

```typescript
export interface InteractionSessionState {
  id: string;
  state: 'IDLE' | 'INITIATED' | 'ACTIVE' | 'COMPLETED';
  startedAt: Date;
  interactions: AnyInteraction[];
  metadata: Record<string, unknown>;
}

export interface RelationshipSnapshot {
  id: string;
  userId: string;
  companionId: string;
  status: RelationshipStatus;
  dimensions: Record<RelationshipDimensionType, RelationshipDimension>;
  overallHealth: number;
  trajectory: number;
}

export interface WorldState {
  id: string;
  timeOfDay: TimeOfDay;
  season: Season;
  weather: Weather;
  lighting: Lighting;
  ambientSound: AmbientSound;
  activity: string;
  mood: string;
}
```

**Examples**:
- `InteractionSessionState`
- `RelationshipSnapshot`
- `CompanionState`
- `WorldState`

---

### 12. Enums

**Rule**: Use `Type`, `Kind`, or specific noun for enum names.

**Responsibility**:
- Enumerate valid values
- Enable type safety

**Pattern**:

```typescript
export enum InteractionType {
  TEXT_CHAT = 'TEXT_CHAT',
  VOICE_CALL = 'VOICE_CALL',
  ACTIVITY = 'ACTIVITY',
  PRESENCE = 'PRESENCE',
}

export enum RelationshipDimensionType {
  TRUST = 'TRUST',
  AFFECTION = 'AFFECTION',
  COMFORT = 'COMFORT',
  HUMOR = 'HUMOR',
  // ...
}

export enum PromptType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  DEVELOPER = 'DEVELOPER',
}

export enum WeatherType {
  SUNNY = 'SUNNY',
  RAINY = 'RAINY',
  CLOUDY = 'CLOUDY',
  STORMY = 'STORMY',
}
```

**Naming Convention**:
- Prefer specific nouns: `InteractionType`, `WeatherType`, `RelationshipDimensionType`
- All caps for values: `TEXT_CHAT`, `VOICE_CALL`

**Examples**:
- `InteractionType`
- `InteractionSessionState`
- `RelationshipDimensionType`
- `RelationshipStatus`
- `PromptType`
- `WeatherType`

---

### 13. Events

**Rule**: Use `Event` for objects that **represent something that happened in the system**.

**Responsibility**:
- Immutable record of an occurrence
- Contain all relevant context
- Enable event-driven architecture

**Pattern**:

```typescript
export interface InteractionEvent {
  id: string;
  type: InteractionType;
  sessionId: string;
  userId: string;
  companionId: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface RelationshipEvent {
  id: string;
  type: RelationshipEventType;
  timestamp: Date;
  quality?: InteractionQuality;
  description: string;
  affectedDimensions: RelationshipDimensionType[];
  impact: Record<RelationshipDimensionType, number>;
  metadata?: Record<string, unknown>;
}

export interface MemoryEvent {
  id: string;
  type: 'MEMORY_CREATED' | 'MEMORY_UPDATED' | 'MEMORY_DELETED';
  memoryId: string;
  timestamp: Date;
  userId: string;
  companionId: string;
}
```

**Examples**:
- `InteractionEvent`
- `RelationshipEvent`
- `MemoryEvent`
- `CompanionStateChangeEvent`

---

## Decision Tree

Use this flowchart to determine the correct name/pattern for a new component:

```
START: "What am I creating?"
│
├─ "I'm defining a contract"
│  └─> Use Interface with I prefix
│      Example: IUserService, IWorldEngine
│
├─ "I'm orchestrating a domain (world, companion, relationships)"
│  └─> Use *Engine
│      Example: WorldEngine, CompanionEngine
│      File: src/engines/{name}/{name}.engine.ts
│
├─ "I'm orchestrating interactions (text, voice, activities)"
│  └─> Use *Manager inside InteractionOrchestrator
│      Example: ConversationManager, VoiceManager
│      File: src/engines/interaction/managers/{name}.manager.ts
│
├─ "I'm handling business operations"
│  └─> Use *Service
│      Example: UserService, MemoryService
│      File: src/services/{name}.service.ts
│
├─ "I'm handling persistence (CRUD)"
│  └─> Use *Repository
│      Example: UserRepository, MemoryRepository
│      File: src/repositories/{name}.repository.ts
│
├─ "I'm transferring data between layers"
│  └─> Use *DTO or *Request/*Response
│      Example: UserDTO, CreateUserRequest, UserResponse
│      File: src/{layer}/dtos/{name}.dto.ts
│
├─ "I'm constructing complex objects"
│  └─> Use *Builder or *Composer
│      Example: ContextBuilder, PromptComposer
│      File: src/{layer}/builder/{name}.builder.ts
│
├─ "I'm managing dependencies"
│  └─> Use *Factory
│      Example: world.factory.ts, prompt-orchestrator.factory.ts
│      File: src/{layer}/{name}.factory.ts
│
├─ "I'm encapsulating an algorithm"
│  └─> Use *Strategy
│      Example: PromptAssemblyStrategy, RelationshipEvolutionStrategy
│      File: src/{layer}/strategies/{name}.strategy.ts
│
├─ "I'm enforcing business rules"
│  └─> Use Rules or *Rule
│      Example: PromptRules, ValidationRules
│      File: src/{layer}/rules/{name}.rules.ts
│
├─ "I'm bundling context for an operation"
│  └─> Use *Context
│      Example: PromptBuildContext, WorldGenerationContext
│      File: src/{layer}/dtos/{name}.context.ts
│
├─ "I'm representing a snapshot in time"
│  └─> Use *Snapshot or *State
│      Example: RelationshipSnapshot, InteractionSessionState
│      File: src/{layer}/dtos/{name}.dto.ts
│
├─ "I'm enumerating valid values"
│  └─> Use *Type or *Kind
│      Example: InteractionType, WeatherType
│      File: src/{layer}/enums/{name}.enums.ts
│
└─ "I'm recording something that happened"
   └─> Use *Event
       Example: InteractionEvent, RelationshipEvent
       File: src/{layer}/dtos/{name}.dto.ts
```

---

## Naming Checklist

Before creating a new class, function, or module, verify:

### Class/Interface Naming

- [ ] Does the name clearly express responsibility?
- [ ] Is it consistent with other components in its layer?
- [ ] Does it follow the appropriate suffix pattern (Engine, Service, Repository, Manager, etc.)?
- [ ] Is it specific enough that developers can find it mechanically?
- [ ] Have I checked existing names in the codebase to avoid collisions?

### Examples of Bad → Good Renames

| ❌ Bad | ✅ Good | Reason |
|--------|---------|--------|
| `UserMgr` | `UserService` | Abbreviations reduce clarity |
| `FetchUserFromDB` | `UserRepository` | Prefix with responsibility, not implementation |
| `computeWeather()` | `WorldEngine` | Names should express what, not how |
| `eval()` | `evaluateInteraction()` | Explicit verb, no ambiguity |
| `UserData` | `UserDTO` | Clarifies layer and purpose |
| `Helper` | `PromptComposer` | Specific, not generic |
| `Manager` | `ConversationManager` | Specify what is managed |
| `build()` | `assembleContext()` | Specific verb explains operation |
| `ctx` | `interactionContext` | Full names in code, not comments |
| `IService` | `IUserService` | Specify what service |

### File Naming

- [ ] File name matches class name (lowercase with hyphens): `user.service.ts`, `world.engine.ts`
- [ ] File is in the correct directory structure
- [ ] Pattern files follow layer conventions

### Function Naming

- [ ] Verbs are specific: `get`, `create`, `update`, `delete`, `process`, `evaluate`, not generic `do`, `exec`, `run`
- [ ] Parameters are specific types, not `data` or `obj`
- [ ] Return types use `IResult<T>` for error handling (no exceptions on normal paths)

### Example Function Signatures

```typescript
// ❌ Bad
async process(data: any): Promise<any>

// ✅ Good
async processMessage(
  interaction: TextChatInteraction,
  context: InteractionContextDTO
): Promise<IResult<string>>

// ❌ Bad
function build(obj: unknown): unknown

// ✅ Good
async assembleContext(request: ContextRequest): Promise<IResult<InteractionContextDTO>>

// ❌ Bad
getUserData()

// ✅ Good
getUserById(userId: string): Promise<IResult<UserDTO>>
```

---

## Enforcement

### For Code Review

1. Check all new classes against this document
2. Flag names that deviate from patterns
3. Request renames if names are ambiguous

### For Onboarding

1. Direct new engineers to this document
2. Reference it in code review comments
3. Use it to verify PRs

### For Refactoring

When refactoring legacy code:
1. Apply naming conventions progressively
2. Update exports and imports
3. Document breaking changes if any

---

## Appendix: Quick Reference

### One-Line Rules

| Component | Pattern | Example |
|-----------|---------|---------|
| Interface | I{Name} | IUserService |
| Engine | {Name}Engine | WorldEngine |
| Manager | {Name}Manager | ConversationManager |
| Service | {Name}Service | UserService |
| Repository | {Name}Repository | UserRepository |
| Factory | {name}.factory.ts | world.factory.ts |
| Builder | {Name}Builder | ContextBuilder |
| Strategy | {Name}Strategy | PromptAssemblyStrategy |
| DTO | {Name}DTO | UserDTO |
| Request | {Action}{Name}Request | CreateUserRequest |
| Response | {Name}Response | UserResponse |
| Enum | {Name}Type or {Name}Kind | InteractionType |
| Event | {Name}Event | InteractionEvent |
| Rules | {Name}Rules | PromptRules |
| Context | {Name}Context | PromptBuildContext |
| State | {Name}State or {Name}Snapshot | RelationshipSnapshot |

---

**Last Updated**: July 8, 2026  
**Version**: 1.0  
**Status**: GOVERNANCE DOCUMENT (Permanent - All Future Code Must Comply)

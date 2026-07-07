# Context Engine

The **Context Engine** assembles the complete runtime context required by the
(future) **Conversation Engine** and hands it back as a single
`ConversationContextDTO`.

Its reason for existing is an architectural boundary:

> The Conversation Engine must **never** communicate directly with the World
> Engine, Companion Engine, Relationship Engine, Memory/Moment sources, or any
> service. It receives **only** a `ConversationContext` object.

The Context Engine is the one place that fans out to every source, so the
conversation tier depends on exactly one collaborator.

---

## Responsibilities

- Own the `ConversationContextDTO` contract (the single object handed downstream).
- Run one **provider per source**, each mapping its source into a curated slice.
- Orchestrate providers concurrently, time them, and degrade gracefully.
- Never contain business logic — it aggregates, it does not decide.

Providers depend on engine interfaces (`IWorldEngine`, `ICompanionEngine`,
`IRelationshipEngine`) and service interfaces (`IUserService`, `IMemoryService`,
`IMomentService`) via constructor injection.

---

## Providers — one source each

| Provider                        | Source                       | Required | Absence handling |
| ------------------------------- | ---------------------------- | :------: | ---------------- |
| `UserContextProvider`           | `IUserService`               |    ✔     | missing user → build aborts |
| `CompanionContextProvider`      | `ICompanionEngine`           |    ✔     | failure → build aborts |
| `WorldContextProvider`          | `IWorldEngine`               |    ✔     | failure → build aborts |
| `RelationshipContextProvider`   | `IRelationshipEngine`        |          | not-found → empty slice |
| `MemoryContextProvider`         | `IMemoryService`             |          | error → degrade |
| `MomentsContextProvider`        | `IMomentService`             |          | error → degrade |

**Degradation policy:** a *required* provider failing aborts the whole build; an
*optional* provider failing falls back to its `emptySlice()` and is recorded in
`meta.degraded`. A slice's `available` flag distinguishes *known-empty*
(`available: true, count: 0`) from *degraded/unknown* (`available: false`).

**Consistency:** because world generation is deterministic, the world and
companion providers resolve the same world independently. A caller may also pin
a specific world via `ContextRequest.world`, which both providers then use.

---

## Diagram 1 — Context assembly pipeline

```mermaid
flowchart TD
    REQ["ContextRequest<br/>(userId, companionId, tz)"] --> ENG["ContextEngine.assembleContext()"]
    ENG --> BLD["ContextBuilder.build()"]
    BLD --> P{Run all providers in parallel}

    P --> UP["UserContextProvider"]
    P --> CP["CompanionContextProvider"]
    P --> WP["WorldContextProvider"]
    P --> RP["RelationshipContextProvider"]
    P --> MP["MemoryContextProvider"]
    P --> OP["MomentsContextProvider"]

    UP --> US["IUserService"]
    CP --> CS["ICompanionEngine"]
    WP --> WS["IWorldEngine"]
    RP --> RS["IRelationshipEngine"]
    MP --> MS["IMemoryService"]
    OP --> OS["IMomentService"]

    UP --> ASM["Assemble slices + apply<br/>required/optional policy"]
    CP --> ASM
    WP --> ASM
    RP --> ASM
    MP --> ASM
    OP --> ASM

    ASM --> OUT["ConversationContextDTO"]
```

---

## Diagram 2 — Refactored dependency graph

The Conversation Engine is **decoupled** from every source. Its only dependency
is the Context Engine; the forbidden direct edges are removed.

```mermaid
flowchart TD
    CVE["Conversation Engine<br/>(future)"]

    CVE -->|"ONLY dependency"| CTX["Context Engine"]

    CVE -. FORBIDDEN .-> WE["World Engine"]
    CVE -. FORBIDDEN .-> CE["Companion Engine"]
    CVE -. FORBIDDEN .-> RE["Relationship Engine"]
    CVE -. FORBIDDEN .-> SVC["Services"]

    CTX --> UP["User Provider"]
    CTX --> CP["Companion Provider"]
    CTX --> WP["World Provider"]
    CTX --> RP["Relationship Provider"]
    CTX --> MP["Memory Provider"]
    CTX --> OP["Moments Provider"]

    WP --> WE
    CP --> CE
    RP --> RE
    UP --> SVC
    MP --> SVC
    OP --> SVC
    CE --> WE
    RE --> SVC

    linkStyle 1 stroke:#c0392b,stroke-width:2px
    linkStyle 2 stroke:#c0392b,stroke-width:2px
    linkStyle 3 stroke:#c0392b,stroke-width:2px
    linkStyle 4 stroke:#c0392b,stroke-width:2px
```

The red, crossed edges (`Conversation Engine -> World/Companion/Relationship/Services`)
are what this refactor **eliminates**. Everything now flows through the Context
Engine.

---

## Diagram 3 — Assembly sequence

```mermaid
sequenceDiagram
    participant Caller
    participant Engine as ContextEngine
    participant Builder as ContextBuilder
    participant Providers as 6 Providers
    participant Sources as Engines / Services

    Caller->>Engine: assembleContext(request)
    Engine->>Builder: build(request)
    par Concurrent (all providers)
        Builder->>Providers: provide(request)
        Providers->>Sources: fetch one source each
        Sources-->>Providers: DTO / result
        Providers-->>Builder: mapped slice
    end
    Builder->>Builder: required failure aborts, optional failure degrades to empty slice
    Builder-->>Engine: ConversationContext result
    Engine-->>Caller: ConversationContext result
```

---

## The context object

```
ConversationContextDTO
├── requestId, userId, companionId, generatedAt
├── user          UserContextSlice          (id, username, displayName, role, tz, lang)
├── companion     CompanionContextSlice     (state, mood, expression, gesture, location, outfit, availability)
├── world         WorldContextSlice         (scene, timeOfDay, season, weather, activity, lighting, ambient, mood)
├── relationship  RelationshipContextSlice  (status, level, affection, trust, familiarity, interactions)
├── memories      MemoryContextSlice        (count, items[{ id, type, importance, content }])
├── moments       MomentsContextSlice       (count, items[{ id, title, description, significance, occurredAt }])
└── meta          ContextMeta               (timezone, referenceDate, degraded[], providers[], buildDurationMs)
```

---

## Usage

```typescript
import { getContextEngine } from '@engines/context';

const contextEngine = getContextEngine();

const result = await contextEngine.assembleContext({
  userId,
  companionId,
  timezone: 'Asia/Kolkata',
});

if (result.isSuccess) {
  const context = result.value; // ConversationContextDTO
  // → hand ONLY this to the Conversation Engine.
}
```

For tests, inject mocked sources / a `FixedClock` via
`getContextEngine({ services, worldEngine, companionEngine, relationshipEngine, clock })`,
or build a provider set directly with
`buildProviderSet(services, worldEngine, companionEngine, relationshipEngine)`.

---

## Testing

Three suites, 22 tests:

- `providers.test.ts` — each provider's mapping + absence/error semantics.
- `context.builder.test.ts` — orchestration policy: full assembly, required-abort,
  optional-degrade, thrown-provider capture, and meta/reporting.
- `context.engine.test.ts` — end-to-end assembly with real providers over mocked
  sources, provider keys, world threading, and degradation.

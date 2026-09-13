# Memory Extraction Engine

The **Memory Extraction Engine** looks at a piece of conversation text and
decides whether it's worth remembering — extracting entities, classifying the
memory type, and scoring importance.

## The one rule that matters

> **Output of this engine is always a proposal. Persistence requires an
> explicit user consent event — this engine must never persist directly.**

Concretely:

- `extract()` returns a `MemoryExtractionResultDTO` (or `null`) — a plain
  value object. It is never written anywhere by this engine.
- `MemoryExtractionEngine` has **no constructor dependency on a repository,
  a service, or Prisma** — not `IMemoryRepository`, not `IMemoryService`, not
  `PrismaClient`. It cannot call a persistence method because it is never
  given one to call. This is enforced by construction, not by convention.
- Turning a proposal into a stored `Memory` row is entirely the caller's
  responsibility, and that caller must gate the write behind an explicit
  `ConsentEvent { granted: boolean; sourceMessageId: string }` — see
  `MemoryService.persistMemoryCandidate` in
  `src/services/memory/memory.service.ts`.
- If `granted` is `false`, the candidate is discarded. It is not written to
  any table — there is no "pending" or "rejected" memory store. The proposal
  simply ceases to exist once the caller drops it.

## Why

Memories are personal, durable, and shape how the companion talks about the
user later. Nothing should land in storage on the strength of a regex match
and a heuristic importance score alone — a person has to agree to it first.
Keeping extraction and persistence in two different classes, with the
consent check owned entirely by the persistence side, makes the "did the
user actually agree to this?" question answerable by reading one method
(`MemoryService.persistMemoryCandidate`) instead of auditing every call site
that might produce a candidate.

## Usage

```typescript
import { getMemoryExtractionEngine } from '@engines/memory-extraction';
import { getMemoryService } from '@services/factory'; // illustrative

const extractionEngine = getMemoryExtractionEngine();

// 1. Extract — pure decision, no side effects.
const result = extractionEngine.extract({
  userId: 'user-1',
  companionId: 'companion-1',
  sourceMessageId: 'msg-42',
  text: 'My name is Alex and I love hiking every weekend.',
});

if (!result.isSuccess || !result.value) {
  return; // nothing worth proposing
}

const candidate = result.value; // MemoryExtractionResultDTO — not yet stored

// 2. Persist — ONLY with an explicit consent event tied to the same message.
// (In the current codebase this consent event comes from the user
// confirming a prompt; the future Conversation Engine is the intended
// orchestration point for step 1 -> step 2.)
await memoryService.persistMemoryCandidate(candidate, {
  granted: true,
  sourceMessageId: 'msg-42',
});
```

If `granted` is `false` (or the `sourceMessageId` doesn't match the
candidate's), `persistMemoryCandidate` discards the candidate and returns
`Result.success(null)` — no row is written, no error is raised.

## What this engine does NOT do

- It does not call `MemoryService.createMemory` or
  `MemoryService.persistMemoryCandidate`.
- It does not hold a reference to any repository.
- It does not know what a `ConsentEvent` is — consent is a persistence-layer
  concept, and this engine has no persistence layer.
- It does not queue, buffer, or cache candidates for later automatic
  persistence. Every candidate is transient: it lives only in the caller's
  hands until the caller either persists it (with consent) or drops it.

## Architecture

```
IMemoryExtractionEngine
  extract(input: MemoryExtractionInput): Result<MemoryExtractionResultDTO | null>
```

Internally, `MemoryExtractionEngine` composes three pure, already-existing
decision components from the Memory Engine (`@engines/memory`) — none of
which touch storage either:

- `IEntityExtractor` — pulls people/places/dates/numbers/orgs out of text
- `IMemoryClassifier` — assigns a `MemoryType` and confidence
- `IImportanceEvaluator` — scores 0..1 importance

```
text -> IEntityExtractor -> entities
entities + text -> IMemoryClassifier -> memoryType, confidence
memoryType + text + entities -> IImportanceEvaluator -> importance
                                        |
                                        v
                          MemoryExtractionResultDTO (returned, not stored)
```

## Testing

`__tests__/memory-extraction.engine.test.ts` asserts the persistence boundary
directly: calling `extract()` alone, with no consent event anywhere in the
picture, results in **zero calls** to the memory repository's `create`
method — proving the engine has no path to a database write.

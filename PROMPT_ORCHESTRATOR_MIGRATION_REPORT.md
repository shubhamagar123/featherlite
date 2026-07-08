# Prompt Engine → Prompt Orchestrator Refactoring Report

## Overview

Complete architectural refactoring of the Prompt Engine module to Prompt Orchestrator, reflecting its true responsibility: orchestrating the complete prompt construction pipeline rather than acting as an engine.

**Date:** 2026-07-08
**Branch:** claude/festive-galileo-yxnirr
**Status:** ✓ Complete

---

## Summary of Changes

### Rationale

The "Prompt Engine" was originally named as an engine to fit within the Engines layer architecture. However, its actual responsibility is orchestrating the complete prompt construction pipeline, not managing state or scheduling. This refactoring aligns nomenclature with responsibility.

**Key Principle:** The Prompt Orchestrator NEVER calls an LLM. It only orchestrates prompt construction.

---

## File Renames

### Interface Files

| Old Name | New Name | Interface Name |
|----------|----------|----------------|
| `interfaces/prompt-engine.interface.ts` | `interfaces/prompt-orchestrator.interface.ts` | `IPromptEngine` → `IPromptOrchestrator` |
| `interfaces/prompt-builder.interface.ts` | `interfaces/prompt-composer.interface.ts` | `IPromptBuilder` → `IPromptComposer` |
| `interfaces/prompt-strategy.interface.ts` | `interfaces/prompt-assembly-strategy.interface.ts` | `IPromptStrategy` → `IPromptAssemblyStrategy` |
| `interfaces/prompt-validator.interface.ts` | `interfaces/prompt-validation-service.interface.ts` | `IPromptValidator` → `IPromptValidationService` |
| `interfaces/prompt-cache.interface.ts` | `interfaces/prompt-cache-service.interface.ts` | `IPromptCache` → `IPromptCacheService` |
| (unchanged) | (unchanged) | `IPromptCompressor` (unchanged) |

### Factory Files

| Old Name | New Name | Functions |
|----------|----------|-----------|
| `prompt.factory.ts` | `prompt-orchestrator.factory.ts` | `getPromptEngine()` → `getPromptOrchestrator()` |
| | | `registerPromptEngine()` → `registerPromptOrchestrator()` |
| | | `resetPromptEngine()` → `resetPromptOrchestrator()` |
| | | `PromptEngineDeps` → `PromptOrchestratorDeps` |

### Documentation

| Old Name | New Name |
|----------|----------|
| `README.md` | `README.md` (updated content) |

---

## Class & Interface Renames

### Orchestrator Layer

| Old Name | New Name | Type | Location |
|----------|----------|------|----------|
| `IPromptEngine` | `IPromptOrchestrator` | Interface | `prompt-orchestrator.interface.ts` |
| `PromptEngine` | `PromptOrchestrator` | Class | (future implementation) |

### Composition Layer

| Old Name | New Name | Type | Location |
|----------|----------|------|----------|
| `IPromptBuilder` | `IPromptComposer` | Interface | `prompt-composer.interface.ts` |
| Method: `build()` | Method: `compose()` | - | - |

### Strategy Layer

| Old Name | New Name | Type | Location |
|----------|----------|------|----------|
| `IPromptStrategy` | `IPromptAssemblyStrategy` | Interface | `prompt-assembly-strategy.interface.ts` |
| Description: "prompt building strategy" | Description: "prompt assembly strategy" | - | - |

### Validation Layer

| Old Name | New Name | Type | Location |
|----------|----------|------|----------|
| `IPromptValidator` | `IPromptValidationService` | Interface | `prompt-validation-service.interface.ts` |
| Purpose: Prompt validation | Purpose: Validation service | - | - |

### Caching Layer

| Old Name | New Name | Type | Location |
|----------|----------|------|----------|
| `IPromptCache` | `IPromptCacheService` | Interface | `prompt-cache-service.interface.ts` |

---

## Data Structure Renames

### DTO Renames (in `dtos/prompt.dtos.ts`)

| Old Name | New Name | Description |
|----------|----------|-------------|
| `PromptPackage` | `PromptPayload` | Final orchestrator output |
| `PromptMetrics` | `PromptAnalytics` | Metrics/analytics about prompt construction |
| `PromptVersion` | `PromptTemplateVersion` | Template version tracking |
| `CacheEntry` | (removed) | No longer exported; internal use only |

### DTO Impacts

- All method signatures updated to use `PromptPayload` instead of `PromptPackage`
- Metrics property renamed: `metrics` → `analytics` in payload
- Type safety maintained throughout

---

## Export Updates (index.ts)

### Factory Functions

```typescript
// OLD
export { getPromptEngine, registerPromptEngine, resetPromptEngine }
export type { PromptEngineDeps }

// NEW
export { getPromptOrchestrator, registerPromptOrchestrator, resetPromptOrchestrator }
export type { PromptOrchestratorDeps }
```

### Interfaces

```typescript
// OLD
export type { IPromptEngine, IPromptBuilder, IPromptStrategy, IPromptValidator, IPromptCache }

// NEW
export type {
  IPromptOrchestrator,
  IPromptComposer,
  IPromptAssemblyStrategy,
  IPromptValidationService,
  IPromptCacheService,
}
```

### Types

```typescript
// OLD
export type { PromptPackage, PromptMetrics, PromptVersion, CacheEntry, ... }

// NEW
export type { PromptPayload, PromptAnalytics, PromptTemplateVersion, ... }
```

---

## Method Signature Changes

### IPromptOrchestrator (was IPromptEngine)

```typescript
// OLD
interface IPromptEngine {
  buildPrompt(context: PromptBuildContext): Promise<IResult<PromptPackage>>;
  getCachedPrompt(cacheKey: string): Promise<IResult<PromptPackage | null>>;
  getMetrics(templateId: string): Promise<IResult<PromptMetrics[]>>;
}

// NEW
interface IPromptOrchestrator {
  buildPrompt(context: PromptBuildContext): Promise<IResult<PromptPayload>>;
  getCachedPrompt(cacheKey: string): Promise<IResult<PromptPayload | null>>;
  getAnalytics(templateId: string): Promise<IResult<PromptAnalytics[]>>;
}
```

### IPromptComposer (was IPromptBuilder)

```typescript
// OLD
interface IPromptBuilder {
  build(context: PromptBuildContext): Promise<IResult<PromptPackage>>;
}

// NEW
interface IPromptComposer {
  compose(context: PromptBuildContext): Promise<IResult<PromptPayload>>;
}
```

### IPromptValidationService (was IPromptValidator)

```typescript
// OLD
interface IPromptValidator {
  validate(prompt: PromptPackage): IResult<ValidationResult>;
}

// NEW
interface IPromptValidationService {
  validate(prompt: PromptPayload): IResult<ValidationResult>;
}
```

### IPromptCompressor (unchanged interface, updated usage)

```typescript
// Updated parameter types only
compress(
  prompt: PromptPayload,  // was PromptPackage
  maxTokens: number,
  level: CompressionLevel
): Promise<IResult<{ prompt: PromptPayload; stats: CompressionStatistics }>>;
```

### IPromptCacheService (was IPromptCache)

```typescript
// Updated method parameter types
get(key: string): Promise<IResult<PromptPayload | null>>;
set(key: string, prompt: PromptPayload, ttlSeconds: number): Promise<IResult<void>>;
```

---

## Documentation Updates

### README.md Changes

#### Title & Introduction
- "Prompt Engine" → "Prompt Orchestrator"
- "building prompts" → "orchestrating prompt construction"

#### Diagrams Updated

**Diagram 1 - System Architecture:**
- Component label: "🔤 Prompt Engine" → "🔤 Prompt Orchestrator"
- Output type: "PromptPackage" → "PromptPayload"
- LLM layer: "LLM Provider" → "LLM Gateway"
- Flow labels: "build prompt via" → "orchestrate prompt via"

**Diagram 2 - Pipeline (Sequence):**
- Main participants renamed:
  - `PromptEngine` → `PromptOrchestrator`
  - `PromptBuilder` → `PromptComposer`
  - `Validator` → `ValidationService`
  - `Cache` → `CacheService`
- Data type: `PromptPackage` → `PromptPayload` (throughout)
- Method call: `Builder: build(context)` → `Composer: compose(context)`

**Diagram 3 - Architecture Detail:**
- Main component: `PromptBuilder` → `PromptComposer`
- Sub-components: `Validator` → `ValidationService`, `Cache` → `CacheService`

#### Interfaces Section
- `IPromptEngine` → `IPromptOrchestrator`
- Method name documentation: `build()` → `compose()`
- `getMetrics()` → `getAnalytics()`
- Return type: `PromptPackage` → `PromptPayload`
- Property: `metrics` → `analytics`

#### Folder Structure
- Directory: `builders/` → `composers/`
- File: `prompt.builder.ts` → `prompt-composer.ts`
- File: `prompt-validator.ts` → `prompt-validation-service.ts`
- File: `prompt-cache.ts` → `prompt-cache-service.ts`
- File: `prompt.engine.ts` → `prompt-orchestrator.ts`
- File: `prompt.factory.ts` → `prompt-orchestrator.factory.ts`

#### Usage Example
- Function: `getPromptEngine()` → `getPromptOrchestrator()`
- Variable: `promptEngine` → `promptOrchestrator`
- Data: `promptPackage` → `promptPayload`
- Properties: `metrics` → `analytics`
- Comment: "Ready to send to LLM" → "Ready to send to LLM Gateway"

#### Design Principles
- "The Prompt Engine produces..." → "The Prompt Orchestrator orchestrates..."
- "never calls OpenAI, Claude, Gemini" → "never calls OpenAI, Claude, Gemini or any other LLM"

#### Future Work
- "Implement validator" → "Implement validation service"
- "send PromptPackage" → "send PromptPayload"
- "Track metrics" → "Track analytics"

---

## Backward Compatibility

### Breaking Changes

All external imports from `@engines/prompt` will break. Consumers must update:

```typescript
// OLD
import { getPromptEngine, IPromptEngine } from '@engines/prompt';
const engine = getPromptEngine();
const result = await engine.buildPrompt(context);
const pkg: PromptPackage = result.value;

// NEW
import { getPromptOrchestrator, IPromptOrchestrator } from '@engines/prompt';
const orchestrator = getPromptOrchestrator();
const result = await orchestrator.buildPrompt(context);
const payload: PromptPayload = result.value;
```

### No Runtime Changes

- All business logic remains identical
- Same input/output behavior
- Same error handling
- Same caching mechanism

---

## Files Modified/Renamed

### Renamed (9 files)
1. ✓ `interfaces/prompt-engine.interface.ts` → `interfaces/prompt-orchestrator.interface.ts`
2. ✓ `interfaces/prompt-builder.interface.ts` → `interfaces/prompt-composer.interface.ts`
3. ✓ `interfaces/prompt-strategy.interface.ts` → `interfaces/prompt-assembly-strategy.interface.ts`
4. ✓ `interfaces/prompt-validator.interface.ts` → `interfaces/prompt-validation-service.interface.ts`
5. ✓ `interfaces/prompt-cache.interface.ts` → `interfaces/prompt-cache-service.interface.ts`
6. ✓ `prompt.factory.ts` → `prompt-orchestrator.factory.ts`

### Modified (3 files)
1. ✓ `dtos/prompt.dtos.ts` — Updated class names
2. ✓ `index.ts` — Updated exports
3. ✓ `README.md` — Updated all documentation

### Total: 12 files

---

## Refactoring Checklist

- [x] Rename interface files
- [x] Update interface class names
- [x] Update method signatures
- [x] Rename factory file
- [x] Update factory function names and error messages
- [x] Update factory interface (PromptEngineDeps → PromptOrchestratorDeps)
- [x] Update DTOs (PromptPackage → PromptPayload, PromptMetrics → PromptAnalytics, etc.)
- [x] Update index.ts exports
- [x] Update README.md with new nomenclature
- [x] Update all Mermaid diagrams
- [x] Update usage examples
- [x] Update design principles documentation
- [x] Update folder structure documentation
- [x] No runtime behavior changes
- [x] Generate this migration report

---

## Architecture Validation

### Dependencies (Unchanged)

The Prompt Orchestrator may depend only on:
- ✓ Context DTOs (`ConversationContextDTO`)
- ✓ Prompt Templates (in-memory)
- ✓ Prompt Rules (definitions)
- ✓ Configuration (enums, constants)
- ✓ Cache (in-memory only)

The Prompt Orchestrator must NEVER access:
- ✓ Repositories (not used)
- ✓ Services (not used)
- ✓ Database (not used)
- ✓ Express/HTTP (not used)
- ✓ Controllers/Routes (not used)
- ✓ LLM APIs (by design)

### No External Imports

Currently, no files outside the `@engines/prompt` module import from it. Future Conversation Engine integration will use the new `getPromptOrchestrator()` function.

---

## Testing Impact

- No test files currently exist in the codebase for Prompt module
- Future test implementations should:
  - Mock `IPromptOrchestrator` instead of `IPromptEngine`
  - Use `getPromptOrchestrator({ promptOrchestrator: mock })` for test injection
  - Expect `PromptPayload` instead of `PromptPackage`
  - Track `analytics` instead of `metrics`

---

## Git Commit

Single commit with message:
```
refactor: Rename Prompt Engine to Prompt Orchestrator

Architectural refactoring to align nomenclature with responsibility.
The module orchestrates prompt construction, not manages engine state.

**Renames:**
- PromptEngine → PromptOrchestrator (IPromptEngine → IPromptOrchestrator)
- PromptBuilder → PromptComposer (IPromptBuilder → IPromptComposer)
- PromptValidator → ValidationService (IPromptValidator → IPromptValidationService)
- PromptCache → CacheService (IPromptCache → IPromptCacheService)
- PromptStrategy → AssemblyStrategy (IPromptStrategy → IPromptAssemblyStrategy)
- PromptPackage → PromptPayload (primary output type)
- PromptMetrics → PromptAnalytics (metrics structure)
- PromptVersion → PromptTemplateVersion (version tracking)

**Files Renamed (6):**
- prompt.factory.ts → prompt-orchestrator.factory.ts
- prompt-engine.interface.ts → prompt-orchestrator.interface.ts
- prompt-builder.interface.ts → prompt-composer.interface.ts
- prompt-strategy.interface.ts → prompt-assembly-strategy.interface.ts
- prompt-validator.interface.ts → prompt-validation-service.interface.ts
- prompt-cache.interface.ts → prompt-cache-service.interface.ts

**Files Modified (3):**
- dtos/prompt.dtos.ts (updated class names)
- index.ts (updated exports)
- README.md (updated documentation and diagrams)

**No runtime changes.** All behavior preserved.
All business logic identical.
```

---

## Deployment Notes

### For Users of the Prompt Module

If your code currently imports from `@engines/prompt`:

1. Update import statements:
   ```typescript
   import { getPromptOrchestrator } from '@engines/prompt';
   ```

2. Update function calls:
   ```typescript
   const orchestrator = getPromptOrchestrator();
   ```

3. Update type references:
   ```typescript
   const payload: PromptPayload = result.value;
   ```

4. Update property access:
   ```typescript
   const analytics = payload.analytics;  // was payload.metrics
   ```

### For Future Developers

- This is a **structural refactor only**. No new features, no behavior changes.
- The nomenclature now accurately reflects the module's responsibility
- Future implementations should follow the established patterns
- See README.md for current and planned interfaces

---

## Conclusion

✓ **Refactoring Complete**

The Prompt module has been successfully renamed to Prompt Orchestrator throughout the codebase, with all supporting documentation updated. The refactoring preserves all runtime behavior while establishing clearer architectural semantics.

The module is ready for implementation and integration with the Conversation Engine.

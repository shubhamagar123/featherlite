# Architecture Fitness Tests

This directory contains architecture guardrails that enforce design contracts across the codebase. These tests prevent regressions and ensure consistent architectural patterns.

## Running Tests

Run all architecture tests:

```bash
npm run test:architecture
```

Run specific test:

```bash
npm run test:architecture -- --testNamePattern="Prisma isolation"
```

Watch mode:

```bash
jest --testPathPattern=test/architecture --watch
```

## Test Suites

### 1. Prisma Isolation (`no-prisma-outside-db.spec.ts`)

**Rule:** Prisma usage is restricted to `src/database/` directory.

**Why:** Engines and services must depend on repositories, not database queries directly. This enables swapping database implementations and keeps the domain logic independent of persistence.

**Exception:** Type imports from Prisma are allowed anywhere.

**Fix:** Replace `prisma.user.findUnique()` calls with `UserRepository.findById()`.

### 2. Cross-Engine Imports (`no-cross-engine-imports.spec.ts`)

**Rule:** Engines cannot import from other engines except via `@engines/shared`.

**Why:** Prevents circular dependencies and enables independent testing. Shared types live in `@engines/shared`.

**Example Violation:**
```typescript
// ❌ src/engines/memory/memory.engine.ts
import { WorldEngine } from '@engines/world';
```

**Fix:**
```typescript
// ✅ src/engines/memory/memory.engine.ts
import { WorldContextSnapshot } from '@engines/shared/types';
```

### 3. TypeScript Type Safety (`as-any-count.spec.ts`)

**Rule:** Limit `as any` casts to < 15 in the entire codebase.

**Why:** Each `as any` is a type safety escape hatch that can hide bugs. Track and eliminate them systematically.

**Allowlist:** Safe casts can be allowlisted in the test via the `ALLOWLIST` object.

**Fix:** Use proper typing:
```typescript
// ❌ Before
const x = data as any;

// ✅ After
interface DataShape { name: string; }
const x = data as DataShape;
```

### 4. Console Usage (`no-console-usage.spec.ts`)

**Rule:** No `console.log`, `console.error`, `console.warn` in production code except `src/config/environment.ts`.

**Why:** All logging must go through pino logger for structured logging and observability integration.

**Exception:** `src/config/environment.ts` is allowed for boot-time diagnostics.

**Fix:** Inject logger via constructor:
```typescript
// ❌ Before
console.error('Failed to load memory:', err);

// ✅ After
this.logger.error({ error: err }, 'Failed to load memory');
```

### 5. Express Isolation (`express-isolation.spec.ts`)

**Rule:** Express imports only allowed in `src/middleware/`, `src/api/`, and `src/server.ts`.

**Why:** Engines and services are framework-agnostic. Request/response handling stays in the HTTP layer.

**Example Violation:**
```typescript
// ❌ src/engines/memory/memory.engine.ts
import { Request, Response } from 'express';
```

**Fix:** Pass data as typed parameters, not Express types:
```typescript
// ✅ src/engines/memory/memory.engine.ts
async saveMemory(userId: string, memory: MemoryData): Promise<IResult<Memory>>
```

## Adding New Fitness Tests

1. Create a new file in this directory: `test/architecture/my-rule.spec.ts`

2. Use `glob` to find files, `readFileSync` to scan content:

```typescript
describe('Architecture: My Rule', () => {
  it('should enforce my pattern', async () => {
    const files = await glob(`${projectRoot}/src/**/*.ts`);
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('something-bad')) {
        violations.push(file);
      }
    }

    expect(violations).toEqual([], `Found violations: ${violations.join(', ')}`);
  });
});
```

3. The test automatically runs in CI via `npm run test:architecture`.

## Ignoring Violations (Temporary)

If you have a justified exception:

1. Add to the `ALLOWLIST` in the relevant test with a comment explaining why.
2. Create an issue to track removal of the exception.
3. Get approval from tech lead before merging.

Example:
```typescript
const ALLOWLIST: Record<string, number[]> = {
  // TODO(#123): Remove once KafkaMessage types are imported directly
  'src/engines/event/brokers/kafka-broker.ts': [96, 99],
};
```

## CI Integration

Architecture tests run on every PR:

```yaml
# .github/workflows/ci.yml
- name: Run architecture fitness tests
  run: npm run test:architecture
```

Tests must pass before merging to `main` or `develop`.

## Success Criteria

All architecture tests pass:
- ✅ No Prisma outside `src/database/`
- ✅ No cross-engine imports except via `@engines/shared`
- ✅ `as any` count ≤ 15
- ✅ No console usage outside approved locations
- ✅ Express only in middleware/api layers

## Troubleshooting

### Test fails: "Found Prisma usage outside src/database/"

Find the violation:
```bash
grep -r "from '@prisma/client'" src --include="*.ts" | grep -v src/database
```

Move the query to a repository method.

### Test fails: "Found cross-engine imports"

Check which engine is importing:
```bash
grep -r "from '@engines/" src/engines/memory --include="*.ts"
```

Move shared types to `@engines/shared` or pass data through function parameters.

### Test fails: "Found X unallowlisted as any casts"

Review the violations:
```bash
grep -r " as any" src --include="*.ts" -n
```

Either type them properly or add to `ALLOWLIST` with justification.

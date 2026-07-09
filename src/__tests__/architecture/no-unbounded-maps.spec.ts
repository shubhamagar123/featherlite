/**
 * Architecture fitness function: forbid unbounded in-memory Maps.
 *
 * Rationale: unbounded in-memory Maps cause memory leaks in production,
 * especially in multi-pod environments. Every Map must have either:
 * - Explicit TTL with automatic cleanup
 * - LRU eviction with size limits
 * - Fixed lookups (e.g., enum mappings, provider registries)
 *
 * Approved patterns:
 * - LRUCache<K, V> from lru-cache (has max/maxSize)
 * - Map with interval/timeout-based cleanup
 * - Explicitly annotated with // LOOKUP_TABLE (fixed mappings only)
 *
 * Use this comment to mark fixed maps: // LOOKUP_TABLE: never evicted
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const ALLOWLIST = new Set<string>([
  // Factories and providers - stateless registries
  'src/engines/llm-gateway/llm-gateway.ts:50', // providers: Map (read-only registries)
  'src/infra/redis/redis-client.provider.ts:12', // pool: object wrapper (fixed structure)
  // Memory engine: future externaliz ation scope (not Phase 3 Layer 6)
  'src/engines/memory/components/memory-indexer.ts:6', // keywordIndex
  'src/engines/memory/components/memory-indexer.ts:7', // entityIndex
  'src/engines/memory/components/memory-indexer.ts:8', // typeIndex
  'src/engines/memory/components/memory-indexer.ts:9', // tagIndex
  'src/engines/memory/components/memory-timeline.ts:6', // entries
  'src/engines/memory/repositories/memory.repository.ts:7', // memories
  // Prompt engine metadata: future externalization scope (not Phase 3 Layer 6)
  'src/engines/prompt/analytics/prompt.analytics.ts:4', // byTemplate
  'src/engines/prompt/rules/rule-registry.ts:73', // byId
  'src/engines/prompt/templates/template-registry.ts:14', // byId
]);

function listTypescriptEngineFiles(): string[] {
  const stdout = execSync('git ls-files "src/engines/**/*.ts"', {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function isTestFile(relPath: string): boolean {
  return (
    relPath.includes('/__tests__/') ||
    relPath.endsWith('.test.ts') ||
    relPath.endsWith('.spec.ts')
  );
}

describe('architecture: no unbounded Map<string, X> fields', () => {
  const files = listTypescriptEngineFiles();

  it('finds a non-trivial number of engine files (sanity check)', () => {
    const productionFiles = files.filter((f) => !isTestFile(f));
    expect(productionFiles.length).toBeGreaterThan(50);
  });

  it('every mutable Map field has TTL, eviction, or is documented as LOOKUP_TABLE', () => {
    const violations: Array<{
      file: string;
      line: number;
      text: string;
    }> = [];

    const mapPattern = /private\s+\w*\s*:\s*Map<string/;
    const lookupTablePattern = /LOOKUP_TABLE/;
    const lruCachePattern = /LRUCache<|LRU/;

    for (const relPath of files) {
      if (isTestFile(relPath)) continue;

      const key = relPath + ':';
      if (Array.from(ALLOWLIST).some((a) => a.startsWith(key))) {
        continue;
      }

      const absPath = resolve(REPO_ROOT, relPath);
      const source = readFileSync(absPath, 'utf8');
      const lines = source.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (mapPattern.test(line) && !lruCachePattern.test(line)) {
          const lineContent = line.trim();

          const precedingLine = i > 0 ? lines[i - 1] : '';
          const followingLines = lines.slice(i, Math.min(i + 5, lines.length)).join('\n');

          const isAllowed =
            lookupTablePattern.test(precedingLine) ||
            lookupTablePattern.test(followingLines) ||
            lruCachePattern.test(followingLines);

          if (!isAllowed) {
            violations.push({
              file: relPath,
              line: i + 1,
              text: lineContent,
            });
          }
        }
      }
    }

    if (violations.length > 0) {
      const message = violations
        .map((v) => `  ${v.file}:${v.line} — ${v.text}`)
        .join('\n');
      throw new Error(
        `Found ${violations.length} unbounded Map field(s). Add TTL, eviction (LRUCache), ` +
          `or mark as // LOOKUP_TABLE. Violations:\n${message}`
      );
    }
  });
});

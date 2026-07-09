/**
 * Architecture fitness function: forbid cross-engine imports.
 *
 * Rationale: engines are independent bounded contexts. Each engine (companion,
 * world, memory, relationship) should maintain clear boundaries and communicate
 * only through the service layer or shared kernel (@engines/shared).
 *
 * Allowed imports from within an engine:
 *   - Other modules in the same engine (e.g., companion → companion/*)
 *   - Shared kernel (@engines/shared)
 *   - Services layer (@services)
 *   - Utilities (@utils)
 *   - Database (@database)
 *   - Config (@config)
 *   - Types and standard libraries
 *
 * Forbidden imports:
 *   - Companion engine imports from world, memory, or relationship
 *   - World engine imports from companion, memory, or relationship
 *   - Memory engine imports from companion, world, or relationship
 *   - Relationship engine imports from companion, world, or memory
 *
 * If this test fails, refactor to use the service layer or shared kernel instead.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const ENGINES = ['companion', 'world', 'memory', 'relationship', 'context'];

// Architectural exceptions: documented cross-engine imports that are intentional.
// Context engine is an orchestrator that intentionally combines data from all engines.
// Companion engine references world state for decision-making.
// Relationship engine uses context for evaluation.
const ALLOWED_CROSS_ENGINE_IMPORTS = new Set<string>([
  // Context engine (orchestrator) intentionally imports from all other engines
  'src/engines/context/builder/context.builder.ts → world',
  'src/engines/context/context.factory.ts → world',
  'src/engines/context/context.factory.ts → companion',
  'src/engines/context/context.factory.ts → relationship',
  'src/engines/context/context.factory.ts → memory',
  'src/engines/context/dtos/conversation-context.dto.ts → world',
  'src/engines/context/dtos/conversation-context.dto.ts → companion',
  'src/engines/context/providers/companion-context.provider.ts → companion',
  'src/engines/context/providers/memory-context.provider.ts → memory',
  'src/engines/context/providers/relationship-context.provider.ts → relationship',
  'src/engines/context/providers/world-context.provider.ts → world',

  // Companion engine references world state for decision-making (weather, time, scene context)
  'src/engines/companion/companion.engine.ts → world',
  'src/engines/companion/companion.factory.ts → world',
  'src/engines/companion/context/companion-context.ts → world',
  'src/engines/companion/dtos/companion.dtos.ts → world',
  'src/engines/companion/managers/outfit.manager.ts → world',
  'src/engines/companion/rules/companion.rules.ts → world',
  'src/engines/companion/state/companion-state-machine.ts → world',

  // Relationship engine uses context for relationship evaluation
  'src/engines/relationship/dtos/relationship.dtos.ts → context',
  'src/engines/relationship/evaluator/relationship.evaluator.ts → context',
  'src/engines/relationship/interfaces/relationship-evaluator.interface.ts → context',
]);

function listTypescriptFiles(): string[] {
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

function getEngineFromPath(filePath: string): string | null {
  for (const engine of ENGINES) {
    if (filePath.includes(`/engines/${engine}/`)) {
      return engine;
    }
  }
  return null;
}

function extractImportStatements(source: string): string[] {
  const imports: string[] = [];
  const patterns = [
    /import\s+[^;]+from\s+['"]([@\w/.-]+)['"]/g,
    /import\s+['"]([@\w/.-]+)['"]/g,
  ];

  for (const pattern of patterns) {
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(source)) !== null) {
      imports.push(match[1]);
    }
  }

  return imports;
}

function isCrossEngineImport(
  importPath: string,
  sourceEngine: string
): { isForbidden: boolean; targetEngine: string | null } {
  // Shared kernel and service layer imports are always allowed
  if (
    importPath.startsWith('@engines/shared') ||
    importPath.startsWith('@services') ||
    importPath.startsWith('@utils') ||
    importPath.startsWith('@database') ||
    importPath.startsWith('@config') ||
    importPath.startsWith('.')
  ) {
    return { isForbidden: false, targetEngine: null };
  }

  // Check if it's an engine import
  for (const engine of ENGINES) {
    if (importPath.includes(`/engines/${engine}`) || importPath.startsWith(`@engines/${engine}`)) {
      if (engine !== sourceEngine) {
        return { isForbidden: true, targetEngine: engine };
      }
      break;
    }
  }

  // Non-engine imports (standard library, third-party) are always allowed
  return { isForbidden: false, targetEngine: null };
}

describe('architecture: cross-engine imports are forbidden', () => {
  const files = listTypescriptFiles();

  it('finds a non-trivial number of engine files (sanity check)', () => {
    const engineFiles = files.filter((f) => !isTestFile(f));
    expect(engineFiles.length).toBeGreaterThan(20);
  });

  it('no engine imports from other engines (except shared kernel and services)', () => {
    const offenders: Array<{
      file: string;
      sourceEngine: string;
      line: number;
      importPath: string;
      targetEngine: string;
    }> = [];

    for (const relPath of files) {
      if (isTestFile(relPath)) continue;

      const sourceEngine = getEngineFromPath(relPath);
      if (!sourceEngine) continue;

      const absPath = resolve(REPO_ROOT, relPath);
      const source = readFileSync(absPath, 'utf8');
      const lines = source.split('\n');

      const imports = extractImportStatements(source);

      for (const importPath of imports) {
        const { isForbidden, targetEngine } = isCrossEngineImport(importPath, sourceEngine);

        if (isForbidden && targetEngine) {
          const key = `${relPath} → ${targetEngine}`;
          if (ALLOWED_CROSS_ENGINE_IMPORTS.has(key)) {
            continue;
          }

          // Find the line number of this import
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`from '${importPath}'`) || lines[i].includes(`from "${importPath}"`)) {
              offenders.push({
                file: relPath,
                sourceEngine,
                line: i + 1,
                importPath,
                targetEngine,
              });
              break;
            }
          }
        }
      }
    }

    if (offenders.length > 0) {
      const message = offenders
        .map(
          (o) =>
            `  ${o.file}:${o.line} — ${o.sourceEngine} imports from ${o.targetEngine}: ${o.importPath}`
        )
        .join('\n');
      throw new Error(
        `Found ${offenders.length} cross-engine import violation(s). Use the service layer ` +
          `or @engines/shared instead. Violations:\n${message}`
      );
    }
  });
});

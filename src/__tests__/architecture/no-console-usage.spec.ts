/**
 * Architecture fitness function: forbid `console.*` in production code.
 *
 * Rationale: every production log must go through the pino logger so that PII
 * redaction, log levels, and structured fields work uniformly. Two allowances:
 *   - `src/config/environment.ts` — the config loader may fail before the
 *     logger is available (chicken-and-egg on env), so it uses console.error.
 *   - `__tests__` directories — free to use console.log for local debugging
 *     without polluting production.
 *
 * If this test fails, replace the offending `console.*` call with a pino
 * logger (`createLogger` from `@utils/logger`) or a `BaseEventHandler.logger`.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const ALLOWLIST = new Set<string>([
  // config loader must report before pino is initialized
  'src/config/environment.ts',
]);

function listTypescriptFiles(): string[] {
  // Use git ls-files so we honor .gitignore and avoid node_modules.
  const stdout = execSync('git ls-files "src/**/*.ts"', {
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

describe('architecture: no console.* usage in production code', () => {
  const files = listTypescriptFiles();

  it('finds a non-trivial number of production files (sanity check)', () => {
    const productionFiles = files.filter((f) => !isTestFile(f) && !ALLOWLIST.has(f));
    expect(productionFiles.length).toBeGreaterThan(50);
  });

  it('every production file is free of console.log/error/warn/info/debug', () => {
    const offenders: Array<{ file: string; line: number; text: string }> = [];
    const pattern = /\bconsole\.(log|error|warn|info|debug|trace)\s*\(/;

    for (const relPath of files) {
      if (isTestFile(relPath)) continue;
      if (ALLOWLIST.has(relPath)) continue;

      const absPath = resolve(REPO_ROOT, relPath);
      const source = readFileSync(absPath, 'utf8');
      const lines = source.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comments so we don't false-positive on documentation.
        const withoutLineComment = line.replace(/\/\/.*$/, '');
        if (pattern.test(withoutLineComment)) {
          offenders.push({ file: relPath, line: i + 1, text: line.trim() });
        }
      }
    }

    if (offenders.length > 0) {
      const message = offenders
        .map((o) => `  ${o.file}:${o.line} — ${o.text}`)
        .join('\n');
      throw new Error(
        `Found ${offenders.length} console.* call(s) in production code. Use the pino ` +
          `logger instead. Files:\n${message}`
      );
    }
  });
});

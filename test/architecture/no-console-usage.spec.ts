import { glob } from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Fitness function: No console usage in production code
 * Logging must go through pino logger via dependency injection.
 * Exception: src/config/environment.ts (allowed to use console during boot diagnostics)
 */
describe('Architecture: No console usage in production code', () => {
  const ALLOWED_FILES = [
    'src/config/environment.ts',
    'test/', // Tests can use console
  ];

  it('should not use console.log, console.error, console.warn in production code', async () => {
    const projectRoot = join(__dirname, '../../');
    const srcFiles = await glob(`${projectRoot}/src/**/*.ts`, {
      ignore: [`${projectRoot}/src/**/__tests__/**`, `${projectRoot}/src/**/*.spec.ts`],
    });

    if (!Array.isArray(srcFiles) || srcFiles.length === 0) {
      // No source files found, skip
      return;
    }

    const violations: Array<{ file: string; lines: number[] }> = [];

    for (const file of srcFiles) {
      const relPath = file.replace(projectRoot + '/', '');

      // Skip allowed files
      if (ALLOWED_FILES.some((allowed) => relPath.startsWith(allowed))) {
        continue;
      }

      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const foundLines: number[] = [];

      lines.forEach((line, idx) => {
        const trimmed = line.trim();

        // Check for console usage (excluding comments and strings)
        if (
          (trimmed.includes('console.log') ||
            trimmed.includes('console.error') ||
            trimmed.includes('console.warn')) &&
          !trimmed.startsWith('//')
        ) {
          foundLines.push(idx + 1);
        }
      });

      if (foundLines.length > 0) {
        violations.push({ file: relPath, lines: foundLines });
      }
    }

    expect(violations).toEqual(
      [],
      `Found console usage in production code:\n${violations
        .map(({ file, lines }) => `${file}:${lines.join(',')}`)
        .join('\n')}`
    );
  });
});

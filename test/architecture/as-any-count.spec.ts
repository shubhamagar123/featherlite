import { glob } from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Fitness function: Limit TypeScript escape hatches
 * Tracks `as any` usage to catch regressions in type safety.
 * Update the threshold as type safety improves.
 */
describe('Architecture: TypeScript type safety (as any usage)', () => {
  // Allowlist of files with intentional `as any` usage and line numbers
  const ALLOWLIST: Record<string, number[]> = {
    // Add entries like: 'src/engines/kafka-broker.ts': [96, 99],
    // These are known safe casts that can't be easily typed
  };

  it('should keep as any count below threshold', async () => {
    const projectRoot = join(__dirname, '../../');
    const srcFiles = await glob(`${projectRoot}/src/**/*.ts`, {
      ignore: [`${projectRoot}/src/**/__tests__/**`],
    });

    let totalCount = 0;
    const violations: Record<string, number[]> = {};

    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const relPath = file.replace(projectRoot + '/', '');

      const foundLines: number[] = [];
      lines.forEach((line, idx) => {
        if (line.includes(' as any')) {
          foundLines.push(idx + 1);
          totalCount++;
        }
      });

      if (foundLines.length > 0) {
        const allowedLines = ALLOWLIST[relPath] || [];
        const violatingLines = foundLines.filter((l) => !allowedLines.includes(l));

        if (violatingLines.length > 0) {
          violations[relPath] = violatingLines;
        }
      }
    }

    // Threshold: allow up to 15 `as any` casts in the codebase
    const threshold = 15;
    const violationCount = Object.values(violations).reduce((a, b) => a + b.length, 0);

    expect(violationCount).toBeLessThanOrEqual(
      threshold,
      `Found ${violationCount} unallowlisted \`as any\` casts (threshold: ${threshold}):\n${Object.entries(violations)
        .map(([file, lines]) => `${file}:${lines.join(',')}`)
        .join('\n')}`
    );
  });
});

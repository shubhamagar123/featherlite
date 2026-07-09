import { glob } from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Fitness function: Express is only used in middleware and app entry points
 * Engines and services must not depend on Express directly.
 */
describe('Architecture: Express isolation', () => {
  const ALLOWED_DIRS = ['src/middleware/', 'src/api/', 'src/server.ts'];

  it('should not import Express outside middleware and API layers', async () => {
    const projectRoot = join(__dirname, '../../');
    const srcFiles = await glob(`${projectRoot}/src/**/*.ts`, {
      ignore: [`${projectRoot}/src/**/__tests__/**`, `${projectRoot}/src/**/*.spec.ts`],
    });

    const violations: string[] = [];

    for (const file of srcFiles) {
      const relPath = file.replace(projectRoot + '/', '');

      // Skip allowed directories
      if (ALLOWED_DIRS.some((allowed) => relPath.startsWith(allowed))) {
        continue;
      }

      const content = readFileSync(file, 'utf-8');

      // Check for Express imports
      if (
        content.includes("from 'express'") ||
        content.includes('from "express"')
      ) {
        violations.push(relPath);
      }

      // Check for common Express types
      if (
        (content.includes('Request') ||
          content.includes('Response') ||
          content.includes('NextFunction')) &&
        content.includes("from 'express'")
      ) {
        violations.push(relPath);
      }
    }

    expect(violations).toEqual(
      [],
      `Found Express usage outside middleware/API:\n${violations.join('\n')}`
    );
  });
});

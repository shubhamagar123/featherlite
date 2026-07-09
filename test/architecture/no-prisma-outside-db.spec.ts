import { glob } from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Fitness function: Prisma usage is isolated to src/database/
 * Engines and services should use repositories, not Prisma directly.
 */
describe('Architecture: Prisma isolation', () => {
  it('should not import Prisma outside src/database/', async () => {
    const projectRoot = join(__dirname, '../../');
    const srcFiles = await glob(`${projectRoot}/src/**/*.ts`, {
      ignore: [
        `${projectRoot}/src/database/**`,
        `${projectRoot}/src/**/__tests__/**`,
        `${projectRoot}/src/**/*.spec.ts`,
      ],
    });

    if (!Array.isArray(srcFiles) || srcFiles.length === 0) {
      return;
    }

    const violations: string[] = [];

    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf-8');

      // Check for direct Prisma imports/usage (excluding type imports)
      if (
        (content.includes("from '@prisma/client'") ||
          content.includes("from 'prisma/client'")) &&
        !content.includes('type ') &&
        !content.includes('IResult') &&
        !content.includes('Prisma.')
      ) {
        violations.push(file);
      }

      // Check for usage of PrismaClient directly
      if (
        content.includes('new PrismaClient()') ||
        content.includes('prisma.') &&
        !file.includes('src/database/')
      ) {
        violations.push(file);
      }
    }

    expect(violations).toEqual(
      [],
      `Found Prisma usage outside src/database/: ${violations.join(', ')}`
    );
  });
});

import { glob } from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Fitness function: Cross-engine imports flow through @engines/shared
 * Example violation: @engines/memory importing from @engines/world directly
 */
describe('Architecture: Cross-engine import isolation', () => {
  it('should not import from @engines/X inside @engines/Y (except via @engines/shared)', async () => {
    const projectRoot = join(__dirname, '../../');
    const engineDirs = [
      'memory',
      'event',
      'relationship',
      'world',
      'companion',
      'context',
      'moment',
      'notification',
      'llm-gateway',
      'prompt',
      'response-processor',
    ];

    const violations: string[] = [];

    for (const engineDir of engineDirs) {
      const files = await glob(`${projectRoot}/src/engines/${engineDir}/**/*.ts`, {
        ignore: [`${projectRoot}/src/engines/${engineDir}/__tests__/**`],
      });

      if (!Array.isArray(files) || files.length === 0) {
        continue;
      }

      for (const file of files) {
        const content = readFileSync(file, 'utf-8');

        for (const otherEngine of engineDirs) {
          if (otherEngine === engineDir) continue;

          const importPattern = `from '@engines/${otherEngine}`;
          if (
            content.includes(importPattern) &&
            !content.includes('@engines/shared')
          ) {
            violations.push(
              `${file.replace(projectRoot, '')}: imports @engines/${otherEngine} directly`
            );
          }
        }
      }
    }

    expect(violations).toEqual(
      [],
      `Found cross-engine imports outside @engines/shared:\n${violations.join('\n')}`
    );
  });
});

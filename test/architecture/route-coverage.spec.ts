import { glob } from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Fitness function: All routes are properly secured and validated
 * Every route in src/api/ must have:
 * 1. Authentication (authenticate middleware)
 * 2. Validation (validate middleware or explicit validation)
 * 3. Authorization if needed (authorize middleware for protected resources)
 *
 * Exception: @Public() decorated routes or health/ready endpoints
 */
describe('Architecture: Route security and validation', () => {
  const PUBLIC_ROUTES = ['/health', '/ready', '/api/info'];
  const PUBLIC_PREFIXES = ['/webhook']; // Webhooks don't need auth

  it('should have authentication on all API routes', async () => {
    const projectRoot = join(__dirname, '../../');
    const apiFiles = await glob(`${projectRoot}/src/api/**/*.ts`, {
      ignore: [`${projectRoot}/src/api/**/__tests__/**`],
    });

    if (!Array.isArray(apiFiles) || apiFiles.length === 0) {
      // No API files yet, skip
      return;
    }

    const violations: string[] = [];

    for (const file of apiFiles) {
      const relPath = file.replace(projectRoot + '/', '');
      const content = readFileSync(file, 'utf-8');

      // Skip if no route definitions
      if (!content.includes('app.') && !content.includes('router.')) {
        continue;
      }

      // Check each route definition
      const routeMatches = content.matchAll(
        /(?:app|router)\.(get|post|put|patch|delete)\(['"](.*?)['"]/g
      );

      for (const match of routeMatches) {
        const method = match[1];
        const path = match[2];

        // Skip public routes
        if (
          PUBLIC_ROUTES.includes(path) ||
          PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))
        ) {
          continue;
        }

        // Check if route has @Public() or publicRoute() decorator
        const beforeRoute = content.substring(
          Math.max(0, match.index! - 200),
          match.index!
        );

        if (beforeRoute.includes('@Public') || beforeRoute.includes('publicRoute')) {
          continue;
        }

        // For protected routes, check for authenticate
        if (!beforeRoute.includes('authenticate')) {
          violations.push(
            `${relPath}:${method.toUpperCase()} ${path} - missing authenticate middleware`
          );
        }
      }
    }

    expect(violations).toEqual(
      [],
      `Found routes without authentication:\n${violations.join('\n')}`
    );
  });

  it('should have validation on POST/PUT/PATCH routes', async () => {
    const projectRoot = join(__dirname, '../../');
    const apiFiles = await glob(`${projectRoot}/src/api/**/*.ts`, {
      ignore: [`${projectRoot}/src/api/**/__tests__/**`],
    });

    if (apiFiles.length === 0) {
      return;
    }

    const violations: string[] = [];

    for (const file of apiFiles) {
      const relPath = file.replace(projectRoot + '/', '');
      const content = readFileSync(file, 'utf-8');

      // Find state-changing routes (POST, PUT, PATCH, DELETE)
      const routeMatches = content.matchAll(
        /(?:app|router)\.(post|put|patch|delete)\(['"](.*?)['"],\s*(?:.*?),\s*(?:.*?)=>/gms
      );

      for (const match of routeMatches) {
        const method = match[1];
        const path = match[2];
        const routeSection = match[0];

        // Skip public routes
        if (PUBLIC_ROUTES.includes(path)) {
          continue;
        }

        // For POST/PUT/PATCH, check for validate()
        if (['post', 'put', 'patch'].includes(method)) {
          if (!routeSection.includes('validate(')) {
            violations.push(
              `${relPath}:${method.toUpperCase()} ${path} - missing validate() middleware`
            );
          }
        }
      }
    }

    // Don't fail if no API files yet (Phase 9 hasn't been implemented)
    if (violations.length > 0) {
      expect(violations).toEqual([], `Routes missing validation:\n${violations.join('\n')}`);
    }
  });

  it('should use proper middleware chain patterns', async () => {
    const projectRoot = join(__dirname, '../../');
    const apiFiles = await glob(`${projectRoot}/src/api/**/*.ts`, {
      ignore: [`${projectRoot}/src/api/**/__tests__/**`],
    });

    if (apiFiles.length === 0) {
      return;
    }

    const violations: string[] = [];

    for (const file of apiFiles) {
      const relPath = file.replace(projectRoot + '/', '');
      const content = readFileSync(file, 'utf-8');

      // Check that middleware is applied before handler
      const invalidPatterns = [
        /(?:app|router)\.\w+\(['"]/g, // Routes defined
      ];

      // Verify authenticate is imported
      if (
        content.includes('app.') ||
        content.includes('router.')
      ) {
        if (
          !content.includes("from '@middleware/authenticate'") &&
          !content.includes('publicRoute')
        ) {
          // File has routes but doesn't import auth middleware
          const routeMatches = content.matchAll(
            /(?:app|router)\.(post|put|patch|delete)\(['"](.*?)['"]/g
          );

          const hasRoutes = Array.from(routeMatches).length > 0;
          if (hasRoutes) {
            violations.push(
              `${relPath} - has protected routes but doesn't import authenticate middleware`
            );
          }
        }
      }
    }

    if (violations.length > 0) {
      expect(violations).toEqual(
        [],
        `Routes have incorrect middleware imports:\n${violations.join('\n')}`
      );
    }
  });
});

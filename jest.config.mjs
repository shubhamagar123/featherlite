export default {
  displayName: 'featherlight',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@engines/(.*)$': '<rootDir>/src/engines/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@events/(.*)$': '<rootDir>/src/events/$1',
    '^@validators/(.*)$': '<rootDir>/src/validators/$1',
    '^@infra/(.*)$': '<rootDir>/src/infra/$1',
    '^@fixtures/(.*)$': '<rootDir>/tests/fixtures/$1',
    '^@factories/(.*)$': '<rootDir>/tests/factories/$1',
    '^@mocks/(.*)$': '<rootDir>/tests/mocks/$1',
    '^@helpers/(.*)$': '<rootDir>/tests/helpers/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/server.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testTimeout: 30000,
  // Integration specs share one Postgres test DB and truncate it in a global
  // beforeEach (tests/setup/setup.ts) — running workers in parallel causes
  // deadlocks/unique-constraint races across files hitting that DB at once.
  maxWorkers: 1,
};

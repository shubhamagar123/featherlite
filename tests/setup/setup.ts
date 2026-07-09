/**
 * Global Test Setup
 * Initializes test environment, database, and dependencies
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

export let testDb: PrismaClient;
export let testStartTime: number;

/**
 * Initialize test database
 */
export async function initializeTestDatabase(): Promise<PrismaClient> {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/featherlight_test',
      },
    },
  });

  return prisma;
}

/**
 * Reset database to clean state
 */
export async function resetDatabase(): Promise<void> {
  if (!testDb) return;

  const tables = [
    'Message',
    'Notification',
    'Moment',
    'Memory',
    'Conversation',
    'Relationship',
    'Companion',
    'User',
  ];

  for (const table of tables) {
    await testDb.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}

/**
 * Seed test data
 */
export async function seedTestData(): Promise<void> {
  if (!testDb) return;

  // Create test user
  await testDb.user.create({
    data: {
      id: 'test-user-1',
      email: 'test@example.com',
      username: 'testuser',
      firebaseUid: 'firebase-test-1',
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  // Create test companion
  await testDb.companion.create({
    data: {
      id: 'test-companion-1',
      userId: 'test-user-1',
      name: 'Test Companion',
      description: 'A test companion',
      personality: 'friendly',
      status: 'ACTIVE',
    },
  });
}

/**
 * Cleanup test database
 */
export async function cleanupTestDatabase(): Promise<void> {
  if (testDb) {
    await testDb.$disconnect();
  }
}

/**
 * Global setup - runs once before all tests
 */
beforeAll(async () => {
  testStartTime = Date.now();
  testDb = await initializeTestDatabase();

  // Run migrations
  await testDb.$executeRawUnsafe('SELECT 1');
});

/**
 * Setup - runs before each test
 */
beforeEach(async () => {
  await resetDatabase();
  await seedTestData();
});

/**
 * Teardown - runs after each test
 */
afterEach(async () => {
  // Tests clean up themselves
});

/**
 * Global teardown - runs once after all tests
 */
afterAll(async () => {
  await cleanupTestDatabase();
});

/**
 * Suppress console errors in tests (optional)
 */
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('warning') || args[0].includes('deprecated'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

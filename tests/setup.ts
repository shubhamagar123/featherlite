// Test environment setup and global configuration

// Set test environment
process.env.NODE_ENV = 'test';

// Suppress console output during tests unless explicitly called
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Keep error output visible
    error: console.error,
  };
}

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Cleanup can be added here if needed
});

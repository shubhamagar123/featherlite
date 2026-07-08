/**
 * Test environment variables.
 *
 * Runs via Jest `setupFiles` — before any test module (and therefore before
 * `src/config/environment.ts`) is evaluated. It supplies dummy values for the
 * variables that the environment schema requires, so config validation passes
 * under test without a real `.env`. These are non-secret placeholders used only
 * to satisfy schema shape; no test should depend on their values.
 */

const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/featherlight_test',
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_PRIVATE_KEY: 'test-private-key',
  FIREBASE_CLIENT_EMAIL: 'test@test-project.iam.gserviceaccount.com',
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'test-access-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  S3_BUCKET_NAME: 'test-bucket',
  JWT_SECRET: 'test-jwt-secret-min-32-chars-padded!!',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-min-32-chars!',
  EMAIL_FROM: 'noreply@featherlight.test',
  EMAIL_FROM_NAME: 'Featherlight Test',
  SESSION_SECRET: 'test-session-secret-min-32-chars-pad!',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

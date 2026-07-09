import { z } from 'zod';

// Env-var boolean: accepts "true"/"1" as true, everything else as false.
// z.coerce.boolean() is NOT used because Boolean("false") === true (non-empty string).
const boolEnv = (defaultVal: boolean) =>
  z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default(defaultVal ? 'true' : 'false');

const envSchema = z
  .object({
    // Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

    // Database - PostgreSQL
    DATABASE_URL: z.string().url(),

    // Redis
    REDIS_URL: z.string().url().optional(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.coerce.number().default(0),

    // Firebase Authentication
    FIREBASE_PROJECT_ID: z.string(),
    // Unescape literal \n sequences written by infrastructure tooling
    FIREBASE_PRIVATE_KEY: z.string().transform((v) => v.replace(/\\n/g, '\n')),
    FIREBASE_CLIENT_EMAIL: z.string(),

    // AWS S3 (required in production; optional elsewhere)
    AWS_REGION: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET_NAME: z.string().optional(),
    S3_UPLOAD_DIR: z.string().default('uploads'),

    // JWT Configuration — minimum 32 chars to ensure adequate entropy
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRATION: z.string().default('7d'),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_REFRESH_EXPIRATION: z.string().default('30d'),

    // Email Configuration (required in production; optional elsewhere)
    EMAIL_PROVIDER: z.string().default('sendgrid'),
    SENDGRID_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().email().optional(),
    EMAIL_FROM_NAME: z.string().optional(),

    // Socket.io Configuration
    SOCKET_CORS_ORIGIN: z.string().optional(),
    SOCKET_PING_INTERVAL: z.coerce.number().default(25000),
    SOCKET_PING_TIMEOUT: z.coerce.number().default(60000),

    // AI Provider Configuration
    AI_PROVIDER: z.string().default('openai'),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default('gpt-4'),
    CLAUDE_API_KEY: z.string().optional(),
    CLAUDE_MODEL: z.string().default('claude-3-opus-20240229'),

    // Feature Flags
    FEATURE_VOICE_ENABLED: boolEnv(true),
    FEATURE_VIDEO_ENABLED: boolEnv(false),
    FEATURE_ANALYTICS_ENABLED: boolEnv(true),
    FEATURE_BULLMQ_DISPATCHER: boolEnv(false),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

    // Pagination
    PAGINATION_DEFAULT_LIMIT: z.coerce.number().default(20),
    PAGINATION_MAX_LIMIT: z.coerce.number().default(100),

    // File Upload Limits
    MAX_FILE_SIZE_MB: z.coerce.number().default(50),
    ALLOWED_FILE_TYPES: z.string().default('jpg,jpeg,png,gif,mp4,webm,mp3,wav'),

    // Monitoring & Observability
    SENTRY_DSN: z.string().optional(),
    APM_ENABLED: boolEnv(false),

    // Admin Configuration
    ADMIN_API_KEY: z.string().optional(),
    ADMIN_EMAIL: z.string().email().optional(),

    // Analytics Configuration
    ANALYTICS_ENABLED: boolEnv(true),
    ANALYTICS_BATCH_SIZE: z.coerce.number().default(100),
    ANALYTICS_BATCH_TIMEOUT_MS: z.coerce.number().default(10000),

    // Cache Configuration
    CACHE_TTL_SHORT: z.coerce.number().default(300),
    CACHE_TTL_MEDIUM: z.coerce.number().default(3600),
    CACHE_TTL_LONG: z.coerce.number().default(86400),

    // Session Configuration — minimum 32 chars to ensure adequate entropy
    SESSION_SECRET: z.string().min(32),
    SESSION_MAX_AGE_MS: z.coerce.number().default(604800000),

    // OpenTelemetry Configuration
    OTEL_ENABLED: boolEnv(false),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().default('http://localhost:4318'),
    OTEL_SAMPLING_RATE: z.coerce.number().default(1.0),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production') return;

    const prodRequired: Array<keyof typeof data> = [
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'S3_BUCKET_NAME',
      'EMAIL_FROM',
      'EMAIL_FROM_NAME',
    ];

    for (const key of prodRequired) {
      if (!data[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: 'Required in production',
        });
      }
    }
  });

export type Environment = z.infer<typeof envSchema>;

let _env: Environment | undefined;

/**
 * Parse and validate process.env. Returns the typed config or throws with a
 * human-readable error listing every invalid field. Does NOT call process.exit —
 * callers decide what to do with the failure (tests can catch; server entry-point
 * can exit).
 */
export function loadEnvironment(): Environment {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = JSON.stringify(result.error.flatten().fieldErrors, null, 2);
    throw new Error(`Invalid environment variables:\n${errors}`);
  }

  _env = result.data;
  return result.data;
}

/** Returns the already-validated config, calling loadEnvironment() on first access. */
export function getEnvironment(): Environment {
  return _env ?? loadEnvironment();
}

export function getDatabaseConfig() {
  const env = getEnvironment();
  return { url: env.DATABASE_URL };
}

export function getRedisConfig() {
  const env = getEnvironment();
  return {
    url: env.REDIS_URL,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  };
}

export function getAuthConfig() {
  const env = getEnvironment();
  return {
    jwtSecret: env.JWT_SECRET,
    jwtExpiration: env.JWT_EXPIRATION,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    jwtRefreshExpiration: env.JWT_REFRESH_EXPIRATION,
    sessionSecret: env.SESSION_SECRET,
    sessionMaxAgeMs: env.SESSION_MAX_AGE_MS,
  };
}

// Module-level init: bad config is fatal at startup.
try {
  _env = loadEnvironment();
} catch (err) {
  console.error('❌ Invalid environment variables:', err instanceof Error ? err.message : err);
  process.exit(1);
}

export const environment: Environment = _env!;

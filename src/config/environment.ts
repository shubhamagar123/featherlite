import { z } from 'zod';

const envSchema = z.object({
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
  FIREBASE_PRIVATE_KEY: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string(),

  // AWS S3
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_UPLOAD_DIR: z.string().default('uploads'),

  // JWT Configuration
  JWT_SECRET: z.string(),
  JWT_EXPIRATION: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRATION: z.string().default('30d'),

  // Email Configuration
  EMAIL_PROVIDER: z.string().default('sendgrid'),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email(),
  EMAIL_FROM_NAME: z.string(),

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
  FEATURE_VOICE_ENABLED: z.string().transform((v) => v === 'true').default('true'),
  FEATURE_VIDEO_ENABLED: z.string().transform((v) => v === 'true').default('false'),
  FEATURE_ANALYTICS_ENABLED: z.string().transform((v) => v === 'true').default('true'),

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
  APM_ENABLED: z.string().transform((v) => v === 'true').default('false'),

  // Admin Configuration
  ADMIN_API_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),

  // Analytics Configuration
  ANALYTICS_ENABLED: z.string().transform((v) => v === 'true').default('true'),
  ANALYTICS_BATCH_SIZE: z.coerce.number().default(100),
  ANALYTICS_BATCH_TIMEOUT_MS: z.coerce.number().default(10000),

  // Cache Configuration
  CACHE_TTL_SHORT: z.coerce.number().default(300),
  CACHE_TTL_MEDIUM: z.coerce.number().default(3600),
  CACHE_TTL_LONG: z.coerce.number().default(86400),

  // Session Configuration
  SESSION_SECRET: z.string(),
  SESSION_MAX_AGE_MS: z.coerce.number().default(604800000),
});

export type Environment = z.infer<typeof envSchema>;

export function loadEnvironment(): Environment {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}

export const environment = loadEnvironment();

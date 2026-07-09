export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  port: number;
  host: string;
  isProduction: boolean;
  isStagingOrProd: boolean;

  // Observability
  otel: {
    enabled: boolean;
    samplingRate: number;
    exportEndpoint: string;
  };

  // Performance tuning
  performance: {
    maxRequestBodySizeMb: number;
    requestTimeoutMs: number;
    keepAliveTimeoutMs: number;
    maxConnections: number;
  };

  // Security
  security: {
    enableCors: boolean;
    corsOrigins: string[];
    enableRateLimiting: boolean;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };

  // Cache settings
  cache: {
    enableRedis: boolean;
    ttlMs: Record<string, number>;
  };

  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'pretty';
    enableStructuredLogging: boolean;
  };

  // Health checks
  health: {
    enableDeepChecks: boolean;
    checkIntervalMs: number;
    checkTimeoutMs: number;
  };
}

export function getDeploymentConfig(): DeploymentConfig {
  const env = process.env.NODE_ENV as 'development' | 'staging' | 'production' | undefined;
  const environment = env || 'development';
  const isProduction = environment === 'production';
  const isStagingOrProd = environment === 'staging' || environment === 'production';

  return {
    environment,
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    isProduction,
    isStagingOrProd,

    otel: {
      enabled: isStagingOrProd || process.env.OTEL_ENABLED === 'true',
      samplingRate: parseFloat(process.env.OTEL_SAMPLING_RATE || (isProduction ? '0.1' : '1.0')),
      exportEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    },

    performance: {
      maxRequestBodySizeMb: parseInt(process.env.MAX_REQUEST_BODY_SIZE_MB || '10', 10),
      requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
      keepAliveTimeoutMs: parseInt(process.env.KEEP_ALIVE_TIMEOUT_MS || '65000', 10),
      maxConnections: parseInt(process.env.MAX_CONNECTIONS || '100', 10),
    },

    security: {
      enableCors: process.env.ENABLE_CORS !== 'false',
      corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3001').split(','),
      enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    cache: {
      enableRedis: process.env.DISABLE_REDIS !== 'true',
      ttlMs: {
        user: parseInt(process.env.CACHE_TTL_USER_MS || '3600000', 10), // 1 hour
        companion: parseInt(process.env.CACHE_TTL_COMPANION_MS || '3600000', 10), // 1 hour
        conversation: parseInt(process.env.CACHE_TTL_CONVERSATION_MS || '1800000', 10), // 30 min
        memory: parseInt(process.env.CACHE_TTL_MEMORY_MS || '1800000', 10), // 30 min
        llm: parseInt(process.env.CACHE_TTL_LLM_MS || '3600000', 10), // 1 hour
      },
    },

    logging: {
      level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
      format: (process.env.LOG_FORMAT as 'json' | 'pretty') || (isProduction ? 'json' : 'pretty'),
      enableStructuredLogging: true,
    },

    health: {
      enableDeepChecks: !isProduction || process.env.ENABLE_DEEP_HEALTH_CHECKS === 'true',
      checkIntervalMs: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '60000', 10),
      checkTimeoutMs: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || '5000', 10),
    },
  };
}

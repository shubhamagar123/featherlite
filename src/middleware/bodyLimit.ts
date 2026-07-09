import express from 'express';

/**
 * Per-endpoint body size limits
 * Different endpoints have different needs:
 * - Chat endpoints: moderate JSON (~1MB)
 * - Upload endpoints: large files (~50MB)
 * - API endpoints: small JSON (~512KB)
 */

export const bodyLimitConfig = {
  // Small: API endpoints, validation
  small: '512kb',

  // Medium: Chat, conversation, standard JSON
  medium: '1mb',

  // Large: File uploads, media processing
  large: '50mb',

  // Tiny: Health checks, status endpoints
  tiny: '1kb',
};

/**
 * Create JSON body parser with custom limit
 * Usage: app.use(createJsonParser('medium'))
 */
export function createJsonParser(limit: keyof typeof bodyLimitConfig = 'medium') {
  return express.json({ limit: bodyLimitConfig[limit] });
}

/**
 * Create URL-encoded body parser with custom limit
 */
export function createUrlencodedParser(
  limit: keyof typeof bodyLimitConfig = 'medium'
) {
  return express.urlencoded({
    limit: bodyLimitConfig[limit],
    extended: true,
  });
}

/**
 * Per-route body limit configuration
 * Mount these on specific route groups
 */
export const bodyParsers = {
  // Default: 1MB for most API endpoints
  default: {
    json: express.json({ limit: bodyLimitConfig.medium }),
    urlencoded: express.urlencoded({
      limit: bodyLimitConfig.medium,
      extended: true,
    }),
  },

  // API: Smaller limit for lightweight endpoints
  api: {
    json: express.json({ limit: bodyLimitConfig.small }),
    urlencoded: express.urlencoded({
      limit: bodyLimitConfig.small,
      extended: true,
    }),
  },

  // Chat: Medium limit for conversation messages
  chat: {
    json: express.json({ limit: bodyLimitConfig.medium }),
    urlencoded: express.urlencoded({
      limit: bodyLimitConfig.medium,
      extended: true,
    }),
  },

  // Upload: Large limit for file uploads
  upload: {
    json: express.json({ limit: bodyLimitConfig.large }),
    urlencoded: express.urlencoded({
      limit: bodyLimitConfig.large,
      extended: true,
    }),
  },

  // Tiny: Minimal limit for lightweight endpoints
  tiny: {
    json: express.json({ limit: bodyLimitConfig.tiny }),
    urlencoded: express.urlencoded({
      limit: bodyLimitConfig.tiny,
      extended: true,
    }),
  },
};

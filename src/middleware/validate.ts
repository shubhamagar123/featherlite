import type { Request, Response, NextFunction } from 'express';
import { z, type ZodSchema } from 'zod';
import { AppError, ErrorCode } from '@utils/error';
import { logger } from '@utils/logger';

export interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
  headers?: ZodSchema;
}

/**
 * Validates request data against Zod schemas
 * Validates body, params, query, and headers
 *
 * Usage:
 * app.post('/users',
 *   validate({
 *     body: z.object({ email: z.string().email(), name: z.string() })
 *   }),
 *   handler
 * )
 */
export function validate(schemas: ValidationSchemas) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors: Record<string, string[]> = {};

      // Validate body
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          errors.body = result.error.errors.map(
            (err) => `${err.path.join('.')}: ${err.message}`
          );
        } else {
          req.body = result.data;
        }
      }

      // Validate params
      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          errors.params = result.error.errors.map(
            (err) => `${err.path.join('.')}: ${err.message}`
          );
        } else {
          req.params = result.data as never;
        }
      }

      // Validate query
      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          errors.query = result.error.errors.map(
            (err) => `${err.path.join('.')}: ${err.message}`
          );
        } else {
          req.query = result.data as never;
        }
      }

      // Validate headers
      if (schemas.headers) {
        const result = schemas.headers.safeParse(req.headers);
        if (!result.success) {
          errors.headers = result.error.errors.map(
            (err) => `${err.path.join('.')}: ${err.message}`
          );
        }
      }

      if (Object.keys(errors).length > 0) {
        logger.warn(
          {
            path: req.path,
            method: req.method,
            errors,
            ip: req.ip,
          },
          'Validation failed'
        );

        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Request validation failed',
          422,
          { validationErrors: errors }
        );
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error({ error }, 'Validation middleware error');
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Validation failed',
        500
      );
    }
  };
}

/**
 * Common Zod schemas for reuse
 */
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),

  // Email validation
  email: z.string().email('Invalid email format').max(255),

  // Password validation (min 8 chars, mixed case, number)
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),

  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),

  // Timestamp
  timestamp: z.coerce.date(),

  // URL
  url: z.string().url('Invalid URL format'),

  // Slug
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),

  // Common ID params
  idParam: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  // Common status enum
  status: z.enum(['active', 'inactive', 'archived', 'deleted']),
};

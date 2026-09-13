import { z } from 'zod';

/**
 * Common Validation Schemas
 * Reusable Zod schemas for request validation
 */

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Email validation
export const emailSchema = z.string().email('Invalid email format');

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Auth Validators
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
});

export const firebaseTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// OTP Auth Validators (phone/email + code — no password field)
export const requestOtpCodeSchema = z.object({
  identifier: z.string().min(3, 'Phone number or email is required').max(255),
});

export const verifyOtpCodeSchema = z.object({
  identifier: z.string().min(3, 'Phone number or email is required').max(255),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

// User Validators
export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(2).max(255),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  preferences: z.record(z.unknown()).optional(),
});

export const userIdParamSchema = z.object({
  userId: uuidSchema,
});

// Memory Validators
export const createMemorySchema = z.object({
  companionId: uuidSchema,
  content: z.string().min(1).max(10000),
  type: z.enum(['event', 'trait', 'relationship', 'preference', 'fact']),
  importance: z.enum(['LOW', 'NORMAL', 'SIGNIFICANT', 'CRITICAL']).default('NORMAL'),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const memoryQuerySchema = z.object({
  companionId: uuidSchema,
  query: z.string().min(1).max(1000),
  limit: z.coerce.number().int().positive().max(50).default(10),
  filters: z.object({
    type: z.string().optional(),
    importance: z.enum(['LOW', 'NORMAL', 'SIGNIFICANT', 'CRITICAL']).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

// Relationship Validators
export const createRelationshipSchema = z.object({
  companionId: uuidSchema,
  targetUserId: uuidSchema.optional(),
  type: z.string().min(1).max(50),
  metadata: z.record(z.unknown()).optional(),
});

export const updateRelationshipSchema = z.object({
  state: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Interaction Validators
export const createInteractionSchema = z.object({
  companionId: uuidSchema,
  input: z.string().min(1).max(5000),
  context: z.object({
    location: z.string().optional(),
    mood: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }).optional(),
});

// Moment Validators
export const createMomentSchema = z.object({
  companionId: uuidSchema,
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['daily', 'event', 'reminder', 'milestone']),
  scheduledFor: z.coerce.date(),
  metadata: z.record(z.unknown()).optional(),
});

// Notification Validators
export const createNotificationSchema = z.object({
  userId: uuidSchema,
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  channel: z.enum(['email', 'push', 'sms', 'in-app']).default('in-app'),
  data: z.record(z.unknown()).optional(),
});

// Settings Validators
export const updateSettingsSchema = z.object({
  notifications: z.boolean().optional(),
  privateProfile: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  preferences: z.record(z.unknown()).optional(),
});

// Query Validators
export const memoryIdParamSchema = z.object({
  memoryId: uuidSchema,
});

export const relationshipIdParamSchema = z.object({
  relationshipId: uuidSchema,
});

export const notificationIdParamSchema = z.object({
  notificationId: uuidSchema,
});

export const momentIdParamSchema = z.object({
  momentId: uuidSchema,
});

/**
 * Validator function
 * Validates input against schema and throws ValidationException on failure
 */
export function validate<T>(data: unknown, schema: z.ZodSchema): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.reduce(
      (acc, error) => {
        const path = error.path.join('.');
        acc[path] = [error.message];
        return acc;
      },
      {} as Record<string, string[]>
    );
    throw new Error(JSON.stringify(errors));
  }
  return result.data as T;
}

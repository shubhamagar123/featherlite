/**
 * Common Application DTOs
 * Request and response DTOs for all application services
 */

// Context passed through application layer
export interface ApplicationContext {
  userId: string;
  userEmail?: string;
  userRoles: string[];
  requestId: string;
  traceId: string;
  correlationId?: string;
  timestamp: Date;
}

// Pagination input
export interface PaginationInput {
  page?: number;
  limit?: number;
  offset?: number;
}

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100,
};

// Common DTOs
export interface IdDto {
  id: string;
}

export interface NameDto {
  name: string;
}

export interface EmailDto {
  email: string;
}

export interface TimestampsDto {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// Auth DTOs
export interface AuthTokenDto {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthUserDto extends IdDto, EmailDto {
  uid: string;
  emailVerified?: boolean;
  roles: string[];
  customClaims?: Record<string, unknown>;
}

// User DTOs
export interface CreateUserDto {
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
  bio?: string;
  preferences?: Record<string, unknown>;
}

export interface UserResponseDto extends IdDto, EmailDto, NameDto {
  avatar?: string | null;
  bio?: string | null;
  emailVerified: boolean;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Query DTOs
export interface CreateQueryDto {
  companionId: string;
  input: string;
}

export interface QueryResponseDto extends IdDto {
  companionId: string;
  input: string;
  response: string;
  duration: number;
  createdAt: Date;
}

// Relationship DTOs
export interface CreateRelationshipDto {
  companionId: string;
  targetUserId?: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export interface RelationshipResponseDto extends IdDto {
  companionId: string;
  targetUserId?: string;
  type: string;
  state: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Memory DTOs
export interface CreateMemoryDto {
  companionId: string;
  content: string;
  type: string;
  importance: 'LOW' | 'NORMAL' | 'SIGNIFICANT' | 'CRITICAL';
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface MemoryResponseDto extends IdDto {
  companionId: string;
  content: string;
  type: string;
  importance: string;
  tags: string[];
  accessCount: number;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification DTOs
export interface NotificationResponseDto extends IdDto {
  userId: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}

// Health DTOs
export interface HealthStatusDto {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  timestamp: Date;
  uptime: number;
  services: {
    [key: string]: ServiceHealthDto;
  };
}

export interface ServiceHealthDto {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  latency?: number;
  lastCheck: Date;
}

// Error DTOs
export interface ErrorResponseDto {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

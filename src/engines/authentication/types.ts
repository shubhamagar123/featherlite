/**
 * Authentication Engine Types
 * Core types and interfaces for the authentication system
 */

// ==================== Enums ====================

export enum AuthenticationProvider {
  FIREBASE = 'FIREBASE',
  APPLE = 'APPLE',
  GOOGLE = 'GOOGLE',
  EMAIL = 'EMAIL',
  ANONYMOUS = 'ANONYMOUS',
  CUSTOM_JWT = 'CUSTOM_JWT',
}

export enum AuthenticationStatus {
  PENDING = 'PENDING',
  AUTHENTICATED = 'AUTHENTICATED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  FAILED = 'FAILED',
}

export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
  ID = 'ID',
}

export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  IDLE = 'IDLE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  SUSPENDED = 'SUSPENDED',
}

export enum PermissionType {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
}

// ==================== Interfaces ====================

export interface AuthenticationToken {
  id: string;
  type: TokenType;
  value: string;
  expiresAt: Date;
  createdAt: Date;
  provider: AuthenticationProvider;
  revoked: boolean;
  revokedAt?: Date;
}

export interface RefreshToken extends AuthenticationToken {
  rotationCount: number;
  lastRotatedAt: Date;
  ipAddress: string;
  userAgent: string;
}

export interface TokenPayload {
  userId: string;
  sessionId: string;
  deviceId: string;
  provider: AuthenticationProvider;
  roles: UserRole[];
  permissions: PermissionType[];
  iat: number;
  exp: number;
  correlationId: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  status: SessionStatus;
  accessToken: AuthenticationToken;
  refreshToken: RefreshToken;
  createdAt: Date;
  expiresAt: Date;
  lastActiveAt: Date;
  idleTimeoutAt: Date;
  correlationId: string;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  ipAddress: string;
  userAgent: string;
  deviceName: string;
  os: string;
  browser: string;
  appVersion?: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  type: 'MOBILE' | 'WEB' | 'TABLET' | 'DESKTOP' | 'OTHER';
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  appVersion?: string;
  registeredAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  roles: UserRole[];
  permissions: PermissionType[];
  providers: LinkedProvider[];
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  loginCount: number;
  metadata: UserMetadata;
}

export interface UserMetadata {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  photoUrl?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
  phoneVerified?: boolean;
  phoneVerifiedAt?: Date;
  twoFactorEnabled?: boolean;
  customFields?: Record<string, any>;
}

export interface LinkedProvider {
  provider: AuthenticationProvider;
  providerId: string;
  email?: string;
  displayName?: string;
  linkedAt: Date;
  isPrimary: boolean;
}

export interface AuthenticationContext {
  userId: string;
  sessionId: string;
  deviceId: string;
  roles: UserRole[];
  permissions: PermissionType[];
  correlationId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  provider: AuthenticationProvider;
}

export interface AuthenticationRequest {
  provider: AuthenticationProvider;
  credentials: Record<string, any>;
  deviceInfo: DeviceInfo;
  metadata?: Record<string, any>;
}

export interface DeviceInfo {
  name: string;
  type: 'MOBILE' | 'WEB' | 'TABLET' | 'DESKTOP' | 'OTHER';
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  appVersion?: string;
}

export interface AuthenticationResponse {
  status: AuthenticationStatus;
  user?: User;
  session?: Session;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: AuthenticationError;
}

export interface AuthenticationError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  provider: AuthenticationProvider;
  status: AuthenticationStatus;
  ipAddress: string;
  userAgent: string;
  correlationId: string;
  timestamp: Date;
  details: Record<string, any>;
}

export interface AuthenticationMetrics {
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  successRate: number;
  averageLoginTime: number;
  activeSessionCount: number;
  deviceCount: number;
  lastUpdated: Date;
}

export interface PermissionPolicy {
  id: string;
  role: UserRole;
  permissions: PermissionType[];
  resources: string[];
  conditions?: PolicyCondition[];
}

export interface PolicyCondition {
  type: 'TIME_BASED' | 'IP_BASED' | 'DEVICE_BASED' | 'CUSTOM';
  value: any;
}

export interface TokenRotationPolicy {
  enableRotation: boolean;
  rotationIntervalMinutes: number;
  maxTokenAge: number;
  reusableRefreshTokenWindow: number;
}

export interface RateLimitPolicy {
  loginAttemptsLimit: number;
  loginAttemptsWindow: number;
  tokenRefreshLimit: number;
  tokenRefreshWindow: number;
}

export interface SessionPolicy {
  accessTokenTTL: number;
  refreshTokenTTL: number;
  sessionIdleTimeout: number;
  maxConcurrentSessions: number;
  enableDeviceLimiting: boolean;
}

export interface AccountLinkingRequest {
  userId: string;
  targetProvider: AuthenticationProvider;
  targetProviderId: string;
  credentials: Record<string, any>;
}

export interface AnonymousUpgradeRequest {
  sessionId: string;
  provider: AuthenticationProvider;
  credentials: Record<string, any>;
}

export interface CachedAuthenticationData {
  key: string;
  value: any;
  expiresAt: Date;
  correlationId: string;
}

export interface FirebaseTokenPayload {
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  firebase: {
    identities: Record<string, string[]>;
    sign_in_provider: string;
  };
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

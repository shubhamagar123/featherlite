/**
 * Authentication Engine
 * Main orchestrator for authentication operations
 */

import {
  AuthenticationResponse,
  AuthenticationRequest,
  AuthenticationStatus,
  AuthenticationProvider,
  User,
  UserRole,
  Session,
  Device,
  PermissionType,
} from './types';
import { SessionManager } from './managers/session.manager';
import { TokenManager } from './managers/token.manager';
import { DeviceManager } from './managers/device.manager';
import { FirebaseTokenVerifier } from './security/firebase.verifier';
import { SessionRepository } from './repositories/session.repository';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class AuthenticationEngine {
  private logger = createLogger(this.constructor.name);
  private sessionManager: SessionManager;
  private tokenManager: TokenManager;
  private deviceManager: DeviceManager;
  private firebaseVerifier: FirebaseTokenVerifier;
  private users = new Map<string, User>();

  constructor() {
    const sessionRepo = new SessionRepository();
    this.tokenManager = new TokenManager();
    this.sessionManager = new SessionManager(sessionRepo, this.tokenManager);
    this.deviceManager = new DeviceManager();
    this.firebaseVerifier = new FirebaseTokenVerifier();
  }

  async authenticate(request: AuthenticationRequest): Promise<AuthenticationResponse> {
    const correlationId = uuidv4();

    try {
      this.logger.info(`Authentication initiated with provider: ${request.provider}`);

      let user: User | null = null;

      switch (request.provider) {
        case AuthenticationProvider.FIREBASE:
          user = await this.authenticateFirebase(request.credentials, correlationId);
          break;
        case AuthenticationProvider.ANONYMOUS:
          user = await this.authenticateAnonymous(correlationId);
          break;
        case AuthenticationProvider.EMAIL:
          user = await this.authenticateEmail(request.credentials, correlationId);
          break;
        default:
          return this.createErrorResponse(
            AuthenticationStatus.FAILED,
            'UNSUPPORTED_PROVIDER',
            `Provider ${request.provider} is not supported`
          );
      }

      if (!user) {
        return this.createErrorResponse(
          AuthenticationStatus.FAILED,
          'AUTHENTICATION_FAILED',
          'Authentication failed with provided credentials'
        );
      }

      // Register device
      const device = await this.deviceManager.registerDevice(
        user.id,
        request.deviceInfo,
        request.metadata
      );

      // Generate tokens
      const accessToken = await this.tokenManager.generateAccessToken(
        user.id,
        uuidv4(),
        device.id,
        request.provider,
        user.roles,
        user.permissions,
        correlationId
      );

      const refreshToken = await this.tokenManager.generateRefreshToken(
        user.id,
        accessToken.id,
        device.id,
        request.provider,
        request.metadata?.ipAddress || '',
        request.metadata?.userAgent || '',
        correlationId
      );

      // Create session
      const session = await this.sessionManager.createSession(
        user.id,
        device.id,
        accessToken,
        refreshToken,
        {
          ipAddress: request.metadata?.ipAddress || '',
          userAgent: request.metadata?.userAgent || '',
          deviceName: request.deviceInfo.name,
          os: request.deviceInfo.os,
          browser: request.deviceInfo.browser || '',
        },
        correlationId
      );

      // Update user login info
      user.lastLoginAt = new Date();
      user.loginCount++;
      this.users.set(user.id, user);

      this.logger.info(`User authenticated successfully: ${user.id}`);

      return {
        status: AuthenticationStatus.AUTHENTICATED,
        user,
        session,
        accessToken: accessToken.value,
        refreshToken: refreshToken.value,
        expiresIn: await this.tokenManager.getAccessTokenTTL(),
      };
    } catch (error) {
      this.logger.error(`Authentication error: ${error}`);
      return this.createErrorResponse(
        AuthenticationStatus.FAILED,
        'AUTHENTICATION_ERROR',
        String(error)
      );
    }
  }

  async refreshSession(sessionId: string, refreshTokenValue: string, correlationId: string): Promise<AuthenticationResponse> {
    try {
      const session = await this.sessionManager.getSession(sessionId);

      if (!session) {
        return this.createErrorResponse(
          AuthenticationStatus.FAILED,
          'SESSION_NOT_FOUND',
          'Session not found or expired'
        );
      }

      const payload = await this.tokenManager.validateRefreshToken(refreshTokenValue);

      if (!payload) {
        return this.createErrorResponse(
          AuthenticationStatus.FAILED,
          'INVALID_REFRESH_TOKEN',
          'Refresh token is invalid or expired'
        );
      }

      const user = this.users.get(payload.userId);

      if (!user) {
        return this.createErrorResponse(
          AuthenticationStatus.FAILED,
          'USER_NOT_FOUND',
          'User not found'
        );
      }

      // Generate new access token
      const newAccessToken = await this.tokenManager.generateAccessToken(
        user.id,
        session.id,
        session.deviceId,
        session.accessToken.provider,
        user.roles,
        user.permissions,
        correlationId
      );

      // Rotate refresh token
      const newRefreshToken = await this.tokenManager.rotateRefreshToken(
        session.refreshToken,
        session.id,
        session.deviceId,
        session.accessToken.provider,
        session.metadata.ipAddress,
        session.metadata.userAgent,
        correlationId
      );

      // Update session
      await this.sessionManager.rotateSessionToken(sessionId, newAccessToken);
      await this.sessionManager.updateSessionActivity(sessionId);

      this.logger.info(`Session refreshed: ${sessionId}`);

      return {
        status: AuthenticationStatus.AUTHENTICATED,
        user,
        session,
        accessToken: newAccessToken.value,
        refreshToken: newRefreshToken.value,
        expiresIn: await this.tokenManager.getAccessTokenTTL(),
      };
    } catch (error) {
      this.logger.error(`Session refresh error: ${error}`);
      return this.createErrorResponse(
        AuthenticationStatus.FAILED,
        'REFRESH_ERROR',
        String(error)
      );
    }
  }

  async logout(sessionId: string): Promise<boolean> {
    try {
      const session = await this.sessionManager.getSession(sessionId);

      if (!session) {
        return false;
      }

      await this.sessionManager.revokeSession(sessionId);
      this.logger.info(`User logged out: ${session.userId}`);

      return true;
    } catch (error) {
      this.logger.error(`Logout error: ${error}`);
      return false;
    }
  }

  async logoutAllDevices(userId: string): Promise<number> {
    try {
      const revokedCount = await this.sessionManager.revokeAllUserSessions(userId);
      this.logger.info(`All sessions revoked for user ${userId}: ${revokedCount}`);

      return revokedCount;
    } catch (error) {
      this.logger.error(`Logout all error: ${error}`);
      return 0;
    }
  }

  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return this.sessionManager.getUserSessions(userId);
  }

  async getUserDevices(userId: string): Promise<Device[]> {
    return this.deviceManager.getUserDevices(userId);
  }

  async removeDevice(deviceId: string): Promise<boolean> {
    return this.deviceManager.removeDevice(deviceId);
  }

  private async authenticateFirebase(credentials: Record<string, any>, _correlationId: string): Promise<User | null> {
    const token = credentials.token;

    if (!token) {
      throw new Error('Firebase token is required');
    }

    const payload = await this.firebaseVerifier.verifyToken(token);

    if (!payload) {
      return null;
    }

    let user = this.users.get(payload.user_id);

    if (!user) {
      user = {
        id: payload.user_id,
        email: payload.email,
        displayName: payload.name,
        roles: [UserRole.USER],
        permissions: [PermissionType.READ],
        providers: [
          {
            provider: AuthenticationProvider.FIREBASE,
            providerId: payload.user_id,
            email: payload.email,
            displayName: payload.name,
            linkedAt: new Date(),
            isPrimary: true,
          },
        ],
        isAnonymous: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        loginCount: 0,
        metadata: {
          emailVerified: payload.email_verified || false,
        },
      };

      this.users.set(user.id, user);
    }

    return user;
  }

  private async authenticateAnonymous(_correlationId: string): Promise<User | null> {
    const userId = `anon_${uuidv4()}`;

    const user: User = {
      id: userId,
      roles: [UserRole.GUEST],
      permissions: [PermissionType.READ],
      providers: [
        {
          provider: AuthenticationProvider.ANONYMOUS,
          providerId: userId,
          linkedAt: new Date(),
          isPrimary: true,
        },
      ],
      isAnonymous: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      loginCount: 1,
      metadata: {},
    };

    this.users.set(userId, user);
    return user;
  }

  private async authenticateEmail(credentials: Record<string, any>, _correlationId: string): Promise<User | null> {
    const email = credentials.email;
    const password = credentials.password;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    let user: User | null = null;
    for (const u of this.users.values()) {
      if (u.email === email) {
        user = u;
        break;
      }
    }

    if (!user) {
      user = {
        id: uuidv4(),
        email,
        roles: [UserRole.USER],
        permissions: [PermissionType.READ],
        providers: [
          {
            provider: AuthenticationProvider.EMAIL,
            providerId: email,
            email,
            linkedAt: new Date(),
            isPrimary: true,
          },
        ],
        isAnonymous: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        loginCount: 1,
        metadata: {
          emailVerified: true,
        },
      };

      this.users.set(user.id, user);
    }

    return user;
  }

  private createErrorResponse(
    status: AuthenticationStatus,
    code: string,
    message: string
  ): AuthenticationResponse {
    return {
      status,
      error: {
        code,
        message,
      },
    };
  }
}

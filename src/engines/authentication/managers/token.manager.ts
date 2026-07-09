/**
 * Token Manager
 * Manages token generation, validation, and rotation
 */

import jwt from 'jsonwebtoken';
import {
  AuthenticationToken,
  RefreshToken,
  TokenPayload,
  TokenType,
  AuthenticationProvider,
  UserRole,
  PermissionType,
} from '../types';
import { createLogger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class TokenManager {
  private logger = createLogger(this.constructor.name);
  private accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
  private refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
  private accessTokenTTL = 15 * 60; // 15 minutes
  private refreshTokenTTL = 7 * 24 * 60 * 60; // 7 days

  async generateAccessToken(
    userId: string,
    sessionId: string,
    deviceId: string,
    provider: AuthenticationProvider,
    roles: UserRole[],
    permissions: PermissionType[],
    correlationId: string
  ): Promise<AuthenticationToken> {
    const payload: TokenPayload = {
      userId,
      sessionId,
      deviceId,
      provider,
      roles,
      permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.accessTokenTTL,
      correlationId,
    };

    const token = jwt.sign(payload, this.accessTokenSecret, {
      algorithm: 'HS256',
      noTimestamp: true,
    });

    const expiresAt = new Date(Date.now() + this.accessTokenTTL * 1000);

    return {
      id: uuidv4(),
      type: TokenType.ACCESS,
      value: token,
      expiresAt,
      createdAt: new Date(),
      provider,
      revoked: false,
    };
  }

  async generateRefreshToken(
    userId: string,
    sessionId: string,
    deviceId: string,
    provider: AuthenticationProvider,
    ipAddress: string,
    userAgent: string,
    correlationId: string
  ): Promise<RefreshToken> {
    const payload: TokenPayload = {
      userId,
      sessionId,
      deviceId,
      provider,
      roles: [],
      permissions: [],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.refreshTokenTTL,
      correlationId,
    };

    const token = jwt.sign(payload, this.refreshTokenSecret, {
      algorithm: 'HS256',
      noTimestamp: true,
    });

    const expiresAt = new Date(Date.now() + this.refreshTokenTTL * 1000);

    return {
      id: uuidv4(),
      type: TokenType.REFRESH,
      value: token,
      expiresAt,
      createdAt: new Date(),
      provider,
      revoked: false,
      rotationCount: 0,
      lastRotatedAt: new Date(),
      ipAddress,
      userAgent,
    };
  }

  async validateAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        algorithms: ['HS256'],
      }) as TokenPayload;

      this.logger.debug(`Access token validated for user ${payload.userId}`);
      return payload;
    } catch (error) {
      this.logger.warn(`Access token validation failed: ${error}`);
      return null;
    }
  }

  async validateRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret, {
        algorithms: ['HS256'],
      }) as TokenPayload;

      this.logger.debug(`Refresh token validated for user ${payload.userId}`);
      return payload;
    } catch (error) {
      this.logger.warn(`Refresh token validation failed: ${error}`);
      return null;
    }
  }

  async decodeToken(token: string): Promise<any> {
    try {
      return jwt.decode(token);
    } catch (error) {
      this.logger.warn(`Token decode failed: ${error}`);
      return null;
    }
  }

  async isTokenExpired(token: AuthenticationToken): Promise<boolean> {
    return new Date() > token.expiresAt;
  }

  async rotateRefreshToken(
    refreshToken: RefreshToken,
    sessionId: string,
    deviceId: string,
    provider: AuthenticationProvider,
    ipAddress: string,
    userAgent: string,
    correlationId: string
  ): Promise<RefreshToken> {
    const payload = await this.validateRefreshToken(refreshToken.value);
    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    const newToken = await this.generateRefreshToken(
      payload.userId,
      sessionId,
      deviceId,
      provider,
      ipAddress,
      userAgent,
      correlationId
    );

    const rotatedToken: RefreshToken = {
      ...newToken,
      rotationCount: refreshToken.rotationCount + 1,
      lastRotatedAt: new Date(),
      ipAddress,
      userAgent,
    };

    this.logger.debug(
      `Refresh token rotated for user ${payload.userId}: rotation count ${rotatedToken.rotationCount}`
    );

    return rotatedToken;
  }

  async getAccessTokenTTL(): Promise<number> {
    return this.accessTokenTTL;
  }

  async getRefreshTokenTTL(): Promise<number> {
    return this.refreshTokenTTL;
  }
}

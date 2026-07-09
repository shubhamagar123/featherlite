/**
 * Socket Authentication
 * Handles JWT validation and authentication on socket connections
 */

import { SocketAuthPayload, SocketConnection } from '../types';
import { JWTValidator } from '@engines/authentication/security/jwt.validator';
import { createLogger } from '@utils/logger';

export class SocketAuthentication {
  private logger = createLogger(this.constructor.name);
  private jwtValidator: JWTValidator;

  constructor() {
    this.jwtValidator = new JWTValidator();
  }

  validateToken(token: string): SocketAuthPayload | null {
    try {
      const payload = this.jwtValidator.decodeToken(token);

      if (!payload || typeof payload !== 'object') {
        return null;
      }

      const typedPayload = payload as Record<string, any>;

      const authPayload: SocketAuthPayload = {
        userId: typedPayload.userId || typedPayload.sub,
        sessionId: typedPayload.sessionId,
        deviceId: typedPayload.deviceId,
        accessToken: token,
        timestamp: new Date(typedPayload.iat ? typedPayload.iat * 1000 : Date.now()),
      };

      if (!authPayload.userId || !authPayload.sessionId || !authPayload.deviceId) {
        this.logger.warn('Invalid token payload structure');
        return null;
      }

      return authPayload;
    } catch (error) {
      this.logger.error(`Token validation error: ${error}`);
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.jwtValidator.decodeToken(token) as Record<string, any>;

      if (!payload || typeof payload !== 'object') {
        return true;
      }

      const expiryTime = payload.exp ? payload.exp * 1000 : 0;
      return Date.now() >= expiryTime;
    } catch (_error) {
      return true;
    }
  }

  getTokenRemainingTime(token: string): number {
    try {
      const payload = this.jwtValidator.decodeToken(token) as Record<string, any>;

      if (!payload || typeof payload !== 'object') {
        return 0;
      }

      const expiryTime = payload.exp ? payload.exp * 1000 : 0;
      const remaining = expiryTime - Date.now();

      return remaining > 0 ? remaining : 0;
    } catch (_error) {
      return 0;
    }
  }

  authenticateConnection(
    connection: SocketConnection,
    token: string
  ): boolean {
    const payload = this.validateToken(token);

    if (!payload) {
      this.logger.warn(`Authentication failed for socket ${connection.socketId}`);
      return false;
    }

    if (payload.userId !== connection.userId) {
      this.logger.warn(
        `User mismatch for socket ${connection.socketId}: token has ${payload.userId}, connection has ${connection.userId}`
      );
      return false;
    }

    if (payload.sessionId !== connection.sessionId) {
      this.logger.warn(
        `Session mismatch for socket ${connection.socketId}`
      );
      return false;
    }

    if (payload.deviceId !== connection.deviceId) {
      this.logger.warn(
        `Device mismatch for socket ${connection.socketId}`
      );
      return false;
    }

    this.logger.debug(`Socket authenticated: ${connection.socketId}`);
    return true;
  }

  validateSocketConnection(
    connection: SocketConnection,
    authPayload: SocketAuthPayload
  ): boolean {
    if (connection.userId !== authPayload.userId) {
      return false;
    }

    if (connection.sessionId !== authPayload.sessionId) {
      return false;
    }

    if (connection.deviceId !== authPayload.deviceId) {
      return false;
    }

    return true;
  }

  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader) {
      return null;
    }

    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    if (authHeader.startsWith('bearer ')) {
      return authHeader.substring(7);
    }

    return authHeader;
  }

  extractTokenFromQuery(query: Record<string, any>): string | null {
    if (!query) {
      return null;
    }

    return query.token || query.accessToken || null;
  }
}

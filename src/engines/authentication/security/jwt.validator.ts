/**
 * JWT Validator
 * Validates JWT tokens and extracts claims
 */

import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types';
import { createLogger } from '@utils/logger';

export class JWTValidator {
  private logger = createLogger(this.constructor.name);
  private accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
  private refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';

  async validateAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        algorithms: ['HS256'],
      }) as TokenPayload;

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

      return payload;
    } catch (error) {
      this.logger.warn(`Refresh token validation failed: ${error}`);
      return null;
    }
  }

  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      this.logger.warn(`Token decode failed: ${error}`);
      return null;
    }
  }

  async isTokenExpired(token: string): Promise<boolean> {
    try {
      const payload = this.decodeToken(token);

      if (!payload || !payload.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (error) {
      return true;
    }
  }

  async getRemainingTime(token: string): Promise<number> {
    try {
      const payload = this.decodeToken(token);

      if (!payload || !payload.exp) {
        return 0;
      }

      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, payload.exp - now);
    } catch (error) {
      return 0;
    }
  }
}

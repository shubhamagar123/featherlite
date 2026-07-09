/**
 * Firebase Token Verifier
 * Verifies Firebase ID tokens and extracts payload
 */

import { FirebaseTokenPayload } from '../types';
import { createLogger } from '@utils/logger';

export class FirebaseTokenVerifier {
  private logger = createLogger(this.constructor.name);

  async verifyToken(token: string): Promise<FirebaseTokenPayload | null> {
    try {
      // In production, verify with Firebase Admin SDK
      // For now, we'll decode and validate basic structure

      const parts = token.split('.');

      if (parts.length !== 3) {
        this.logger.warn('Invalid token format');
        return null;
      }

      // Decode payload (middle part)
      const payload = this.decodeBase64Url(parts[1]);

      if (!payload) {
        this.logger.warn('Failed to decode token payload');
        return null;
      }

      const tokenPayload: FirebaseTokenPayload = JSON.parse(payload);

      // Validate token expiration
      const now = Math.floor(Date.now() / 1000);
      if (tokenPayload.exp < now) {
        this.logger.warn('Token is expired');
        return null;
      }

      // Validate basic structure
      if (!tokenPayload.user_id || !tokenPayload.aud) {
        this.logger.warn('Token missing required fields');
        return null;
      }

      this.logger.debug(`Firebase token verified for user ${tokenPayload.user_id}`);
      return tokenPayload;
    } catch (error) {
      this.logger.error(`Firebase token verification failed: ${error}`);
      return null;
    }
  }

  private decodeBase64Url(str: string): string | null {
    try {
      // Add padding if needed
      let output = str.replace(/-/g, '+').replace(/_/g, '/');
      const padding = 4 - (output.length % 4);

      if (padding !== 4) {
        output += '='.repeat(padding);
      }

      return Buffer.from(output, 'base64').toString('utf-8');
    } catch (error) {
      return null;
    }
  }
}

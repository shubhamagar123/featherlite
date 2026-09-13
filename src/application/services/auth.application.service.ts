import { ApplicationServiceBase } from './application.service.base';
import {
  ApplicationContext,
  AuthTokenDto,
  AuthUserDto,
} from '../dtos/application.dtos';
import {
  InvalidTokenException,
  ResourceNotFoundException,
} from '../exceptions/application.exceptions';
import { UnauthorizedError } from '@utils/error';
import { UserRepository } from '@database/repositories/user.repository';
import { getRedisClient } from '@infra/redis/redis.provider';
import { getDatabaseServices } from '@services/factory';
import { getAnonymousMemoryBufferService } from '@services/memory/anonymous-memory-buffer.service';
import { randomInt } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const OTP_TTL_SECONDS = 300; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;

interface StoredOtp {
  code: string;
  attempts: number;
}

/**
 * Auth Application Service
 * Orchestrates authentication use cases
 * IMPORTANT: Business logic layer
 * - Controllers call this service
 * - This service calls engines/repositories
 * - No business logic in controllers
 */
export class AuthApplicationService extends ApplicationServiceBase {
  private readonly userRepository: UserRepository;
  private readonly redis = getRedisClient();

  constructor() {
    super('AuthApplicationService');
    this.userRepository = new UserRepository();
  }

  /**
   * Exchange Firebase ID token for application token
   * Use Case: User logs in with Firebase token
   */
  async createSession(context: ApplicationContext): Promise<AuthTokenDto> {
    this.logStart('createSession', { userId: context.userId });

    try {
      // Verify user exists
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      // Create application session token
      const accessToken = this.generateAccessToken(context.userId, user);
      const refreshToken = this.generateRefreshToken(context.userId);

      // Store refresh token in Redis
      await this.redis.setex(
        `auth:refresh:${context.userId}`,
        7 * 24 * 60 * 60, // 7 days
        refreshToken
      );

      // Mark session as active
      await this.redis.setex(`auth:session:${context.userId}`, 24 * 60 * 60, 'ACTIVE');

      this.logSuccess('createSession', { userId: context.userId });

      return {
        accessToken,
        refreshToken,
        expiresIn: 3600, // 1 hour
        tokenType: 'Bearer',
      };
    } catch (error) {
      this.logError('createSession', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * Use Case: Token refresh
   */
  async refreshToken(context: ApplicationContext, refreshToken: string): Promise<AuthTokenDto> {
    this.logStart('refreshToken', { userId: context.userId });

    try {
      // Verify refresh token
      const storedToken = await this.redis.get(`auth:refresh:${context.userId}`);
      if (storedToken !== refreshToken) {
        throw new InvalidTokenException('Invalid refresh token');
      }

      // Get user
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(context.userId, user);

      this.logSuccess('refreshToken', { userId: context.userId });

      return {
        accessToken: newAccessToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    } catch (error) {
      this.logError('refreshToken', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Invalidate user session (logout)
   * Use Case: User logout
   */
  async logout(context: ApplicationContext): Promise<void> {
    this.logStart('logout', { userId: context.userId });

    try {
      // Mark session as invalidated in Redis
      await this.redis.setex(`auth:session:${context.userId}`, 1, 'INVALIDATED');

      // Delete refresh token
      await this.redis.del(`auth:refresh:${context.userId}`);

      this.logSuccess('logout', { userId: context.userId });
    } catch (error) {
      this.logError('logout', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Get current user profile
   * Use Case: Fetch own profile
   */
  async getCurrentUser(context: ApplicationContext): Promise<AuthUserDto> {
    this.logStart('getCurrentUser', { userId: context.userId });

    try {
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      this.logSuccess('getCurrentUser', { userId: context.userId });

      return {
        id: user.id,
        uid: user.firebaseUid || '',
        email: user.email,
        roles: context.userRoles,
        customClaims: {
          roles: context.userRoles,
        },
      };
    } catch (error) {
      this.logError('getCurrentUser', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Verify session is still valid
   * Use Case: Middleware check
   */
  async verifySession(userId: string): Promise<boolean> {
    try {
      const status = await this.redis.get(`auth:session:${userId}`);

      // Session invalidated or not found = invalid
      if (!status || status === 'INVALIDATED') {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error({ error }, 'Error verifying session');
      return false;
    }
  }

  /**
   * Request an OTP code for phone/email login.
   * Use Case: Passwordless sign-in/sign-up — the client will not present a
   * password field, matching the product's phone/email + OTP flow.
   *
   * Delivery is stubbed: no SMS/email provider is wired up yet, so the code
   * is only logged (dev/local use). Swapping in a real provider only touches
   * this method.
   */
  async requestOtpCode(identifier: string): Promise<{ expiresInSeconds: number }> {
    const masked = this.maskIdentifier(identifier);
    this.logStart('requestOtpCode', { identifier: masked });

    try {
      const code = String(randomInt(100000, 1000000));
      const stored: StoredOtp = { code, attempts: 0 };
      await this.redis.setex(this.otpKey(identifier), OTP_TTL_SECONDS, JSON.stringify(stored));

      // Stub delivery — logged only, never actually sent.
      this.logger.info({ identifier: masked, code }, 'OTP code issued (stub delivery)');

      this.logSuccess('requestOtpCode', { identifier: masked });
      return { expiresInSeconds: OTP_TTL_SECONDS };
    } catch (error) {
      this.logError('requestOtpCode', error, { identifier: masked });
      throw error;
    }
  }

  /**
   * Verify an OTP code and issue a session — no password anywhere in this
   * flow. On success, finds or creates the User by phone/email and returns
   * the same AuthTokenDto shape as createSession().
   *
   * `sessionKey`, when provided, identifies an anonymous (pre-auth)
   * conversation whose memory candidates were buffered rather than
   * discarded — see AnonymousMemoryBufferService. Flushing is best-effort:
   * a flush failure must not fail sign-in.
   */
  async verifyOtpCode(identifier: string, code: string, sessionKey?: string): Promise<AuthTokenDto> {
    const masked = this.maskIdentifier(identifier);
    this.logStart('verifyOtpCode', { identifier: masked });

    try {
      const key = this.otpKey(identifier);
      const raw = await this.redis.get(key);
      if (!raw) {
        throw new UnauthorizedError('Code expired or was never requested');
      }

      const stored = JSON.parse(raw) as StoredOtp;
      if (stored.attempts >= MAX_OTP_ATTEMPTS) {
        await this.redis.del(key);
        throw new UnauthorizedError('Too many incorrect attempts; request a new code');
      }

      if (stored.code !== code) {
        const updated: StoredOtp = { ...stored, attempts: stored.attempts + 1 };
        await this.redis.setex(key, OTP_TTL_SECONDS, JSON.stringify(updated));
        throw new UnauthorizedError('Incorrect code');
      }

      // Single-use: the code is consumed now that it has verified.
      await this.redis.del(key);

      const user = await this.findOrCreateUserByIdentifier(identifier);
      const accessToken = this.generateAccessToken(user.id, user);
      const refreshToken = this.generateRefreshToken(user.id);

      await this.redis.setex(`auth:refresh:${user.id}`, 7 * 24 * 60 * 60, refreshToken);
      await this.redis.setex(`auth:session:${user.id}`, 24 * 60 * 60, 'ACTIVE');

      if (sessionKey) {
        try {
          const services = getDatabaseServices();
          const flushed = await getAnonymousMemoryBufferService(services.memoryService).flush(
            sessionKey,
            user.id
          );
          if (flushed > 0) {
            this.logger.info({ userId: user.id, sessionKey, flushed }, 'Flushed buffered memory candidates on sign-in');
          }
        } catch (flushError) {
          // Best-effort: a buffer flush must never fail the sign-in itself.
          this.logger.error({ error: flushError, userId: user.id, sessionKey }, 'Failed to flush anonymous memory buffer');
        }
      }

      this.logSuccess('verifyOtpCode', { userId: user.id });

      return {
        accessToken,
        refreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
      };
    } catch (error) {
      this.logError('verifyOtpCode', error, { identifier: masked });
      throw error;
    }
  }

  /**
   * Find the user by phone or email, creating one if this is their first
   * sign-in. `email` is a required, unique column on User, so phone-only
   * sign-ups get a placeholder local-only address — this is a known
   * simplification of the scaffold, not a real email.
   */
  private async findOrCreateUserByIdentifier(identifier: string) {
    const isEmail = identifier.includes('@');
    const existing = isEmail
      ? await this.userRepository.findByEmail(identifier)
      : await this.userRepository.findByPhoneNumber(identifier);
    if (existing) return existing;

    const username = `user_${uuidv4().slice(0, 8)}`;
    return this.userRepository.create({
      email: isEmail ? identifier : `${username}@otp.featherlight.local`,
      username,
      phoneNumber: isEmail ? undefined : identifier,
    } as any);
  }

  private otpKey(identifier: string): string {
    return `otp:${identifier}`;
  }

  /** Never log a full phone number or email — keep the middle masked. */
  private maskIdentifier(identifier: string): string {
    if (identifier.length <= 4) return '***';
    return `${identifier.slice(0, 2)}***${identifier.slice(-2)}`;
  }

  /**
   * Generate access token
   * Internal: Creates JWT or session token
   */
  private generateAccessToken(userId: string, user: any): string {
    // In production, use JWT or similar
    // For now, return simple token
    return Buffer.from(
      JSON.stringify({
        userId,
        email: user.email,
        iat: Date.now(),
        exp: Date.now() + 3600000,
      })
    ).toString('base64');
  }

  /**
   * Generate refresh token
   * Internal: Creates long-lived refresh token
   */
  private generateRefreshToken(userId: string): string {
    return Buffer.from(
      JSON.stringify({
        userId,
        iat: Date.now(),
        type: 'refresh',
      })
    ).toString('base64');
  }
}

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
import { UserRepository } from '@database/repositories/user.repository';
import { getRedisClient } from '@infra/redis/redis.provider';

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

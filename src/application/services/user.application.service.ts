import { ApplicationServiceBase } from './application.service.base';
import {
  ApplicationContext,
  UpdateUserDto,
  UserResponseDto,
} from '../dtos/application.dtos';
import { ResourceNotFoundException } from '../exceptions/application.exceptions';
import { UserRepository } from '@database/repositories/user.repository';

/**
 * User Application Service
 * Orchestrates user profile and settings operations
 * IMPORTANT: Business logic layer
 * - Controllers call this service
 * - This service calls engines/repositories
 * - No business logic in controllers
 */
export class UserApplicationService extends ApplicationServiceBase {
  private readonly userRepository: UserRepository;

  constructor() {
    super('UserApplicationService');
    this.userRepository = new UserRepository();
  }

  /**
   * Get current user profile
   * Use Case: Fetch user details
   */
  async getProfile(context: ApplicationContext): Promise<UserResponseDto> {
    this.logStart('getProfile', { userId: context.userId });

    try {
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      this.logSuccess('getProfile', { userId: context.userId });

      return {
        id: user.id,
        email: user.email,
        name: user.username,
        avatar: user.avatar,
        bio: user.bio,
        emailVerified: false,
        roles: context.userRoles,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      this.logError('getProfile', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Update user profile
   * Use Case: Modify user settings
   */
  async updateProfile(
    context: ApplicationContext,
    data: UpdateUserDto
  ): Promise<UserResponseDto> {
    this.logStart('updateProfile', { userId: context.userId });

    try {
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      // Update user fields
      const updateData: any = {};
      if (data.name) updateData.username = data.name;
      if (data.avatar) updateData.avatar = data.avatar;
      if (data.bio) updateData.bio = data.bio;

      const updated = await this.userRepository.update(context.userId, updateData);

      this.logSuccess('updateProfile', { userId: context.userId });

      return {
        id: updated.id,
        email: updated.email,
        name: updated.username,
        avatar: updated.avatar,
        bio: updated.bio,
        emailVerified: false,
        roles: context.userRoles,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      this.logError('updateProfile', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Get user preferences
   * Use Case: Fetch user settings
   */
  async getPreferences(
    context: ApplicationContext
  ): Promise<Record<string, unknown>> {
    this.logStart('getPreferences', { userId: context.userId });

    try {
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      this.logSuccess('getPreferences', { userId: context.userId });

      return {
        language: user.preferredLanguage || 'en',
        timezone: user.timezone || 'UTC',
        notificationsEnabled: user.notificationsEnabled,
        emailNotificationsEnabled: user.emailNotificationsEnabled,
        pushNotificationsEnabled: user.pushNotificationsEnabled,
        privacyLevel: user.privacyLevel || 'friends',
      };
    } catch (error) {
      this.logError('getPreferences', error, { userId: context.userId });
      throw error;
    }
  }

  /**
   * Update user preferences
   * Use Case: Modify settings
   */
  async updatePreferences(
    context: ApplicationContext,
    preferences: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.logStart('updatePreferences', { userId: context.userId });

    try {
      const user = await this.userRepository.findById(context.userId);
      if (!user) {
        throw new ResourceNotFoundException('User', context.userId);
      }

      const updateData: any = {};
      if (typeof preferences.language === 'string') {
        updateData.preferredLanguage = preferences.language;
      }
      if (typeof preferences.timezone === 'string') {
        updateData.timezone = preferences.timezone;
      }
      if (typeof preferences.notificationsEnabled === 'boolean') {
        updateData.notificationsEnabled = preferences.notificationsEnabled;
      }
      if (typeof preferences.emailNotificationsEnabled === 'boolean') {
        updateData.emailNotificationsEnabled = preferences.emailNotificationsEnabled;
      }
      if (typeof preferences.pushNotificationsEnabled === 'boolean') {
        updateData.pushNotificationsEnabled = preferences.pushNotificationsEnabled;
      }
      if (typeof preferences.privacyLevel === 'string') {
        updateData.privacyLevel = preferences.privacyLevel;
      }

      await this.userRepository.update(context.userId, updateData);

      this.logSuccess('updatePreferences', { userId: context.userId });

      return this.getPreferences(context);
    } catch (error) {
      this.logError('updatePreferences', error, { userId: context.userId });
      throw error;
    }
  }
}

import { ApplicationServiceBase } from './application.service.base';
import {
  ApplicationContext,
  UpdateUserDto,
  UserResponseDto,
} from '../dtos/application.dtos';
import { ResourceNotFoundException } from '../exceptions/application.exceptions';
import { UserRepository } from '@database/repositories/user.repository';
import { MemoryRepository } from '@database/repositories/memory.repository';

export interface UserMeDto {
  signedIn: true;
  activeCompanion: string;
  addressTerm: string | null;
  memoryCount: number;
  accountCreatedAt: Date;
}

export interface UpdateUserMeInput {
  activeCompanion?: string;
  addressTerm?: string;
}

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
  private readonly memoryRepository: MemoryRepository;

  constructor() {
    super('UserApplicationService');
    this.userRepository = new UserRepository();
    this.memoryRepository = new MemoryRepository();
  }

  /**
   * GET /v1/users/me — signed-in status, active companion, address term,
   * memory count, account creation date. Backs the delete-confirmation
   * screen's stats strip.
   */
  async getMe(context: ApplicationContext): Promise<UserMeDto> {
    this.logStart('getMe', { userId: context.userId });

    const user = await this.userRepository.findById(context.userId);
    if (!user) {
      throw new ResourceNotFoundException('User', context.userId);
    }

    const memoryCount = await this.memoryRepository.countByUserId(context.userId);

    this.logSuccess('getMe', { userId: context.userId });
    return {
      signedIn: true,
      activeCompanion: user.activeCompanion,
      addressTerm: user.addressTerm,
      memoryCount,
      accountCreatedAt: user.createdAt,
    };
  }

  /** PATCH /v1/users/me — update active_companion and/or address_term. */
  async updateMe(context: ApplicationContext, patch: UpdateUserMeInput): Promise<UserMeDto> {
    this.logStart('updateMe', { userId: context.userId });

    const existing = await this.userRepository.findById(context.userId);
    if (!existing) {
      throw new ResourceNotFoundException('User', context.userId);
    }

    await this.userRepository.update(context.userId, {
      activeCompanion: patch.activeCompanion,
      addressTerm: patch.addressTerm,
    } as any);

    this.logSuccess('updateMe', { userId: context.userId });
    return this.getMe(context);
  }

  /**
   * DELETE /v1/users/me — hard-deletes the account. Every dependent table
   * (Companion, Conversation, Memory, Moment, Notification, PlannerEvent,
   * NudgePreference, etc.) has `onDelete: Cascade` back to User in the
   * schema, so a single row delete here cascades everything — this is a
   * real hard delete, not the soft delete used for a single memory.
   */
  async deleteMe(context: ApplicationContext): Promise<void> {
    this.logStart('deleteMe', { userId: context.userId });

    const existing = await this.userRepository.findById(context.userId);
    if (!existing) {
      throw new ResourceNotFoundException('User', context.userId);
    }

    await this.userRepository.hardDelete(context.userId);
    this.logSuccess('deleteMe', { userId: context.userId });
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

import { BaseService } from '../base/base.service';
import { IUserService } from './user.service.interface';
import { IResult, Result } from '../types/result.type';
import { UserRepository } from '@database/repositories/user.repository';
import {
  CreateUserDTO,
  UpdateUserProfileDTO,
  UpdateUserSettingsDTO,
  UserDTO,
  UserProfileDTO,
  UserSettingsDTO,
} from '../dtos/user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { InputValidator } from '../validators/input.validators';
import {
  ValidationException,
  NotFoundError,
  DuplicateResourceError,
} from '../exceptions';

export class UserService extends BaseService implements IUserService {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  async createUser(dto: CreateUserDTO): Promise<IResult<UserDTO>> {
    try {
      // Validate inputs
      InputValidator.requireValidEmail(dto.email, 'email');
      InputValidator.requireValidUsername(dto.username, 'username');

      // Check for duplicates
      const emailExists = await this.userRepository.existsByEmail(dto.email);
      if (emailExists) {
        throw new DuplicateResourceError('User', 'email', dto.email);
      }

      const usernameExists = await this.userRepository.existsByUsername(dto.username);
      if (usernameExists) {
        throw new DuplicateResourceError('User', 'username', dto.username);
      }

      // Create user
      const user = await this.userRepository.create({
        email: dto.email,
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || 'USER',
        status: 'ACTIVE',
      });

      this.logBusinessEvent('user_created', { userId: user.id, email: user.email });

      return Result.success(UserMapper.toDTO(user));
    } catch (error) {
      if (error instanceof ValidationException || error instanceof DuplicateResourceError) {
        return Result.failure(error);
      }

      this.logError(error as Error, 'Failed to create user');
      return Result.failure(
        new Error('Failed to create user: ' + (error instanceof Error ? error.message : String(error)))
      );
    }
  }

  async getUserById(userId: string): Promise<IResult<UserDTO>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Result.failure(new NotFoundError('User', userId));
      }

      return Result.success(UserMapper.toDTO(user));
    } catch (error) {
      if (error instanceof ValidationException || error instanceof NotFoundError) {
        return Result.failure(error);
      }

      this.logError(error as Error, 'Failed to get user');
      return Result.failure(new Error('Failed to get user'));
    }
  }

  async getUserByEmail(email: string): Promise<IResult<UserDTO>> {
    try {
      InputValidator.requireValidEmail(email, 'email');

      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return Result.failure(new NotFoundError('User', `email: ${email}`));
      }

      return Result.success(UserMapper.toDTO(user));
    } catch (error) {
      if (error instanceof ValidationException || error instanceof NotFoundError) {
        return Result.failure(error);
      }

      this.logError(error as Error, 'Failed to get user by email');
      return Result.failure(new Error('Failed to get user by email'));
    }
  }

  async getUserByUsername(username: string): Promise<IResult<UserDTO>> {
    try {
      InputValidator.requireValidUsername(username, 'username');

      const user = await this.userRepository.findByUsername(username);
      if (!user) {
        return Result.failure(new NotFoundError('User', `username: ${username}`));
      }

      return Result.success(UserMapper.toDTO(user));
    } catch (error) {
      if (error instanceof ValidationException || error instanceof NotFoundError) {
        return Result.failure(error);
      }

      this.logError(error as Error, 'Failed to get user by username');
      return Result.failure(new Error('Failed to get user by username'));
    }
  }

  async getUserProfile(userId: string): Promise<IResult<UserProfileDTO>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Result.failure(new NotFoundError('User', userId));
      }

      return Result.success(UserMapper.toProfileDTO(user));
    } catch (error) {
      if (error instanceof ValidationException || error instanceof NotFoundError) {
        return Result.failure(error);
      }

      this.logError(error as Error, 'Failed to get user profile');
      return Result.failure(new Error('Failed to get user profile'));
    }
  }

  async updateUserProfile(userId: string, dto: UpdateUserProfileDTO): Promise<IResult<UserDTO>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');

      // Validate optional fields
      if (dto.firstName !== undefined && dto.firstName.length > 100) {
        throw new ValidationException('firstName must be at most 100 characters', 'firstName');
      }

      if (dto.lastName !== undefined && dto.lastName.length > 100) {
        throw new ValidationException('lastName must be at most 100 characters', 'lastName');
      }

      const user = await this.userRepository.update(userId, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatar: dto.avatar,
        bio: dto.bio,
      });

      this.logBusinessEvent('user_profile_updated', { userId });

      return Result.success(UserMapper.toDTO(user));
    } catch (error) {
      if (error instanceof ValidationException) {
        return Result.failure(error);
      }

      if (error instanceof Error && error.message.includes('not found')) {
        return Result.failure(new NotFoundError('User', userId));
      }

      this.logError(error as Error, 'Failed to update user profile');
      return Result.failure(new Error('Failed to update user profile'));
    }
  }

  async getUserSettings(userId: string): Promise<IResult<UserSettingsDTO>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Result.failure(new NotFoundError('User', userId));
      }

      return Result.success(UserMapper.toSettingsDTO(user));
    } catch (error) {
      if (error instanceof ValidationException || error instanceof NotFoundError) {
        return Result.failure(error);
      }

      this.logError(error as Error, 'Failed to get user settings');
      return Result.failure(new Error('Failed to get user settings'));
    }
  }

  async updateUserSettings(userId: string, dto: UpdateUserSettingsDTO): Promise<IResult<UserSettingsDTO>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');

      const user = await this.userRepository.update(userId, {
        preferredLanguage: dto.preferredLanguage,
        timezone: dto.timezone,
        notificationsEnabled: dto.notificationsEnabled,
        emailNotificationsEnabled: dto.emailNotificationsEnabled,
        pushNotificationsEnabled: dto.pushNotificationsEnabled,
        privacyLevel: dto.privacyLevel,
      });

      this.logBusinessEvent('user_settings_updated', { userId });

      return Result.success(UserMapper.toSettingsDTO(user));
    } catch (error) {
      if (error instanceof ValidationException) {
        return Result.failure(error);
      }

      if (error instanceof Error && error.message.includes('not found')) {
        return Result.failure(new NotFoundError('User', userId));
      }

      this.logError(error as Error, 'Failed to update user settings');
      return Result.failure(new Error('Failed to update user settings'));
    }
  }

  async getActiveUsers(limit: number = 100): Promise<IResult<UserDTO[]>> {
    try {
      InputValidator.requirePositive(limit, 'limit');

      const users = await this.userRepository.findActive({ take: limit });

      return Result.success(UserMapper.toDTOArray(users));
    } catch (error) {
      if (error instanceof ValidationException) {
        return Result.failure(error);
      }

      this.logError(error as Error, 'Failed to get active users');
      return Result.failure(new Error('Failed to get active users'));
    }
  }

  async getUsersByRole(role: string, limit: number = 100): Promise<IResult<UserDTO[]>> {
    try {
      InputValidator.requireNotEmpty(role, 'role');
      InputValidator.requirePositive(limit, 'limit');

      const users = await this.userRepository.findByRole(role, { take: limit });

      return Result.success(UserMapper.toDTOArray(users));
    } catch (error) {
      if (error instanceof ValidationException) {
        return Result.failure(error);
      }

      this.logError(error as Error, 'Failed to get users by role');
      return Result.failure(new Error('Failed to get users by role'));
    }
  }

  async softDeleteUser(userId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');

      await this.userRepository.softDelete(userId);

      this.logBusinessEvent('user_soft_deleted', { userId });

      return Result.success(undefined);
    } catch (error) {
      if (error instanceof ValidationException) {
        return Result.failure(error);
      }

      this.logError(error as Error, 'Failed to soft delete user');
      return Result.failure(new Error('Failed to soft delete user'));
    }
  }

  async restoreUser(userId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');

      await this.userRepository.restore(userId);

      this.logBusinessEvent('user_restored', { userId });

      return Result.success(undefined);
    } catch (error) {
      if (error instanceof ValidationException) {
        return Result.failure(error);
      }

      this.logError(error as Error, 'Failed to restore user');
      return Result.failure(new Error('Failed to restore user'));
    }
  }

  async updateLastLogin(userId: string): Promise<IResult<void>> {
    try {
      InputValidator.requireValidUUID(userId, 'userId');

      await this.userRepository.updateLastLogin(userId);

      return Result.success(undefined);
    } catch (error) {
      if (error instanceof ValidationException) {
        return Result.failure(error);
      }

      this.logError(error as Error, 'Failed to update last login');
      return Result.failure(new Error('Failed to update last login'));
    }
  }

  async emailExists(email: string): Promise<boolean> {
    try {
      InputValidator.requireValidEmail(email, 'email');
      return await this.userRepository.existsByEmail(email);
    } catch (error) {
      this.logError(error as Error, 'Error checking if email exists');
      return false;
    }
  }

  async usernameExists(username: string): Promise<boolean> {
    try {
      InputValidator.requireValidUsername(username, 'username');
      return await this.userRepository.existsByUsername(username);
    } catch (error) {
      this.logError(error as Error, 'Error checking if username exists');
      return false;
    }
  }
}

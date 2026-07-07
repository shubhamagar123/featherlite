import { User } from '@prisma/client';
import { UserDTO, UserProfileDTO, UserSettingsDTO } from '../dtos/user.dto';

export class UserMapper {
  static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      avatar: user.avatar || undefined,
      bio: user.bio || undefined,
      role: user.role,
      status: user.status,
      preferredLanguage: user.preferredLanguage,
      timezone: user.timezone || undefined,
      privacyLevel: user.privacyLevel,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt || undefined,
    };
  }

  static toProfileDTO(user: User): UserProfileDTO {
    return {
      ...this.toDTO(user),
      notificationsEnabled: user.notificationsEnabled,
      emailNotificationsEnabled: user.emailNotificationsEnabled,
      pushNotificationsEnabled: user.pushNotificationsEnabled,
    };
  }

  static toSettingsDTO(user: User): UserSettingsDTO {
    return {
      preferredLanguage: user.preferredLanguage,
      timezone: user.timezone || undefined,
      notificationsEnabled: user.notificationsEnabled,
      emailNotificationsEnabled: user.emailNotificationsEnabled,
      pushNotificationsEnabled: user.pushNotificationsEnabled,
      privacyLevel: user.privacyLevel,
    };
  }

  static toDTOArray(users: User[]): UserDTO[] {
    return users.map((user) => this.toDTO(user));
  }
}

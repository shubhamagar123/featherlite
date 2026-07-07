// Create/Update DTOs
export interface CreateUserDTO {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role?: 'USER' | 'ADMIN' | 'MODERATOR';
}

export interface UpdateUserProfileDTO {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
}

export interface UpdateUserSettingsDTO {
  preferredLanguage?: string;
  timezone?: string;
  notificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  privacyLevel?: 'public' | 'friends' | 'private';
}

// Response DTOs
export interface UserDTO {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  role: string;
  status: string;
  preferredLanguage: string;
  timezone?: string;
  privacyLevel: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserProfileDTO extends UserDTO {
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
}

export interface UserSettingsDTO {
  preferredLanguage: string;
  timezone?: string;
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  privacyLevel: string;
}

export interface UserWithCompanionsDTO extends UserDTO {
  companionCount: number;
  activeCompanionCount: number;
}

export interface UserWithRelationshipsDTO extends UserDTO {
  relationshipCount: number;
  activeRelationshipCount: number;
}

import { IResult } from '../types/result.type';
import {
  CreateUserDTO,
  UpdateUserProfileDTO,
  UpdateUserSettingsDTO,
  UserDTO,
  UserProfileDTO,
  UserSettingsDTO,
} from '../dtos/user.dto';

export interface IUserService {
  // Create & Retrieve
  createUser(dto: CreateUserDTO): Promise<IResult<UserDTO>>;
  getUserById(userId: string): Promise<IResult<UserDTO>>;
  getUserByEmail(email: string): Promise<IResult<UserDTO>>;
  getUserByUsername(username: string): Promise<IResult<UserDTO>>;

  // Profile Management
  getUserProfile(userId: string): Promise<IResult<UserProfileDTO>>;
  updateUserProfile(userId: string, dto: UpdateUserProfileDTO): Promise<IResult<UserDTO>>;

  // Settings Management
  getUserSettings(userId: string): Promise<IResult<UserSettingsDTO>>;
  updateUserSettings(userId: string, dto: UpdateUserSettingsDTO): Promise<IResult<UserSettingsDTO>>;

  // Active Users
  getActiveUsers(limit?: number): Promise<IResult<UserDTO[]>>;
  getUsersByRole(role: string, limit?: number): Promise<IResult<UserDTO[]>>;

  // Soft Delete & Restore
  softDeleteUser(userId: string): Promise<IResult<void>>;
  restoreUser(userId: string): Promise<IResult<void>>;

  // Tracking
  updateLastLogin(userId: string): Promise<IResult<void>>;

  // Checks
  emailExists(email: string): Promise<boolean>;
  usernameExists(username: string): Promise<boolean>;
}

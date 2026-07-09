/**
 * User Test Factory
 * Generates test user data
 */

import { PrismaClient, User, UserRole, UserStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

export class UserFactory {
  constructor(private db: PrismaClient) {}

  /**
   * Create a test user
   */
  async create(overrides?: Partial<User>): Promise<User> {
    const defaultData = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      username: faker.internet.username(),
      firebaseUid: `firebase-${faker.string.uuid()}`,
      passwordHash: null,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      avatar: faker.image.avatar(),
      bio: faker.person.bio(),
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      preferredLanguage: 'en',
      timezone: 'UTC',
      notificationsEnabled: true,
      emailNotificationsEnabled: true,
      pushNotificationsEnabled: true,
      privacyLevel: 'friends',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      lastLoginAt: null,
    };

    return this.db.user.create({
      data: {
        ...defaultData,
        ...overrides,
      },
    });
  }

  /**
   * Create multiple test users
   */
  async createMany(count: number, overrides?: Partial<User>): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.create(overrides));
    }
    return users;
  }

  /**
   * Create an admin user
   */
  async createAdmin(overrides?: Partial<User>): Promise<User> {
    return this.create({
      role: UserRole.ADMIN,
      ...overrides,
    });
  }
}

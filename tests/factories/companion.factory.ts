/**
 * Companion Test Factory
 * Generates test companion data
 */

import { PrismaClient, Companion, CompanionStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

export class CompanionFactory {
  constructor(private db: PrismaClient) {}

  /**
   * Create a test companion
   */
  async create(userId: string, overrides?: Partial<Companion>): Promise<Companion> {
    const defaultData = {
      id: faker.string.uuid(),
      userId,
      name: faker.person.fullName(),
      description: faker.lorem.sentence(),
      personality: faker.lorem.word(),
      avatar: faker.image.avatar(),
      status: CompanionStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    return this.db.companion.create({
      data: {
        ...defaultData,
        ...overrides,
      },
    });
  }

  /**
   * Create multiple test companions
   */
  async createMany(userId: string, count: number, overrides?: Partial<Companion>): Promise<Companion[]> {
    const companions: Companion[] = [];
    for (let i = 0; i < count; i++) {
      companions.push(await this.create(userId, overrides));
    }
    return companions;
  }
}

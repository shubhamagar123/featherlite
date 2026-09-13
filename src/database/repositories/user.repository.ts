import { User, Prisma } from '@prisma/client';
import { BaseRepository, FindManyOptions } from '../repository.base';
import { prisma } from '../prisma';

type UserCreateInput = Prisma.UserCreateInput;
type UserUpdateInput = Prisma.UserUpdateInput;

export class UserRepository extends BaseRepository<User, UserCreateInput, UserUpdateInput> {
  protected getDelegate() {
    return prisma.user;
  }

  protected getModelName(): string {
    return 'User';
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ username });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.findOne({ firebaseUid });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.findOne({ phoneNumber });
  }

  async findActive(options?: FindManyOptions): Promise<User[]> {
    return this.findMany({ status: 'ACTIVE' }, options);
  }

  async findInactive(options?: FindManyOptions): Promise<User[]> {
    return this.findMany({ status: 'INACTIVE' }, options);
  }

  async findSuspended(options?: FindManyOptions): Promise<User[]> {
    return this.findMany({ status: 'SUSPENDED' }, options);
  }

  async findByRole(role: string, options?: FindManyOptions): Promise<User[]> {
    return this.findMany({ role }, options);
  }

  async findCreatedAfter(date: Date, options?: FindManyOptions): Promise<User[]> {
    return this.findMany({ createdAt: { gte: date } }, options);
  }

  async findLastLoginAfter(date: Date, options?: FindManyOptions): Promise<User[]> {
    return this.findMany({ lastLoginAt: { gte: date } }, options);
  }

  async updateLastLogin(userId: string): Promise<User> {
    return this.update(userId, { lastLoginAt: new Date() });
  }

  async findWithCompanions(userId: string): Promise<(User & { companions: any[] }) | null> {
    try {
      const where = { id: userId, deletedAt: null };
      return (await prisma.user.findUnique({
        where: where as any,
        include: { companions: { where: { deletedAt: null } } },
      })) as any;
    } catch (error) {
      throw error;
    }
  }

  async findWithRelationships(userId: string): Promise<(User & { relationships: any[] }) | null> {
    try {
      const where = { id: userId, deletedAt: null };
      return (await prisma.user.findUnique({
        where: where as any,
        include: { relationships: { where: { deletedAt: null } } },
      })) as any;
    } catch (error) {
      throw error;
    }
  }

  async countByStatus(status: string): Promise<number> {
    return this.count({ status });
  }

  async countActive(): Promise<number> {
    return this.countByStatus('ACTIVE');
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.exists({ email });
  }

  async existsByUsername(username: string): Promise<boolean> {
    return this.exists({ username });
  }

  async existsByFirebaseUid(firebaseUid: string): Promise<boolean> {
    return this.exists({ firebaseUid });
  }
}

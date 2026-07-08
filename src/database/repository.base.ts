import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { logger } from '@utils/logger';

const repoLogger = logger.child({ module: 'repository' });

/** Maximum rows a single findMany call may return, regardless of what the caller asks. */
const PAGINATION_MAX_TAKE = 1000;

export interface PaginationParams {
  take?: number;
  skip?: number;
  cursor?: { id: string };
}

export interface FindManyOptions extends PaginationParams {
  orderBy?: Record<string, 'asc' | 'desc'>;
}

/**
 * Structural interface covering the Prisma delegate methods used by BaseRepository.
 * Subclasses return a concrete Prisma delegate (e.g. prisma.user); this type
 * enforces the return shape so that base-class call-sites are typed rather than `any`.
 */
export interface PrismaDelegate<T, CreateInput> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(args: { data: CreateInput; [k: string]: any }): Promise<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createMany(args: { data: CreateInput[]; skipDuplicates?: boolean; [k: string]: any }): Promise<Prisma.BatchPayload>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findUnique(args: { where: any }): Promise<T | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findFirst(args: { where?: any; orderBy?: any; take?: number; skip?: number }): Promise<T | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findMany(args?: { where?: any; take?: number; skip?: number; cursor?: any; orderBy?: any }): Promise<T[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(args: { where: any; data: any }): Promise<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateMany(args: { where?: any; data: any }): Promise<Prisma.BatchPayload>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete(args: { where: any }): Promise<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteMany(args?: { where?: any }): Promise<Prisma.BatchPayload>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  count(args?: { where?: any }): Promise<number>;
}

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  /**
   * Returns the Prisma model delegate for this repository.
   * Return type is `unknown` so subclasses can return any Prisma delegate
   * without annotation; the base class casts once via `delegate()`.
   */
  protected abstract getDelegate(): unknown;
  protected abstract getModelName(): string;
  protected abstract supportsSoftDelete(): boolean;

  /** Single typed cast point — keeps `any` quarantined to one location. */
  private delegate(): PrismaDelegate<T, CreateInput> {
    return this.getDelegate() as PrismaDelegate<T, CreateInput>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected addSoftDeleteFilter(where?: any): any {
    if (!this.supportsSoftDelete()) return where;
    if (!where) return { deletedAt: null };
    return { AND: [where, { deletedAt: null }] };
  }

  async create(data: CreateInput): Promise<T> {
    try {
      return await this.delegate().create({ data });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'create' },
        'Repository create failed'
      );
      throw error;
    }
  }

  async createMany(
    data: CreateInput[],
    options?: { skipDuplicates?: boolean }
  ): Promise<Prisma.BatchPayload> {
    try {
      return await this.delegate().createMany({ data, ...options });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'createMany', count: data.length },
        'Repository createMany failed'
      );
      throw error;
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      const where = this.supportsSoftDelete() ? { id, deletedAt: null } : { id };
      return await this.delegate().findUnique({ where });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'findById', id },
        'Repository findById failed'
      );
      throw error;
    }
  }

  async findByIdOrThrow(id: string): Promise<T> {
    const record = await this.findById(id);
    if (!record) {
      const error = new Error(`${this.getModelName()} with id ${id} not found`);
      repoLogger.warn({ model: this.getModelName(), id }, error.message);
      throw error;
    }
    return record;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findOne(where: any): Promise<T | null> {
    try {
      const whereWithSoftDelete = this.addSoftDeleteFilter(where);
      return await this.delegate().findFirst({ where: whereWithSoftDelete });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'findOne', where },
        'Repository findOne failed'
      );
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findMany(where?: any, options?: FindManyOptions): Promise<T[]> {
    try {
      const whereWithSoftDelete = this.addSoftDeleteFilter(where);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = { where: whereWithSoftDelete };

      // Cap take at PAGINATION_MAX_TAKE to prevent unbounded scans
      if (options?.take !== undefined) {
        query.take = Math.min(options.take, PAGINATION_MAX_TAKE);
      }
      if (options?.skip) query.skip = options.skip;
      if (options?.cursor) query.cursor = options.cursor;
      if (options?.orderBy) query.orderBy = options.orderBy;

      return await this.delegate().findMany(query);
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'findMany', where },
        'Repository findMany failed'
      );
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async findManyWithDeleted(where?: any, options?: FindManyOptions): Promise<T[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = { where };

      if (options?.take !== undefined) {
        query.take = Math.min(options.take, PAGINATION_MAX_TAKE);
      }
      if (options?.skip) query.skip = options.skip;
      if (options?.cursor) query.cursor = options.cursor;
      if (options?.orderBy) query.orderBy = options.orderBy;

      return await this.delegate().findMany(query);
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'findManyWithDeleted', where },
        'Repository findManyWithDeleted failed'
      );
      throw error;
    }
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    try {
      // Include deletedAt: null so we never accidentally update a soft-deleted record
      const where = this.supportsSoftDelete() ? { id, deletedAt: null } : { id };
      return await this.delegate().update({ where, data });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'update', id },
        'Repository update failed'
      );
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateMany(where: any, data: UpdateInput): Promise<Prisma.BatchPayload> {
    try {
      const whereWithSoftDelete = this.addSoftDeleteFilter(where);
      return await this.delegate().updateMany({
        where: whereWithSoftDelete,
        data,
      });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'updateMany', where },
        'Repository updateMany failed'
      );
      throw error;
    }
  }

  async softDelete(id: string): Promise<T> {
    if (!this.supportsSoftDelete()) {
      throw new Error(`${this.getModelName()} does not support soft deletes`);
    }
    return this.update(id, { deletedAt: new Date() } as unknown as UpdateInput);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async softDeleteMany(where: any): Promise<Prisma.BatchPayload> {
    if (!this.supportsSoftDelete()) {
      throw new Error(`${this.getModelName()} does not support soft deletes`);
    }
    return this.updateMany(where, { deletedAt: new Date() } as unknown as UpdateInput);
  }

  async restore(id: string): Promise<T> {
    if (!this.supportsSoftDelete()) {
      throw new Error(`${this.getModelName()} does not support soft deletes`);
    }
    return this.update(id, { deletedAt: null } as unknown as UpdateInput);
  }

  async hardDelete(id: string): Promise<T> {
    try {
      return await this.delegate().delete({ where: { id } });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'hardDelete', id },
        'Repository hardDelete failed'
      );
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async hardDeleteMany(where: any): Promise<Prisma.BatchPayload> {
    try {
      return await this.delegate().deleteMany({ where });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'hardDeleteMany', where },
        'Repository hardDeleteMany failed'
      );
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async count(where?: any): Promise<number> {
    try {
      const whereWithSoftDelete = this.addSoftDeleteFilter(where);
      return await this.delegate().count({ where: whereWithSoftDelete });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'count', where },
        'Repository count failed'
      );
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async exists(where: any): Promise<boolean> {
    try {
      const whereWithSoftDelete = this.addSoftDeleteFilter(where);
      const record = await this.delegate().findFirst({ where: whereWithSoftDelete });
      return !!record;
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'exists', where },
        'Repository exists failed'
      );
      throw error;
    }
  }

  protected getPrisma() {
    return prisma;
  }
}

import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { logger } from '@utils/logger';

const repoLogger = logger.child({ module: 'repository' });

export interface PaginationParams {
  take?: number;
  skip?: number;
  cursor?: { id: string };
}

export interface FindManyOptions extends PaginationParams {
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected abstract getDelegate(): any;
  protected abstract getModelName(): string;
  protected abstract supportsSoftDelete(): boolean;

  protected addSoftDeleteFilter(where?: any): any {
    if (!this.supportsSoftDelete()) return where;
    if (!where) return { deletedAt: null };
    return { AND: [where, { deletedAt: null }] };
  }

  async create(data: CreateInput): Promise<T> {
    try {
      return await this.getDelegate().create({ data });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'create' },
        'Repository create failed'
      );
      throw error;
    }
  }

  async createMany(data: CreateInput[]): Promise<Prisma.BatchPayload> {
    try {
      return await this.getDelegate().createMany({ data, skipDuplicates: true });
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
      return await this.getDelegate().findUnique({ where });
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

  async findOne(where: any): Promise<T | null> {
    try {
      const whereWithSoftDelete = this.addSoftDeleteFilter(where);
      return await this.getDelegate().findFirst({ where: whereWithSoftDelete });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'findOne', where },
        'Repository findOne failed'
      );
      throw error;
    }
  }

  async findMany(where?: any, options?: FindManyOptions): Promise<T[]> {
    try {
      const whereWithSoftDelete = this.addSoftDeleteFilter(where);
      const query: any = { where: whereWithSoftDelete };

      if (options?.take) query.take = options.take;
      if (options?.skip) query.skip = options.skip;
      if (options?.cursor) query.cursor = options.cursor;
      if (options?.orderBy) query.orderBy = options.orderBy;

      return await this.getDelegate().findMany(query);
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'findMany', where },
        'Repository findMany failed'
      );
      throw error;
    }
  }

  async findManyWithDeleted(where?: any, options?: FindManyOptions): Promise<T[]> {
    try {
      const query: any = { where };

      if (options?.take) query.take = options.take;
      if (options?.skip) query.skip = options.skip;
      if (options?.cursor) query.cursor = options.cursor;
      if (options?.orderBy) query.orderBy = options.orderBy;

      return await this.getDelegate().findMany(query);
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
      return await this.getDelegate().update({
        where: { id },
        data,
      });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'update', id },
        'Repository update failed'
      );
      throw error;
    }
  }

  async updateMany(where: any, data: UpdateInput): Promise<Prisma.BatchPayload> {
    try {
      const whereWithSoftDelete = this.addSoftDeleteFilter(where);
      return await this.getDelegate().updateMany({
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
    return this.update(id, { deletedAt: new Date() } as any);
  }

  async softDeleteMany(where: any): Promise<Prisma.BatchPayload> {
    if (!this.supportsSoftDelete()) {
      throw new Error(`${this.getModelName()} does not support soft deletes`);
    }
    return this.updateMany(where, { deletedAt: new Date() } as any);
  }

  async restore(id: string): Promise<T> {
    if (!this.supportsSoftDelete()) {
      throw new Error(`${this.getModelName()} does not support soft deletes`);
    }
    return this.update(id, { deletedAt: null } as any);
  }

  async hardDelete(id: string): Promise<T> {
    try {
      return await this.getDelegate().delete({ where: { id } });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'hardDelete', id },
        'Repository hardDelete failed'
      );
      throw error;
    }
  }

  async hardDeleteMany(where: any): Promise<Prisma.BatchPayload> {
    try {
      return await this.getDelegate().deleteMany({ where });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'hardDeleteMany', where },
        'Repository hardDeleteMany failed'
      );
      throw error;
    }
  }

  async count(where?: any): Promise<number> {
    try {
      const whereWithSoftDelete = this.addSoftDeleteFilter(where);
      return await this.getDelegate().count({ where: whereWithSoftDelete });
    } catch (error) {
      repoLogger.error(
        { error, model: this.getModelName(), operation: 'count', where },
        'Repository count failed'
      );
      throw error;
    }
  }

  async exists(where: any): Promise<boolean> {
    try {
      const whereWithSoftDelete = this.addSoftDeleteFilter(where);
      const record = await this.getDelegate().findFirst({ where: whereWithSoftDelete });
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

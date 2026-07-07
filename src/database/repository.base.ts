import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export class BaseRepository<T, CreateInput, UpdateInput> {
  constructor(protected delegate: any) {}

  async create(data: CreateInput): Promise<T> {
    return this.delegate.create({ data });
  }

  async createMany(data: CreateInput[]): Promise<Prisma.BatchPayload> {
    return this.delegate.createMany({ data });
  }

  async findById(id: string): Promise<T | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  async findByIdOrThrow(id: string): Promise<T> {
    const record = await this.delegate.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`Record with id ${id} not found`);
    }
    return record;
  }

  async findOne(where: Prisma.Args<typeof this.delegate, 'findFirst'>['where']): Promise<T | null> {
    return this.delegate.findFirst({ where });
  }

  async findMany(where?: Prisma.Args<typeof this.delegate, 'findMany'>['where']): Promise<T[]> {
    return this.delegate.findMany({ where });
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    return this.delegate.update({
      where: { id },
      data,
    });
  }

  async updateMany(
    where: Prisma.Args<typeof this.delegate, 'updateMany'>['where'],
    data: UpdateInput
  ): Promise<Prisma.BatchPayload> {
    return this.delegate.updateMany({ where, data });
  }

  async delete(id: string): Promise<T> {
    return this.delegate.delete({ where: { id } });
  }

  async deleteMany(where: Prisma.Args<typeof this.delegate, 'deleteMany'>['where']): Promise<Prisma.BatchPayload> {
    return this.delegate.deleteMany({ where });
  }

  async count(where?: Prisma.Args<typeof this.delegate, 'count'>['where']): Promise<number> {
    return this.delegate.count({ where });
  }

  async exists(where: Prisma.Args<typeof this.delegate, 'findFirst'>['where']): Promise<boolean> {
    const record = await this.delegate.findFirst({ where });
    return !!record;
  }

  protected getPrisma() {
    return prisma;
  }
}

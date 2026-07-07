import { Conversation, Prisma } from '@prisma/client';
import { BaseRepository, FindManyOptions } from '../repository.base';
import { prisma } from '../prisma';

type ConversationCreateInput = Prisma.ConversationCreateInput;
type ConversationUpdateInput = Prisma.ConversationUpdateInput;

export class ConversationRepository extends BaseRepository<
  Conversation,
  ConversationCreateInput,
  ConversationUpdateInput
> {
  protected getDelegate() {
    return prisma.conversation;
  }

  protected getModelName(): string {
    return 'Conversation';
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByUserId(userId: string, options?: FindManyOptions): Promise<Conversation[]> {
    return this.findMany({ userId }, options);
  }

  async findByCompanionId(companionId: string, options?: FindManyOptions): Promise<Conversation[]> {
    return this.findMany({ companionId }, options);
  }

  async findByUserIdAndCompanionId(userId: string, companionId: string, options?: FindManyOptions): Promise<Conversation[]> {
    return this.findMany({ userId, companionId }, options);
  }

  async findActiveByUserIdAndCompanionId(userId: string, companionId: string): Promise<Conversation | null> {
    return this.findOne({ userId, companionId, status: 'ACTIVE' });
  }

  async findByStatus(status: string, options?: FindManyOptions): Promise<Conversation[]> {
    return this.findMany({ status }, options);
  }

  async findActive(options?: FindManyOptions): Promise<Conversation[]> {
    return this.findMany({ status: 'ACTIVE' }, options);
  }

  async findArchived(options?: FindManyOptions): Promise<Conversation[]> {
    return this.findMany({ status: 'ARCHIVED' }, options);
  }

  async findByCreatedAfter(date: Date, options?: FindManyOptions): Promise<Conversation[]> {
    return this.findMany({ createdAt: { gte: date } }, options);
  }

  async findByUpdatedAfter(date: Date, options?: FindManyOptions): Promise<Conversation[]> {
    return this.findMany({ updatedAt: { gte: date } }, options);
  }

  async findByTopic(topic: string, options?: FindManyOptions): Promise<Conversation[]> {
    return this.findMany({ topic }, options);
  }

  async findRecentByUserId(userId: string, limit: number = 10): Promise<Conversation[]> {
    return this.findMany(
      { userId },
      {
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }
    );
  }

  async findRecentByCompanionId(companionId: string, limit: number = 10): Promise<Conversation[]> {
    return this.findMany(
      { companionId },
      {
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }
    );
  }

  async findWithMessages(conversationId: string, limit?: number): Promise<(Conversation & { messages: any[] }) | null> {
    try {
      return (await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' } as any,
            ...(limit && { take: limit }),
          },
        },
      })) as any;
    } catch (error) {
      throw error;
    }
  }

  async findWithMessagesAndPagination(
    conversationId: string,
    skip: number = 0,
    take: number = 50
  ): Promise<(Conversation & { messages: any[] }) | null> {
    try {
      return (await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' } as any,
            skip,
            take,
          },
        },
      })) as any;
    } catch (error) {
      throw error;
    }
  }

  async incrementMessageCount(conversationId: string, count: number = 1): Promise<Conversation> {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { messageCount: { increment: count } },
    });
  }

  async updateTopic(conversationId: string, topic: string): Promise<Conversation> {
    return this.update(conversationId, { topic } as any);
  }

  async updateSummary(conversationId: string, summary: string): Promise<Conversation> {
    return this.update(conversationId, { summary } as any);
  }

  async updateStatus(conversationId: string, status: string): Promise<Conversation> {
    return this.update(conversationId, { status } as any);
  }

  async archiveConversation(conversationId: string): Promise<Conversation> {
    return this.updateStatus(conversationId, 'ARCHIVED');
  }

  async reopenConversation(conversationId: string): Promise<Conversation> {
    return this.updateStatus(conversationId, 'ACTIVE');
  }

  async countByUserId(userId: string): Promise<number> {
    return this.count({ userId });
  }

  async countByCompanionId(companionId: string): Promise<number> {
    return this.count({ companionId });
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return this.count({ userId, status: 'ACTIVE' });
  }

  async countActiveByCompanionId(companionId: string): Promise<number> {
    return this.count({ companionId, status: 'ACTIVE' });
  }

  async existsByUserIdAndCompanionId(userId: string, companionId: string): Promise<boolean> {
    return this.exists({ userId, companionId });
  }
}

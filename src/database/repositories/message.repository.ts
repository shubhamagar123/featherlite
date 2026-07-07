import { Message, Prisma } from '@prisma/client';
import { BaseRepository, FindManyOptions } from '../repository.base';
import { prisma } from '../prisma';

type MessageCreateInput = Prisma.MessageCreateInput;
type MessageUpdateInput = Prisma.MessageUpdateInput;

export class MessageRepository extends BaseRepository<Message, MessageCreateInput, MessageUpdateInput> {
  protected getDelegate() {
    return prisma.message;
  }

  protected getModelName(): string {
    return 'Message';
  }

  protected supportsSoftDelete(): boolean {
    return true;
  }

  async findByConversationId(conversationId: string, options?: FindManyOptions): Promise<Message[]> {
    return this.findMany({ conversationId }, options);
  }

  async findByUserId(userId: string, options?: FindManyOptions): Promise<Message[]> {
    return this.findMany({ userId }, options);
  }

  async findByCompanionId(companionId: string, options?: FindManyOptions): Promise<Message[]> {
    return this.findMany({ companionId }, options);
  }

  async findByRole(role: string, options?: FindManyOptions): Promise<Message[]> {
    return this.findMany({ role }, options);
  }

  async findByStatus(status: string, options?: FindManyOptions): Promise<Message[]> {
    return this.findMany({ status }, options);
  }

  async findSentMessages(options?: FindManyOptions): Promise<Message[]> {
    return this.findMany({ status: 'SENT' }, options);
  }

  async findDeliveredMessages(options?: FindManyOptions): Promise<Message[]> {
    return this.findMany({ status: 'DELIVERED' }, options);
  }

  async findReadMessages(options?: FindManyOptions): Promise<Message[]> {
    return this.findMany({ status: 'READ' }, options);
  }

  async findFailedMessages(options?: FindManyOptions): Promise<Message[]> {
    return this.findMany({ status: 'FAILED' }, options);
  }

  async findByConversationIdOrdered(
    conversationId: string,
    direction: 'asc' | 'desc' = 'asc',
    options?: FindManyOptions
  ): Promise<Message[]> {
    return this.findMany(
      { conversationId },
      {
        ...options,
        orderBy: { createdAt: direction },
      }
    );
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: FindManyOptions
  ): Promise<Message[]> {
    return this.findMany(
      {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      options
    );
  }

  async findByConversationIdAndDateRange(
    conversationId: string,
    startDate: Date,
    endDate: Date,
    options?: FindManyOptions
  ): Promise<Message[]> {
    return this.findMany(
      {
        conversationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      options
    );
  }

  async findLastNMessages(conversationId: string, n: number = 10): Promise<Message[]> {
    return this.findMany(
      { conversationId },
      {
        take: n,
        orderBy: { createdAt: 'desc' },
      }
    );
  }

  async findFirstNMessages(conversationId: string, n: number = 10): Promise<Message[]> {
    const messages = await this.findMany(
      { conversationId },
      {
        take: n,
        orderBy: { createdAt: 'asc' },
      }
    );
    return messages;
  }

  async findByConversationIdAndRole(
    conversationId: string,
    role: string,
    options?: FindManyOptions
  ): Promise<Message[]> {
    return this.findMany({ conversationId, role }, options);
  }

  async updateStatus(messageId: string, status: string): Promise<Message> {
    return this.update(messageId, { status } as any);
  }

  async markAsDelivered(messageId: string): Promise<Message> {
    return this.updateStatus(messageId, 'DELIVERED');
  }

  async markAsRead(messageId: string): Promise<Message> {
    return this.updateStatus(messageId, 'READ');
  }

  async markAsFailed(messageId: string): Promise<Message> {
    return this.updateStatus(messageId, 'FAILED');
  }

  async updateContent(messageId: string, content: string): Promise<Message> {
    return this.update(messageId, { content } as any);
  }

  async countByConversationId(conversationId: string): Promise<number> {
    return this.count({ conversationId });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.count({ userId });
  }

  async countByCompanionId(companionId: string): Promise<number> {
    return this.count({ companionId });
  }

  async countByConversationIdAndRole(conversationId: string, role: string): Promise<number> {
    return this.count({ conversationId, role });
  }

  async countUnreadInConversation(conversationId: string): Promise<number> {
    return this.count({ conversationId, status: 'SENT' });
  }

  async existsByConversationId(conversationId: string): Promise<boolean> {
    return this.exists({ conversationId });
  }

  async getConversationWordCount(conversationId: string): Promise<number> {
    try {
      const messages = await prisma.message.findMany({
        where: { conversationId, deletedAt: null },
        select: { content: true },
      });

      return messages.reduce((total, msg) => {
        const wordCount = msg.content.split(/\s+/).length;
        return total + wordCount;
      }, 0);
    } catch (error) {
      throw error;
    }
  }
}

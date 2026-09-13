import { UserRepository } from './repositories/user.repository';
import { CompanionRepository } from './repositories/companion.repository';
import { RelationshipRepository } from './repositories/relationship.repository';
import { WorldRepository } from './repositories/world.repository';
import { ConversationRepository } from './repositories/conversation.repository';
import { MessageRepository } from './repositories/message.repository';
import { MemoryRepository } from './repositories/memory.repository';
import { MomentRepository } from './repositories/moment.repository';
import { NotificationRepository } from './repositories/notification.repository';
import { PlannerEventRepository } from './repositories/planner-event.repository';
import { NudgePreferenceRepository } from './repositories/nudge-preference.repository';

export * from './repositories';
export * from './transaction';
export { connectDatabase, disconnectDatabase, checkDatabaseHealth } from './connection';
export { prisma } from './prisma';

export interface DatabaseRepositories {
  users: UserRepository;
  companions: CompanionRepository;
  relationships: RelationshipRepository;
  worlds: WorldRepository;
  conversations: ConversationRepository;
  messages: MessageRepository;
  memories: MemoryRepository;
  moments: MomentRepository;
  notifications: NotificationRepository;
  plannerEvents: PlannerEventRepository;
  nudgePreferences: NudgePreferenceRepository;
}

let cachedRepositories: DatabaseRepositories | null = null;

export function getDatabaseRepositories(): DatabaseRepositories {
  if (cachedRepositories) {
    return cachedRepositories;
  }

  cachedRepositories = {
    users: new UserRepository(),
    companions: new CompanionRepository(),
    relationships: new RelationshipRepository(),
    worlds: new WorldRepository(),
    conversations: new ConversationRepository(),
    messages: new MessageRepository(),
    memories: new MemoryRepository(),
    moments: new MomentRepository(),
    notifications: new NotificationRepository(),
    plannerEvents: new PlannerEventRepository(),
    nudgePreferences: new NudgePreferenceRepository(),
  };

  return cachedRepositories;
}

export function resetDatabaseRepositories(): void {
  cachedRepositories = null;
}

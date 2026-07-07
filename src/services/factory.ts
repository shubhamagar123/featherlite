import { DatabaseRepositories, getDatabaseRepositories } from '@database/index';
import { UserService } from './user/user.service';
import { CompanionService } from './companion/companion.service';
import { ConversationService } from './conversation/conversation.service';
import { MessageService } from './message/message.service';
import { MemoryService } from './memory/memory.service';
import { RelationshipService } from './relationship/relationship.service';
import { MomentService } from './moment/moment.service';
import { NotificationService } from './notification/notification.service';
import { WorldService } from './world/world.service';

export interface ServiceContainer {
  userService: UserService;
  companionService: CompanionService;
  conversationService: ConversationService;
  messageService: MessageService;
  memoryService: MemoryService;
  relationshipService: RelationshipService;
  momentService: MomentService;
  notificationService: NotificationService;
  worldService: WorldService;
}

let cachedServices: ServiceContainer | null = null;

export function getDatabaseServices(repositories?: DatabaseRepositories): ServiceContainer {
  if (cachedServices) {
    return cachedServices;
  }

  const repos = repositories || getDatabaseRepositories();

  cachedServices = {
    userService: new UserService(repos.users),
    companionService: new CompanionService(repos.companions),
    conversationService: new ConversationService(repos.conversations),
    messageService: new MessageService(repos.messages),
    memoryService: new MemoryService(repos.memories),
    relationshipService: new RelationshipService(repos.relationships),
    momentService: new MomentService(repos.moments),
    notificationService: new NotificationService(repos.notifications),
    worldService: new WorldService(repos.worlds),
  };

  return cachedServices;
}

export function resetDatabaseServices(): void {
  cachedServices = null;
}

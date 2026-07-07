// Factory & Container
export { getDatabaseServices, resetDatabaseServices } from './factory';
export type { ServiceContainer } from './factory';

// Services
export { UserService } from './user/user.service';
export { CompanionService } from './companion/companion.service';
export { ConversationService } from './conversation/conversation.service';
export { MessageService } from './message/message.service';
export { MemoryService } from './memory/memory.service';
export { RelationshipService } from './relationship/relationship.service';
export { MomentService } from './moment/moment.service';
export { NotificationService } from './notification/notification.service';
export { WorldService } from './world/world.service';

// Service Interfaces
export type { IUserService } from './user/user.service.interface';
export type { ICompanionService } from './companion/companion.service.interface';
export type { IConversationService } from './conversation/conversation.service.interface';
export type { IMessageService } from './message/message.service.interface';
export type { IMemoryService } from './memory/memory.service.interface';
export type { IRelationshipService } from './relationship/relationship.service.interface';
export type { IMomentService } from './moment/moment.service.interface';
export type { INotificationService } from './notification/notification.service.interface';
export type { IWorldService } from './world/world.service.interface';

// DTOs
export type {
  CreateUserDTO,
  UpdateUserProfileDTO,
  UpdateUserSettingsDTO,
  UserDTO,
  UserProfileDTO,
  UserSettingsDTO,
  UserWithCompanionsDTO,
  UserWithRelationshipsDTO,
} from './dtos/user.dto';

export type {
  CompanionDTO,
  CompanionDetailDTO,
  CompanionWithConversationsDTO,
  CompanionMetadataDTO,
  CreateCompanionDTO,
  UpdateCompanionDTO,
} from './dtos/companion.dto';

export type {
  ConversationDTO,
  ConversationDetailDTO,
  ConversationWithMessagesDTO,
  CreateConversationDTO,
  UpdateConversationDTO,
  ConversationMetadataDTO,
} from './dtos/conversation.dto';

export type {
  MessageDTO,
  CreateMessageDTO,
  UpdateMessageDTO,
  MessageMetadataDTO,
  PaginatedMessagesDTO,
} from './dtos/message.dto';

export type {
  MemoryDTO,
  CreateMemoryDTO,
  UpdateMemoryDTO,
  MemoryMetadataDTO,
} from './dtos/memory.dto';

export type {
  RelationshipDTO,
  CreateRelationshipDTO,
  UpdateRelationshipDTO,
  RelationshipMetadataDTO,
} from './dtos/relationship.dto';

export type {
  MomentDTO,
  CreateMomentDTO,
  UpdateMomentDTO,
  MomentMetadataDTO,
} from './dtos/moment.dto';

export type {
  NotificationDTO,
  CreateNotificationDTO,
  UpdateNotificationDTO,
  NotificationMetadataDTO,
  UnreadNotificationCountDTO,
} from './dtos/notification.dto';

export type {
  WorldStateDTO,
  WorldStateDetailDTO,
  UpdateWorldStateDTO,
  WorldEnvironmentDTO,
  WorldMetadataDTO,
} from './dtos/world.dto';

// Exceptions
export {
  ServiceException,
  ValidationException,
  NotFoundError,
  ConflictError,
  DuplicateResourceError,
  InvalidStateError,
  UnauthorizedError,
  ForbiddenError,
  ConstraintViolationError,
  OptimisticLockError,
  InvalidRelationError,
} from './exceptions';

// Result Type
export type { IResult } from './types/result.type';
export { Result } from './types/result.type';

// Base Service
export { BaseService } from './base/base.service';

// Input Validator
export { InputValidator } from './validators/input.validators';

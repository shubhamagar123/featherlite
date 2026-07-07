# Service Layer

The Service Layer contains all business logic for Featherlight. It operates as a pure application tier between the HTTP/Controller layer and the Data Access/Repository layer.

## Architecture Overview

```
HTTP Layer (Controllers)
        ↓
    Service Layer ← This module
        ↓
Repository Layer (Data Access)
        ↓
    Database (PostgreSQL)
```

## Key Principles

### 1. No Dependency on HTTP/Express
Services have zero knowledge of HTTP, Express, requests, responses, or middleware. They are completely framework-agnostic.

### 2. No Direct Database Access
Services NEVER access Prisma or database directly. All data access goes through repositories.

### 3. Pure Business Logic
Services implement domain logic only:
- Validation (via InputValidator)
- Workflow orchestration
- Cross-entity operations
- Business state transitions

### 4. Result<T> Pattern
All public methods return `Promise<IResult<T>>` for explicit error handling without exceptions:

```typescript
interface IResult<T> {
  isSuccess: boolean;
  value?: T;
  error?: Error;
  
  getValueOrThrow(): T;
  getValueOrDefault(defaultValue: T): T;
  map<U>(fn: (value: T) => U): IResult<U>;
  flatMap<U>(fn: (value: T) => IResult<U>): IResult<U>;
  fold<U>(onFailure: (error: Error) => U, onSuccess: (value: T) => U): U;
}
```

### 5. Dependency Injection
All repositories are injected via constructor. This makes services independently testable.

```typescript
export class UserService extends BaseService implements IUserService {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }
}
```

### 6. Input Validation (Fail-Fast)
All inputs validated at method entry:

```typescript
InputValidator.requireValidEmail(dto.email, 'email');
InputValidator.requireValidUUID(userId, 'userId');
InputValidator.requireInRange(score, 0, 1, 'score');
```

## Services

### 1. UserService (13 methods)
Manages user lifecycle and settings:
- `createUser(dto)` - Create new user with duplicate email/username checks
- `getUserById(userId)` - Fetch user by ID
- `getUserByEmail(email)` - Fetch user by email
- `getUserByUsername(username)` - Fetch user by username
- `getUserProfile(userId)` - Get profile data
- `updateUserProfile(userId, dto)` - Update profile info
- `getUserSettings(userId)` - Get user settings
- `updateUserSettings(userId, dto)` - Update settings
- `getActiveUsers(limit)` - Fetch active users
- `getUsersByRole(role, limit)` - Fetch users by role
- `softDeleteUser(userId)` - Soft delete user
- `restoreUser(userId)` - Restore deleted user
- `updateLastLogin(userId)` - Track login time
- `emailExists(email)` - Check email availability
- `usernameExists(username)` - Check username availability

### 2. CompanionService (11 methods)
Manages AI companion entities and metrics:
- `getCompanionById(companionId)` - Fetch companion
- `getCompanionByUserIdAndName(userId, name)` - Fetch by user + name
- `getCompanionsByUserId(userId, limit)` - List companions
- `getActiveCompanionsByUserId(userId, limit)` - List active only
- `getCompanionsByHighestAffection(userId, limit)` - Rank by affection
- `getDefaultCompanions(userId)` - Get Kai/Kia defaults
- `updateCompanionAffection(companionId, delta)` - Adjust affection level
- `updateCompanionEngagement(companionId, score)` - Update engagement 0-1
- `updateCompanionLastInteraction(companionId)` - Track interaction
- `incrementConversationCount(companionId)` - Increment conversations
- `incrementMessageCount(companionId, count)` - Increment messages

### 3. ConversationService (8 methods)
Manages user-companion conversations:
- `createConversation(dto)` - Start new conversation
- `getConversationById(conversationId)` - Fetch conversation
- `getConversationsByUserId(userId, limit)` - List user conversations
- `getActiveConversation(userId, companionId)` - Get current conversation
- `updateConversation(conversationId, dto)` - Update conversation
- `archiveConversation(conversationId)` - Archive (status=ARCHIVED)
- `reopenConversation(conversationId)` - Reopen (status=ACTIVE)
- `incrementMessageCount(conversationId, count)` - Update message count

### 4. MessageService (7 methods)
Manages conversation messages:
- `createMessage(dto)` - Create new message
- `getMessageById(messageId)` - Fetch message
- `getConversationMessages(conversationId, skip, take)` - Paginated list
- `markAsRead(messageId)` - Mark read
- `markAsDelivered(messageId)` - Mark delivered
- `softDeleteMessage(messageId)` - Soft delete
- `getUnreadCount(conversationId)` - Count unread

### 5. MemoryService (7 methods)
Manages companion memories/context:
- `createMemory(dto)` - Create memory
- `getMemoryById(memoryId)` - Fetch memory
- `getMemoriesByCompanionId(companionId, limit)` - List memories
- `getCriticalMemories(companionId, limit)` - High-importance memories
- `updateMemory(memoryId, dto)` - Update memory
- `deleteMemory(memoryId)` - Soft delete memory
- `incrementAccessCount(memoryId)` - Track access

### 6. RelationshipService (9 methods)
Manages user-companion relationships:
- `createRelationship(dto)` - Create relationship
- `getRelationshipById(relationshipId)` - Fetch relationship
- `getRelationshipByUserAndCompanion(userId, companionId)` - Unique lookup
- `getRelationshipsByUserId(userId, limit)` - List relationships
- `updateRelationship(relationshipId, dto)` - Update metadata
- `pauseRelationship(relationshipId)` - Pause (status=PAUSED)
- `resumeRelationship(relationshipId)` - Resume (status=ACTIVE)
- `endRelationship(relationshipId)` - End (status=ENDED)
- `updateLastInteraction(relationshipId)` - Track interaction

### 7. MomentService (5 methods)
Manages memorable moments/events:
- `createMoment(dto)` - Record moment
- `getMomentById(momentId)` - Fetch moment
- `getMomentsByCompanionId(companionId, limit)` - List moments
- `updateMoment(momentId, dto)` - Update moment
- `deleteMoment(momentId)` - Soft delete

### 8. NotificationService (8 methods)
Manages user notifications:
- `createNotification(dto)` - Create notification
- `getNotificationById(notificationId)` - Fetch notification
- `getNotificationsByUserId(userId, limit)` - List notifications
- `getUnreadNotifications(userId, limit)` - Unread only
- `markAsRead(notificationId)` - Mark single as read
- `markAllAsRead(userId)` - Mark all as read
- `deleteNotification(notificationId)` - Soft delete
- `getUnreadCount(userId)` - Count unread

### 9. WorldService (5 methods)
Manages world/environment state:
- `getWorldByCompanionId(companionId)` - Fetch world
- `updateWorldState(worldId, dto)` - Update world properties
- `updateEnvironment(worldId, timeOfDay, season, mood)` - Set environment
- `updateCurrentScene(worldId, sceneId)` - Change active scene
- `refreshWorldState(companionId)` - Fetch current state

## Dependency Injection

### Factory Pattern
The `factory.ts` exports `getDatabaseServices()` which instantiates all 9 services with their repository dependencies:

```typescript
import { getDatabaseServices } from '@services/factory';

const { userService, companionService, messageService } = getDatabaseServices();
```

### Caching
Services are cached on first call and reused (singleton pattern). Reset with `resetDatabaseServices()` in tests.

### Custom Repositories
Pass custom repositories to constructor for testing:

```typescript
const mockUserRepo = new MockUserRepository();
const userService = new UserService(mockUserRepo);
```

## Error Handling

### Exception Hierarchy
11 custom exceptions with statusCode for HTTP responses:

- `ValidationException` (400) - Input validation failures
- `NotFoundError` (404) - Entity not found
- `ConflictError` (409) - State conflict base class
- `DuplicateResourceError` (409) - Duplicate email/username
- `InvalidStateError` (400) - Invalid state transition
- `UnauthorizedError` (401) - Authentication required
- `ForbiddenError` (403) - Authorization failed
- `ConstraintViolationError` (400) - DB constraint violation
- `OptimisticLockError` (409) - Version mismatch
- `InvalidRelationError` (400) - Invalid relation reference

### Exception Usage
Catch and return exceptions in Result.failure():

```typescript
try {
  const user = await this.userRepository.findById(userId);
  if (!user) return Result.failure(new NotFoundError('User', userId));
  return Result.success(UserMapper.toDTO(user));
} catch (error) {
  this.logError(error as Error, 'Failed to get user');
  return Result.failure(new Error('Failed to get user'));
}
```

## Input Validation

### InputValidator (20+ methods)
Centralized validation with fail-fast pattern:

```typescript
// Email validation
InputValidator.requireValidEmail(email, 'email');

// UUID/CUID validation
InputValidator.requireValidUUID(id, 'id');

// Enum validation
InputValidator.requireInEnum(status, ['ACTIVE', 'INACTIVE'], 'status');

// Range validation
InputValidator.requireInRange(score, 0, 1, 'score');
InputValidator.requirePositive(limit, 'limit');
InputValidator.requireNonNegative(skip, 'skip');

// String validation
InputValidator.requireNotEmpty(title, 'title');
InputValidator.requireMinLength(password, 8, 'password');
InputValidator.requireMaxLength(bio, 500, 'bio');
```

All throw `ValidationException` on failure.

## Data Transfer Objects (DTOs)

All services use DTOs for input/output, never exposing database entities:

```typescript
// User DTOs
CreateUserDTO, UpdateUserProfileDTO, UpdateUserSettingsDTO,
UserDTO, UserProfileDTO, UserSettingsDTO

// Companion DTOs
CreateCompanionDTO, UpdateCompanionDTO,
CompanionDTO, CompanionDetailDTO, CompanionMetadataDTO

// Message DTOs
CreateMessageDTO, UpdateMessageDTO,
MessageDTO, MessageMetadataDTO, PaginatedMessagesDTO

// [Mapper classes handle entity → DTO conversion]
UserMapper.toDTO(user)
CompanionMapper.toDTOArray(companions)
```

## Logging

### BaseService Logging Methods
All services extend BaseService which provides:

```typescript
// Info level
this.logInfo(message, context)

// Error level with stack trace
this.logError(error, message, context)

// Warning level
this.logWarn(message, context)

// Debug level
this.logDebug(message, context)

// Business events (structured logging)
this.logBusinessEvent('user_created', { userId, email })
this.logBusinessEvent('message_sent', { conversationId, messageId })
```

## Testing

### Mocking Pattern
Services are independently testable by mocking repository dependencies:

```typescript
jest.mock('@database/repositories/user.repository');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    userService = new UserService(mockUserRepository);
  });

  it('should create user successfully', async () => {
    mockUserRepository.existsByEmail.mockResolvedValue(false);
    mockUserRepository.existsByUsername.mockResolvedValue(false);
    mockUserRepository.create.mockResolvedValue(mockUser);

    const result = await userService.createUser(dto);
    expect(result).toBeDefined();
  });
});
```

### Test Coverage
Two test templates provided:
- `user.service.test.ts` - Demonstrates all common patterns
- `companion.service.test.ts` - Shows result handling and validation testing

## Design Decisions

### 1. Result<T> Over Exceptions
Rationale: Explicit error handling without exception overhead. Normal failure paths (not found, conflict) don't need stack traces.

### 2. Fail-Fast Validation
Rationale: Validate inputs immediately at method entry before any business logic. Catches errors early with clear messages.

### 3. No Repository Abstraction
Rationale: Services work directly with concrete Repository implementations. Simpler than Repository interfaces while maintaining testability through dependency injection.

### 4. Mapper Layer
Rationale: Complete decoupling of database schema from API contracts. DTOs can evolve independently of Prisma schema.

### 5. Soft Deletes Only
Rationale: GDPR compliance and audit trails. All deletes are soft (set deletedAt timestamp). Repository automatically filters WHERE deletedAt IS NULL.

## Performance Considerations

### Pagination
Always use pagination for list operations:
```typescript
async getCompanionsByUserId(userId: string, limit: number = 50): Promise<IResult<CompanionDTO[]>> {
  const companions = await this.companionRepository.findByUserId(userId, { take: limit });
}
```

### Eager Loading
Repository queries fetch related data when needed (via Prisma `include`).

### Caching
Service factory implements singleton caching. Cache persists for request lifecycle.

## Security Notes

### Never Trust User Input
InputValidator ensures all user inputs validated before business logic processes them.

### Never Expose Internal Errors
Catch all errors and return generic Result.failure(). Log actual errors server-side only.

### No SQL Injection
All queries use Prisma parameterization. User input never interpolated into queries.

### No Privilege Escalation
Services have no knowledge of HTTP roles/auth. Authorization handled by controllers.

## Migration Guide

When moving from database model to DTO:

1. Repository returns database entity
2. Service catches and validates
3. Mapper converts entity → DTO
4. Service returns Result.success(DTO)
5. Controller sends DTO in HTTP response

Example:
```typescript
// Step 1: Get from repository
const user = await this.userRepository.findById(userId);

// Step 2: Validate
if (!user) return Result.failure(new NotFoundError('User', userId));

// Step 3: Map to DTO
const dto = UserMapper.toDTO(user);

// Step 4: Wrap in result
return Result.success(dto);

// Step 5: Controller sends DTO to client
res.json(result.value);
```

## Usage Example

```typescript
// Instantiate services
const { userService, companionService, messageService } = getDatabaseServices();

// Create user with validation
const userResult = await userService.createUser({
  email: 'alice@example.com',
  username: 'alice_wonder',
  firstName: 'Alice',
  lastName: 'Wonder',
});

if (!userResult.isSuccess) {
  console.error('Failed to create user:', userResult.error);
  return;
}

const user = userResult.value;

// Create companion for user
const companionResult = await companionService.createCompanion({
  userId: user.id,
  name: 'Kai',
  description: 'Your friendly AI companion',
});

if (!companionResult.isSuccess) {
  console.error('Failed to create companion:', companionResult.error);
  return;
}

const companion = companionResult.value;

// Create conversation
const conversationResult = await messageService.createConversation({
  userId: user.id,
  companionId: companion.id,
  title: 'First Chat',
});

if (!conversationResult.isSuccess) {
  console.error('Failed to create conversation:', conversationResult.error);
  return;
}

console.log('Setup complete:', { user, companion, conversation: conversationResult.value });
```

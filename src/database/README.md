# Database Layer Architecture

The database layer implements the Repository Pattern for data persistence, providing a clean separation between business logic and data access. This layer is production-ready with comprehensive error handling, soft deletes, transactions, and optimistic locking.

## Architecture Overview

```
Database Layer
├── Prisma Client (Singleton)
├── Connection Lifecycle
├── BaseRepository (Generic CRUD)
├── Concrete Repositories (9 entities)
├── Transaction Utilities
└── Dependency Injection
```

## Key Design Decisions

### 1. BaseRepository Pattern

**Why**: Generic base class eliminates code duplication while maintaining type safety.

- All repositories extend `BaseRepository<Entity, CreateInput, UpdateInput>`
- Provides standard CRUD operations: create, read, update, delete
- Automatically handles soft deletes for supported entities
- Error logging with operation context
- Pagination support via `FindManyOptions`

**Example**:
```typescript
class UserRepository extends BaseRepository<User, UserCreateInput, UserUpdateInput> {
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }
}
```

### 2. Soft Delete Support

**Why**: GDPR compliance and data recovery without hard deletes.

- Soft delete entities: User, Companion, Relationship, Conversation, Message, Memory, Moment, Notification, Device, VoiceSession
- Non-soft-delete entities: WorldState, Scene, Weather, Activity, AnalyticsEvent, Outfit, Device, CompanionActivity
- All queries automatically filter `WHERE deletedAt IS NULL`
- Separate methods for working with deleted records:
  - `findMany()` - excludes deleted records
  - `findManyWithDeleted()` - includes deleted records
  - `softDelete()` - sets deletedAt
  - `restore()` - clears deletedAt
  - `hardDelete()` - permanent deletion

**Implementation**:
```typescript
protected supportsSoftDelete(): boolean {
  return true; // or false for entities without soft delete
}

protected addSoftDeleteFilter(where?: any): any {
  if (!this.supportsSoftDelete()) return where;
  if (!where) return { deletedAt: null };
  return { AND: [where, { deletedAt: null }] };
}
```

### 3. Optimistic Locking

**Why**: Prevent lost updates in concurrent scenarios.

- User and Companion models have `version` fields
- `updateVersion()` methods check expected version before update
- Throws `VersionConflict` error if versions don't match
- Prevents race conditions without pessimistic locks

**Example**:
```typescript
async updateVersion(
  companionId: string,
  expectedVersion: number,
  newData: CompanionUpdateInput
): Promise<Companion> {
  const updated = await prisma.companion.update({
    where: { id: companionId },
    data: { ...newData, version: { increment: 1 } },
  });
  
  if (updated.version !== expectedVersion + 1) {
    throw new Error('Version conflict');
  }
  return updated;
}
```

### 4. Transaction Utilities

**Why**: Atomic multi-step operations with automatic rollback.

Four transaction patterns provided:

1. **Basic Transaction**
   ```typescript
   await transaction(async (client) => {
     // Multiple operations as single atomic unit
     await client.user.create({ data: {...} });
     await client.companion.create({ data: {...} });
   });
   ```

2. **Isolated Transaction**
   ```typescript
   await transactionWithIsolation(async (client) => {
     // High-isolation reads to prevent race conditions
   }, 'Serializable');
   ```

3. **Timeout Transaction**
   ```typescript
   await transactionWithTimeout(async (client) => {
     // Auto-rollback if exceeds 5 seconds (default)
   }, 5000);
   ```

4. **Multi-Operation Transaction**
   ```typescript
   await executeInTransaction([
     { name: 'createUser', fn: (client) => client.user.create({...}) },
     { name: 'createCompanion', fn: (client) => client.companion.create({...}) },
   ]);
   ```

### 5. Dependency Injection

**Why**: Testability and centralized repository instantiation.

Singleton factory pattern provides all repositories:

```typescript
// src/database/index.ts
const repos = getDatabaseRepositories();

// repos.users
// repos.companions
// repos.relationships
// repos.conversations
// repos.messages
// repos.memories
// repos.moments
// repos.worlds
// repos.notifications

// For testing: resetDatabaseRepositories() clears cache
```

### 6. Entity-Specific Methods

Each repository adds domain-specific queries beyond base CRUD:

**UserRepository**
- `findByEmail()` - lookup by unique email
- `findByUsername()` - lookup by unique username
- `findByFirebaseUid()` - external auth lookup
- `findActive()` - active users only
- `updateLastLogin()` - track authentication
- `findWithCompanions()` - eager load companions

**CompanionRepository**
- `findByUserId()` - companions owned by user
- `findActiveByUserId()` - active companions only
- `findByUserIdAndName()` - enforce unique names
- `findByHighestAffection()` - sort by emotion
- `updateAffectionLevel()` - increment metric
- `incrementTotalConversations()` - denormalized count

**RelationshipRepository**
- `findActiveByUserId()` - active relationships
- `findByHighestAffection()` - strongest bonds
- `updateAffectionScore()` - atomic increment
- `pauseRelationship()` - soft state change
- `findByLastInteraction()` - engagement sorting

**ConversationRepository**
- `findActiveByUserAndCompanion()` - current conversation
- `findWithMessages()` - eager load messages
- `findWithMessagesAndPagination()` - paginated messages
- `incrementMessageCount()` - denormalized stat
- `archiveConversation()` - soft state change

**MessageRepository**
- `findByConversationId()` - messages in thread
- `findByRole()` - USER vs COMPANION
- `findByDateRange()` - time-based queries
- `findLastNMessages()` - recent messages
- `markAsDelivered/Read()` - status transitions
- `getConversationWordCount()` - computed stat

**MemoryRepository**
- `findByCompanionId()` - memories for companion
- `findByImportance()` - CRITICAL, SIGNIFICANT, etc
- `findMostFrequentlyAccessed()` - frequent retrieval
- `incrementAccessCount()` - track usage
- `findByContentSearch()` - keyword matching

**MomentRepository**
- `findByCompanionId()` - moments for companion
- `findByCategory()` - MILESTONE, CONVERSATION, etc
- `findMostFavorited()` - popular moments
- `incrementViewCount()` - tracking
- `toggleFavorite()` - increment/decrement

**NotificationRepository**
- `findUnread()` - unread only
- `findRecentByUserId()` - recent first
- `markAsRead()` - batch and single
- `markAllAsReadByUserId()` - clear badge count
- `findOlderThan()` - cleanup queries
- `deleteOlderThan()` - archival

**WorldRepository**
- `findByCompanionId()` - world state per companion
- `findByCompanionIdWithScenes()` - eager load
- `updateEnvironment()` - update weather/mood
- `updateCurrentScene()` - scene transitions

### 7. Error Handling

**Why**: Debugging context and consistent error propagation.

All repository methods catch and log errors:

```typescript
protected async create(data: CreateInput): Promise<T> {
  try {
    return await this.getDelegate().create({ data });
  } catch (error) {
    repoLogger.error(
      { error, model: this.getModelName(), operation: 'create' },
      'Repository create failed'
    );
    throw error; // Original error propagates up
  }
}
```

Logs include:
- Error object and stack trace
- Model name (User, Companion, etc)
- Operation name (create, update, findMany, etc)
- Query parameters (for debugging)

### 8. Pagination Support

**Why**: Efficient large dataset queries without full table scans.

`FindManyOptions` interface:
```typescript
interface FindManyOptions {
  take?: number;      // Limit results
  skip?: number;      // Offset (for skip-based)
  cursor?: { id: string }; // Cursor-based pagination
  orderBy?: Record<string, 'asc' | 'desc'>; // Sorting
}
```

Usage patterns:
```typescript
// Skip-based
await repository.findMany({ status: 'ACTIVE' }, { skip: 10, take: 20 });

// Cursor-based (efficient for large datasets)
await repository.findMany({}, { cursor: { id: 'lastId' }, take: 20 });

// Sorted
await repository.findMany({ userId: 'user1' }, { 
  orderBy: { createdAt: 'desc' },
  take: 10 
});
```

### 9. No Business Logic

**Why**: Clean separation of concerns - repositories only persist, services orchestrate.

Repositories handle:
- ✓ CRUD operations
- ✓ Filtering and sorting
- ✓ Pagination
- ✓ Soft deletes
- ✓ Transactions
- ✓ Data access logging

Repositories don't handle:
- ✗ Validation
- ✗ State transitions
- ✗ Calculations
- ✗ AI/ML operations
- ✗ Business rules

### 10. Prisma Client Singleton

**Why**: Single connection pool across application lifecycle.

Located in `src/database/prisma.ts`:
- Single PrismaClient instance shared globally
- Cached on `globalThis` in development to prevent pool exhaustion on hot reload
- Pino event listeners for query/error logging
- Error formatting configurable per environment

```typescript
export const prisma: PrismaClient = 
  globalForPrisma.__featherlightPrisma ?? createPrismaClient();
```

## Repository Interfaces

### BaseRepository Methods

```typescript
// CRUD
create(data: CreateInput): Promise<T>
findById(id: string): Promise<T | null>
findByIdOrThrow(id: string): Promise<T>
findOne(where: any): Promise<T | null>
findMany(where?: any, options?: FindManyOptions): Promise<T[]>
update(id: string, data: UpdateInput): Promise<T>
updateMany(where: any, data: UpdateInput): Promise<BatchPayload>
delete(id: string): Promise<T>
deleteMany(where: any): Promise<BatchPayload>

// Utilities
count(where?: any): Promise<number>
exists(where: any): Promise<boolean>

// Soft Deletes (if supported)
softDelete(id: string): Promise<T>
softDeleteMany(where: any): Promise<BatchPayload>
restore(id: string): Promise<T>
hardDelete(id: string): Promise<T>
hardDeleteMany(where: any): Promise<BatchPayload>
```

## Usage Example

```typescript
import { getDatabaseRepositories } from '@database';

// Get repositories
const db = getDatabaseRepositories();

// Create user
const user = await db.users.create({
  email: 'test@example.com',
  username: 'testuser',
  role: 'USER',
});

// Find companions for user
const companions = await db.companions.findByUserId(user.id);

// Create relationship
const relationship = await db.relationships.create({
  userId: user.id,
  companionId: companions[0].id,
  status: 'ACTIVE',
});

// Transaction
await transaction(async (client) => {
  // All operations atomic - rollback on error
  await db.messages.create({ conversationId, content, role });
  await db.companions.incrementTotalMessages(companionId);
  await db.conversations.incrementMessageCount(conversationId);
});

// Query with pagination
const messages = await db.messages.findByConversationId(conversationId, {
  take: 50,
  skip: 100,
  orderBy: { createdAt: 'desc' },
});

// Find with eager loading
const companion = await db.companions.findWithConversations(companionId, 10);
console.log(companion.conversations); // Pre-loaded
```

## Testing

Test structure in `src/database/__tests__/`:
- Unit tests for each repository
- Mock Prisma client
- Test CRUD operations
- Test domain-specific methods
- Test error scenarios
- Test pagination and filtering

Run tests:
```bash
npm test -- src/database/__tests__
```

Coverage target: 100% on repository layer (high-confidence data access).

## Connection Lifecycle

Located in `src/database/connection.ts`:

```typescript
// Application startup
await connectDatabase(); // Establishes connection, fails fast if DB unavailable

// Health checks
const isHealthy = await checkDatabaseHealth(); // SELECT 1 probe

// Graceful shutdown
await disconnectDatabase(); // Closes connection pool
```

Integrated into Express app startup/shutdown.

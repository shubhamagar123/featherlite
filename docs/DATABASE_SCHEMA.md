# Featherlight Database Schema

## Overview

Complete PostgreSQL schema designed for a production-grade AI companion platform supporting millions of users.

**Key Characteristics:**
- UUID primary keys for distributed systems
- Soft deletes on all user-facing entities
- Timestamps (createdAt, updatedAt) on every table
- Strategic indexes for scalability
- Enums for type safety
- JSON fields for extensibility
- Denormalized counts for performance

---

## Table Directory

| Table | Purpose | Scalability Notes |
|-------|---------|-------------------|
| User | User accounts & authentication | Indexed by email, status |
| Companion | AI companion profiles | Per-user companions |
| Relationship | User-companion bond state | One per user-companion pair |
| Conversation | Chat sessions | One per user-companion pair |
| Message | Individual messages | Partition by date (large table) |
| Memory | Companion memories | Per companion-user pair |
| Moment | Significant milestones | Indexed by significance |
| Notification | User notifications | Archive old records |
| Device | User devices for push | Per device tracking |
| VoiceSession | Audio interactions | Per session |
| AnalyticsEvent | User behavior tracking | Partition by date (high volume) |
| WorldState | Environment state | One per companion |
| Scene | Locations within world | Multiple per world |
| Weather | Environmental data | Historical + current |
| Activity | Available actions | Shared catalog |
| CompanionActivity | Activity access per companion | Junction table |
| Outfit | Companion appearances | Multiple per companion |

---

## Entity Details

### 1. USER TABLE

**Purpose:** Stores user account information, authentication, and preferences. Core entity for the system.

**Why it exists:**
- User authentication and identity management
- Profile and preference storage
- Multi-device support
- Privacy and notification settings

**Key Fields:**
- `id` (UUID) - Primary key
- `email` (Unique) - For authentication
- `username` (Unique) - For user identity
- `firebaseUid` (Unique) - For Firebase auth integration
- `role` - Admin, user, moderator
- `status` - Active, inactive, suspended, deleted
- `passwordHash` - For local auth fallback

**Relationships:**
```
User (1) ──→ Companion (*)
User (1) ──→ Relationship (*)
User (1) ──→ Conversation (*)
User (1) ──→ Message (*)
User (1) ──→ Memory (*)
User (1) ──→ Moment (*)
User (1) ──→ Notification (*)
User (1) ──→ Device (*)
User (1) ──→ VoiceSession (*)
User (1) ──→ AnalyticsEvent (*)
```

**Indexes:**
- `email` - Auth lookups
- `username` - Profile lookups
- `firebaseUid` - External auth
- `status` - Filtering active/inactive users
- `createdAt` - Time-range queries
- `deletedAt` - Soft delete filtering

**Soft Delete:** Yes (deletedAt)

**Scaling Notes:**
- Partition by status for analytics
- Archive old deleted users
- Index on email for fast lookups
- lastLoginAt for active user analysis

---

### 2. COMPANION TABLE

**Purpose:** Stores AI companion profiles and their configurations. One companion per user relationship.

**Why it exists:**
- Multiple companions per user
- Companion-specific configuration
- State tracking (affection, engagement)
- Version management for AI models

**Key Fields:**
- `userId` (FK) - Owner user
- `name` - Unique per user
- `personality` (JSON) - Traits and characteristics
- `systemPrompt` - Custom LLM instructions
- `aiModel` - Which model (gpt-4, claude-3, etc)
- `affectionLevel` - Relationship metric
- `engagementScore` - How active
- `status` - Active, archived, deleted

**Relationships:**
```
Companion (1) ──→ User (1)
Companion (1) ──→ Relationship (*)
Companion (1) ──→ Conversation (*)
Companion (1) ──→ Memory (*)
Companion (1) ──→ Moment (*)
Companion (1) ──→ Activity (*)
Companion (1) ──→ Outfit (*)
Companion (1) ──→ WorldState (1)
Companion (1) ──→ VoiceSession (*)
```

**Indexes:**
- `userId` - Quick companion lookup per user
- `status` - Filter active companions
- `createdAt` - Time-range queries
- `lastInteractionAt` - Recent activity
- `deletedAt` - Soft delete filtering

**Unique Constraints:**
- `(userId, name)` - User can't have duplicate names

**Soft Delete:** Yes (deletedAt)

**Scaling Notes:**
- Denormalized counts for performance
- Cache affectionLevel in Redis
- Partition by userId conceptually

---

### 3. RELATIONSHIP TABLE

**Purpose:** Tracks the relationship state between a user and their companion. Captures emotional bonds and interaction history.

**Why it exists:**
- Tracks relationship progression
- Stores affection/trust/familiarity metrics
- Enables relationship-based features
- Audit trail of interactions

**Key Fields:**
- `userId` (FK) - User in relationship
- `companionId` (FK) - Companion in relationship
- `status` - Active, paused, ended
- `level` - Stranger to intimate (6 levels)
- `affectionScore` - -100 to 100
- `trustScore` - 0 to 100
- `familiarityScore` - 0 to 100
- `firstInteractionAt` - Relationship start
- `lastInteractionAt` - Recent activity
- `totalInteractions` - Count

**Relationships:**
```
Relationship (1) ──→ User (1)
Relationship (1) ──→ Companion (1)
```

**Indexes:**
- `(userId, companionId)` - Unique pair lookup
- `userId` - All relationships for user
- `companionId` - All users with this companion
- `status` - Active/ended relationships
- `level` - Relationship depth queries
- `lastInteractionAt` - Recent activity
- `deletedAt` - Soft delete filtering

**Unique Constraints:**
- `(userId, companionId)` - One relationship per pair

**Soft Delete:** Yes (deletedAt)

**Scaling Notes:**
- Frequently accessed - cache in Redis
- Scores updated on every interaction
- Query by level for personalization

---

### 4. CONVERSATION TABLE

**Purpose:** Represents a chat session between a user and companion. Stores session metadata and message context.

**Why it exists:**
- Organize messages into sessions
- Track conversation state
- Store conversation context/summary
- Support archival and deletion

**Key Fields:**
- `userId` (FK) - Conversation participant
- `companionId` (FK) - Companion participant
- `title` - Optional user-defined title
- `status` - Active, archived, deleted
- `context` - Summary/context for AI
- `messageCount` - Denormalized message count
- `lastMessageAt` - Recent activity

**Relationships:**
```
Conversation (1) ──→ User (1)
Conversation (1) ──→ Companion (1)
Conversation (1) ──→ Message (*)
```

**Indexes:**
- `(userId, companionId)` - Active conversation lookup
- `userId` - All conversations for user
- `companionId` - All conversations with companion
- `status` - Active/archived filtering
- `lastMessageAt` - Recent conversations
- `deletedAt` - Soft delete filtering

**Unique Constraints:**
- `(userId, companionId)` - One active conversation per pair

**Soft Delete:** Yes (deletedAt)

**Scaling Notes:**
- One active conversation per user-companion pair
- Archive old conversations
- messageCount denormalized for quick stats
- Partition messages by conversation

---

### 5. MESSAGE TABLE

**Purpose:** Individual messages in conversations. Stores message content, metadata, and processing information.

**Why it exists:**
- Store conversation history
- Track message sender and status
- Monitor token usage (LLM costs)
- Support message editing/deletion

**Key Fields:**
- `conversationId` (FK) - Parent conversation
- `userId` (FK) - Message sender (if user)
- `companionId` (FK) - Companion (always recipient or sender)
- `role` - User, companion, or system
- `content` - Message text
- `status` - Sent, delivered, read, failed
- `tokens` - LLM token count
- `processingTimeMs` - Response generation time
- `deletedAt` - Soft delete

**Relationships:**
```
Message (1) ──→ Conversation (1)
Message (1) ──→ User (1) [optional]
Message (1) ──→ Companion (1)
```

**Indexes:**
- `conversationId` - Messages in conversation
- `userId` - Messages by/to user
- `companionId` - Messages with companion
- `role` - Filter user vs companion messages
- `status` - Unread/failed messages
- `createdAt` - Time-range queries
- `deletedAt` - Soft delete filtering

**Soft Delete:** Yes (deletedAt)

**Scaling Notes:**
- **Partition by conversationId or date** (very large table)
- Archive old messages to cold storage
- Index on conversationId critical for performance
- Token tracking for billing/monitoring
- Consider message compression

---

### 6. MEMORY TABLE

**Purpose:** Stores companion memories about users and interactions. Enables long-term memory and personalization.

**Why it exists:**
- Companion remembers user details
- Episodic (events), semantic (facts), procedural (how-to)
- Enables personalized interactions
- Memory decay/refresh mechanism

**Key Fields:**
- `companionId` (FK) - Whose memory
- `userId` (FK) - Memory about whom
- `type` - Episodic, semantic, procedural
- `importance` - Trivial to critical
- `content` - The actual memory
- `summary` - Brief summary
- `decayScore` - 0-1, decays over time
- `accessCount` - How often recalled
- `lastAccessedAt` - Recent access
- `expiresAt` - Optional TTL

**Relationships:**
```
Memory (1) ──→ Companion (1)
Memory (1) ──→ User (1)
```

**Indexes:**
- `companionId` - All memories for companion
- `userId` - All memories about user
- `(companionId, userId)` - Memories in relationship
- `type` - Filter by memory type
- `importance` - Critical memories first
- `lastAccessedAt` - Frequently recalled
- `createdAt` - Recency queries
- `decayScore` - Memory degradation
- `deletedAt` - Soft delete filtering

**Soft Delete:** Yes (deletedAt)

**Scaling Notes:**
- **Partition by companionId** for multi-tenancy
- Implement memory decay/refresh job
- Consider vector embeddings for similarity search
- Archive old/expired memories
- Prioritize critical memories in queries

---

### 7. MOMENT TABLE

**Purpose:** Captures significant milestones and memories in relationships. Enables story-telling and relationships.

**Why it exists:**
- Mark relationship milestones
- Create shareable memories
- Enable nostalgia/looking back
- Detect relationship achievements

**Key Fields:**
- `userId` (FK) - User in moment
- `companionId` (FK) - Companion in moment
- `title` - What this moment is called
- `type` - First meeting, milestone, achievement, etc
- `category` - Relationship, achievement, memory, etc
- `imageUrl` - Associated image
- `significance` - 0-1 importance rating
- `isPublic` - Shareable/public
- `occurredAt` - When the moment happened
- `deletedAt` - Soft delete

**Relationships:**
```
Moment (1) ──→ User (1)
Moment (1) ──→ Companion (1)
```

**Indexes:**
- `userId` - All moments for user
- `companionId` - All moments with companion
- `(userId, companionId)` - Moments in relationship
- `type` - Filter by milestone type
- `category` - Grouping
- `significance` - Important moments first
- `occurredAt` - Timeline queries
- `isPublic` - Shareable moments
- `deletedAt` - Soft delete filtering

**Soft Delete:** Yes (deletedAt)

**Scaling Notes:**
- Display timeline of moments
- Detect automatic moments (first message, etc)
- Enable sharing features
- Archive very old moments

---

### 8. NOTIFICATION TABLE

**Purpose:** Stores notifications sent to users about companions, messages, and events.

**Why it exists:**
- User engagement mechanism
- Multi-channel delivery (push, email, in-app)
- Delivery tracking and retry
- User notification preferences

**Key Fields:**
- `userId` (FK) - Notification recipient
- `title` - Notification title
- `message` - Notification body
- `type` - Message, reminder, milestone, system
- `channel` - Push, email, in-app
- `status` - Sent, delivered, read, failed
- `relatedEntityType` - What it's about
- `relatedEntityId` - ID of related entity
- `readAt` - When user read it
- `priority` - low, normal, high, critical
- `expiresAt` - TTL for notification

**Relationships:**
```
Notification (1) ──→ User (1)
```

**Indexes:**
- `userId` - All notifications for user
- `type` - Filter by notification type
- `status` - Unread/failed notifications
- `readAt` - Unread filtering
- `createdAt` - Recent notifications
- `expiresAt` - Expiring notifications
- `deletedAt` - Soft delete filtering

**Soft Delete:** Yes (deletedAt)

**Scaling Notes:**
- Archive old notifications (>30 days)
- Batch delivery for efficiency
- Monitor delivery failures
- Respect user notification preferences

---

### 9. DEVICE TABLE

**Purpose:** Tracks user devices for multi-device support and push notifications.

**Why it exists:**
- Multi-device user experience
- Push notification management
- Device trust levels
- Session management

**Key Fields:**
- `userId` (FK) - Device owner
- `deviceId` - Unique device identifier
- `deviceType` - Mobile, desktop, tablet, wearable, web
- `osType` - ios, android, web, macos, windows
- `pushToken` - FCM or APNs token
- `status` - Active, inactive, disabled
- `lastSeenAt` - Last activity
- `isTrusted` - Whether device is trusted
- `lastVerifiedAt` - Last security verification

**Relationships:**
```
Device (1) ──→ User (1)
```

**Indexes:**
- `userId` - All devices for user
- `(userId, deviceId)` - Device lookup
- `pushToken` - Token management
- `status` - Active devices
- `lastSeenAt` - Recent devices
- `deletedAt` - Soft delete filtering

**Unique Constraints:**
- `(userId, deviceId)` - Device per user
- `pushToken` - Unique token across system

**Soft Delete:** Yes (deletedAt)

**Scaling Notes:**
- Prune inactive devices (>90 days)
- Manage push token updates
- Track device security

---

### 10. VOICESESSION TABLE

**Purpose:** Tracks voice calls, audio messages, and voice-to-text interactions.

**Why it exists:**
- Voice interaction support
- Audio message history
- Transcription storage
- Voice quality tracking

**Key Fields:**
- `userId` (FK) - User in call
- `companionId` (FK) - Companion in call
- `type` - Call, message, transcription
- `status` - Initiated, connecting, active, ended, failed
- `startedAt` - Call start time
- `endedAt` - Call end time
- `duration` - Call duration in seconds
- `voiceUrl` - Stored audio S3 URL
- `transcription` - Transcribed text
- `language` - Language used
- `voiceModel` - TTS model used

**Relationships:**
```
VoiceSession (1) ──→ User (1)
VoiceSession (1) ──→ Companion (1)
```

**Indexes:**
- `userId` - All voice sessions for user
- `companionId` - All sessions with companion
- `(userId, companionId)` - Sessions in relationship
- `type` - Filter by session type
- `status` - Active/completed sessions
- `startedAt` - Time-range queries
- `createdAt` - Recent sessions
- `deletedAt` - Soft delete filtering

**Soft Delete:** Yes (deletedAt)

**Scaling Notes:**
- Archive old recordings to cold storage
- Audio URLs point to S3
- Transcription quality tracking

---

### 11. ANALYTICSEVENT TABLE

**Purpose:** Tracks user behavior and system events for analytics, insights, and debugging.

**Why it exists:**
- User behavior analytics
- Engagement tracking
- Retention analysis
- Debugging and monitoring

**Key Fields:**
- `userId` (FK) - User performing action
- `eventType` - user_login, message_sent, etc
- `eventName` - Human-readable name
- `category` - engagement, retention, conversion
- `properties` (JSON) - Event-specific data
- `metrics` (JSON) - Numeric metrics
- `sessionId` - Session identifier
- `deviceId` - Device identifier
- `source` - web, mobile, api
- `timestamp` - Event time

**Relationships:**
```
AnalyticsEvent (1) ──→ User (1)
```

**Indexes:**
- `userId` - Events by user
- `eventType` - Filter by event type
- `eventName` - Event grouping
- `category` - Analytics categorization
- `timestamp` - Time-range queries
- `sessionId` - Session analysis

**Scaling Notes:**
- **Partition by date** (very high volume)
- Archive events >90 days old
- Batch insert for performance
- Consider time-series DB (InfluxDB, TimescaleDB)
- Sampling for high-volume events

---

### 12. WORLDSTATE TABLE

**Purpose:** Tracks the current state of the world/environment for each companion.

**Why it exists:**
- Simulated environment for companion
- Time of day, season, atmosphere
- World physics and rules
- Immersive world-building

**Key Fields:**
- `companionId` (FK, Unique) - Owner companion
- `currentScene` - Current location
- `timeOfDay` - day, night, dawn, dusk
- `season` - spring, summer, autumn, winter
- `globalMood` - Emotional tone
- `gravity` - Physics constant
- `timeScale` - Simulation speed
- `dayLengthHours` - Hours per day

**Relationships:**
```
WorldState (1) ──→ Companion (1)
WorldState (1) ──→ Scene (*)
WorldState (1) ──→ Weather (*)
```

**Indexes:**
- `companionId` - World for companion

**Unique Constraints:**
- `companionId` - One world per companion

**Soft Delete:** No

**Scaling Notes:**
- One per companion (1:1 relationship)
- Update frequency depends on simulation

---

### 13. SCENE TABLE

**Purpose:** Defines locations/scenes within a companion's world.

**Why it exists:**
- World locations/rooms
- Scene-specific atmosphere
- Navigation connections
- Immersive experience

**Key Fields:**
- `worldStateId` (FK) - Parent world
- `companionId` (FK) - Related companion
- `name` - Scene name
- `type` - Indoor, outdoor, abstract, fantasy, sci-fi
- `description` - Scene description
- `ambiance` - Atmosphere description
- `populationDensity` - empty, sparse, crowded
- `dangerLevel` - 0-10 scale
- `connectedSceneIds` (JSON) - Linked scenes

**Relationships:**
```
Scene (1) ──→ WorldState (1)
Scene (1) ──→ Companion (1)
```

**Indexes:**
- `worldStateId` - All scenes in world
- `companionId` - All scenes for companion
- `(worldStateId, name)` - Unique scene lookup
- `type` - Filter by scene type

**Unique Constraints:**
- `(worldStateId, name)` - Unique names per world

**Soft Delete:** No

**Scaling Notes:**
- Scene graph for pathfinding
- Cache scene descriptions

---

### 14. WEATHER TABLE

**Purpose:** Tracks weather conditions in the simulated world.

**Why it exists:**
- Environmental context for interactions
- Affects mood and activities
- Immersive world detail
- Optional but enhances experience

**Key Fields:**
- `worldStateId` (FK) - World's weather
- `condition` - Clear, cloudy, rainy, snowy, stormy, foggy, windy
- `temperature` - Celsius
- `humidity` - 0-100%
- `windSpeed` - km/h
- `visibility` - km
- `pressure` - hPa
- `uvIndex` - 0-11
- `isCurrent` - Current vs historical
- `recordedAt` - Recording time

**Relationships:**
```
Weather (1) ──→ WorldState (1)
```

**Indexes:**
- `worldStateId` - All weather for world
- `condition` - Filter by condition
- `isCurrent` - Current weather
- `recordedAt` - Historical weather

**Soft Delete:** No

**Scaling Notes:**
- Generate weather dynamically
- Store current weather
- Optional historical records

---

### 15. ACTIVITY TABLE

**Purpose:** Shared catalog of activities that companions can perform.

**Why it exists:**
- Reusable activity definitions
- Shared across all companions
- Metadata for activity behavior
- Consistency across system

**Key Fields:**
- `name` (Unique) - Activity name
- `type` - Conversation, game, exercise, learning, creative, etc
- `status` - Available, unavailable, restricted
- `difficulty` - easy, medium, hard
- `engagementBoost` - How much engagement increases
- `affectionChange` - Relationship effect
- `minAffectionLevel` - Minimum affection required
- `maxAffectionLevel` - Maximum affection allowed
- `requiredTraits` (JSON) - Personality requirements

**Relationships:**
```
Activity (1) ──→ CompanionActivity (*)
```

**Indexes:**
- `name` - Activity lookup
- `type` - Filter by activity type
- `status` - Available activities

**Unique Constraints:**
- `name` - Unique activity names

**Soft Delete:** No

**Scaling Notes:**
- Shared lookup table
- Cached in memory
- Rarely changes

---

### 16. COMPANIONACTIVITY TABLE

**Purpose:** Junction table for many-to-many relationship between companions and activities.

**Why it exists:**
- Track which activities each companion can perform
- Companion-specific activity customization
- Unlock progression system
- Performance tracking per activity

**Key Fields:**
- `companionId` (FK) - Which companion
- `activityId` (FK) - Which activity
- `timesPerformed` - Usage count
- `lastPerformedAt` - Recent usage
- `proficiencyLevel` - 0-1 skill level
- `isUnlocked` - Whether available
- `customization` (JSON) - Activity parameters

**Relationships:**
```
CompanionActivity (1) ──→ Companion (1)
CompanionActivity (1) ──→ Activity (1)
```

**Indexes:**
- `(companionId, activityId)` - Unique pair
- `companionId` - Activities for companion
- `activityId` - Companions with activity
- `lastPerformedAt` - Recent activities

**Unique Constraints:**
- `(companionId, activityId)` - One per pair

**Soft Delete:** No

**Scaling Notes:**
- Per-companion activity performance
- Unlock/lock mechanisms

---

### 17. OUTFIT TABLE

**Purpose:** Stores companion outfit/appearance customization options.

**Why it exists:**
- Visual customization
- Multiple outfit support
- Appearance progression
- Personalization

**Key Fields:**
- `companionId` (FK) - Outfit owner
- `name` - Outfit name
- `imageUrl` - Full outfit image
- `previewUrl` - Thumbnail
- `colorScheme` (JSON) - Color palette
- `accessories` (JSON) - Equipment/accessories
- `style` - casual, formal, sporty, etc
- `isDefault` - Default outfit
- `isUnlocked` - Available or locked

**Relationships:**
```
Outfit (1) ──→ Companion (1)
```

**Indexes:**
- `companionId` - All outfits for companion
- `(companionId, name)` - Unique outfit lookup
- `isDefault` - Default outfit lookup

**Unique Constraints:**
- `(companionId, name)` - Unique names per companion

**Soft Delete:** No

**Scaling Notes:**
- Multiple outfits per companion
- S3 storage for images

---

## Design Patterns

### 1. Soft Deletes

Implemented via `deletedAt` timestamp:

```sql
-- Query active records
SELECT * FROM users WHERE deletedAt IS NULL;

-- Soft delete
UPDATE users SET deletedAt = NOW() WHERE id = '...';

-- Hard delete (rare)
DELETE FROM users WHERE id = '...';
```

**Benefits:**
- Data recovery capability
- Audit trails
- Referential integrity
- GDPR compliance (delayed deletion)

---

### 2. Denormalized Counts

Fields like `messageCount`, `totalInteractions`:

```typescript
// Increment on message create
const count = await prisma.conversation.update({
  where: { id: conversationId },
  data: { messageCount: { increment: 1 } },
});
```

**Benefits:**
- Avoid expensive COUNT queries
- Real-time statistics
- Better performance

---

### 3. UUID Generation

Using Prisma's `cuid()` function:

```typescript
// Automatically generated
const user = await prisma.user.create({
  data: { email: 'user@example.com' },
  // id is auto-generated
});
```

**Benefits:**
- Distributed system friendly
- Non-sequential (security)
- Collision-free across databases

---

### 4. JSON Fields

For semi-structured data:

```typescript
// Store complex data
const companion = await prisma.companion.create({
  data: {
    personality: JSON.stringify({
      traits: ['kind', 'witty'],
      values: ['honesty', 'creativity'],
    }),
  },
});

// Query JSON (PostgreSQL-specific)
// SELECT * FROM companions
// WHERE personality->>'traits' LIKE '%kind%';
```

**Benefits:**
- Schema flexibility
- Avoid many columns
- Type safety with TypeScript

---

### 5. Relationship Cascade

Foreign key constraints:

```prisma
// Cascade delete
companion Companion @relation(fields: [companionId], references: [id], onDelete: Cascade)

// Set null on delete
user User @relation(fields: [userId], references: [id], onDelete: SetNull)
```

**Benefits:**
- Automatic cleanup
- Prevent orphaned records
- Maintain referential integrity

---

## Scaling Considerations

### 1. Partitioning Strategy

**By Date (Time-Series Data):**
- `Message` table - Partition by conversation or date
- `AnalyticsEvent` table - Monthly partitions
- `Weather` table - Keep recent, archive old

**By ID (Distribution):**
- `User` table - Partition by region or shard
- `Companion` table - Partition by userId
- `Memory` table - Partition by companionId

### 2. Archival Strategy

Tables requiring cleanup:
- `Message` - Archive after 2 years
- `AnalyticsEvent` - Archive after 1 year
- `VoiceSession` - Archive after 6 months
- `Notification` - Delete after 30 days (read)
- `AnalyticsEvent` - Sample after 30 days

### 3. Caching Strategy

Frequently accessed:
- `User` - Cache authentication
- `Companion` - Cache profile
- `Relationship` - Cache affection scores
- `Device` - Cache push tokens
- `Activity` - Cache whole catalog

### 4. Indexing Strategy

**Write-Heavy Tables:**
- `Message` - Few indexes (primary key only)
- `AnalyticsEvent` - Minimal indexes
- `Notification` - Index on userId and status only

**Read-Heavy Tables:**
- `User` - Multiple indexes (email, username, status)
- `Companion` - Multiple indexes (userId, status)
- `Relationship` - Composite indexes

---

## Migration Strategy

### Initial Setup

```bash
# Create migration
npx prisma migrate dev --name initial_schema

# Push to production
npx prisma migrate deploy
```

### Adding Columns

```bash
# Add optional column
npx prisma migrate dev --name add_field_to_table

# Backfill data
# Update existing records manually

# Make NOT NULL if needed
npx prisma migrate dev --name make_field_required
```

### Renaming Tables/Columns

```bash
# Create backup first
# Use raw SQL migration
# Update application code
# Verify in staging
# Deploy to production
```

---

## Performance Tips

1. **Always filter by status and deletedAt**
   ```sql
   WHERE status = 'ACTIVE' AND deletedAt IS NULL
   ```

2. **Use LIMIT and OFFSET for pagination**
   ```sql
   LIMIT 20 OFFSET 0
   ```

3. **Batch operations**
   ```typescript
   await prisma.message.createMany({ data: messages });
   ```

4. **Denormalize frequently accessed data**
   - Duplicate counts
   - Cache important fields
   - Update async

5. **Archive old data**
   - Move to cold storage
   - Keep recent in hot
   - Use separate table if needed

6. **Monitor query performance**
   - Use slow query logs
   - Monitor index usage
   - Analyze query plans

---

## Compliance & Security

1. **GDPR Compliance**
   - Soft deletes support delayed deletion
   - Audit trail via timestamps
   - User data isolation

2. **Data Privacy**
   - Encryption at rest (managed by provider)
   - Encryption in transit (TLS)
   - PII in separate fields

3. **Audit Trails**
   - Timestamps on all tables
   - User tracking on mutations
   - Event logging via AnalyticsEvent

4. **Backup Strategy**
   - Daily backups (managed)
   - Point-in-time recovery
   - Separate backup database

---

## Summary

**17 Core Tables:**
- 5 core domain entities (User, Companion, Relationship, Conversation, Message)
- 6 memory/history entities (Memory, Moment, Notification, Device, VoiceSession, AnalyticsEvent)
- 6 world/environment entities (WorldState, Scene, Weather, Activity, CompanionActivity, Outfit)

**Key Characteristics:**
- ✅ UUID primary keys
- ✅ Timestamps on every table
- ✅ Soft deletes where applicable
- ✅ Strategic indexing
- ✅ Type-safe enums
- ✅ JSON for flexibility
- ✅ Denormalized counts
- ✅ Scalability-first design
- ✅ GDPR compliance ready
- ✅ Multi-device support

**Ready for production deployment with millions of users.**

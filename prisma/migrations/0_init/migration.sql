-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'MODERATOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "CompanionStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "RelationshipLevel" AS ENUM ('STRANGER', 'ACQUAINTANCE', 'FRIEND', 'CLOSE_FRIEND', 'BEST_FRIEND', 'INTIMATE');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'COMPANION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('EPISODIC', 'SEMANTIC', 'PROCEDURAL');

-- CreateEnum
CREATE TYPE "MemoryImportance" AS ENUM ('TRIVIAL', 'MINOR', 'MODERATE', 'SIGNIFICANT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MomentType" AS ENUM ('FIRST_MEETING', 'MILESTONE_REACHED', 'EMOTIONAL_CONNECTION', 'ACHIEVEMENT', 'MEMORY_FORMED', 'ANNIVERSARY', 'SIGNIFICANT_CONVERSATION');

-- CreateEnum
CREATE TYPE "MomentCategory" AS ENUM ('RELATIONSHIP', 'ACHIEVEMENT', 'MEMORY', 'CONVERSATION', 'EVENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COMPANION_MESSAGE', 'REMINDER', 'MILESTONE', 'SYSTEM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CONVERSATION', 'GAME', 'EXERCISE', 'LEARNING', 'CREATIVE', 'RELAXATION', 'SOCIAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "WeatherCondition" AS ENUM ('CLEAR', 'CLOUDY', 'RAINY', 'SNOWY', 'STORMY', 'FOGGY', 'WINDY');

-- CreateEnum
CREATE TYPE "SceneType" AS ENUM ('INDOOR', 'OUTDOOR', 'ABSTRACT', 'FANTASY', 'SCI_FI', 'CUSTOM');

-- CreateEnum
CREATE TYPE "VoiceSessionStatus" AS ENUM ('INITIATED', 'CONNECTING', 'ACTIVE', 'ENDED', 'FAILED');

-- CreateEnum
CREATE TYPE "VoiceSessionType" AS ENUM ('CALL', 'MESSAGE', 'TRANSCRIPTION');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'DESKTOP', 'TABLET', 'WEARABLE', 'WEB');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firebaseUid" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "privacyLevel" TEXT NOT NULL DEFAULT 'friends',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Companion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatar" TEXT,
    "personality" TEXT,
    "background" TEXT,
    "status" "CompanionStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4',
    "systemPrompt" TEXT,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "affectionLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastInteractionAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Companion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "status" "RelationshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "level" "RelationshipLevel" NOT NULL DEFAULT 'STRANGER',
    "affectionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "familiarityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstInteractionAt" TIMESTAMP(3),
    "lastInteractionAt" TIMESTAMP(3),
    "totalInteractions" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "tags" TEXT,
    "customData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldState" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "currentScene" TEXT,
    "timeOfDay" TEXT NOT NULL DEFAULT 'day',
    "season" TEXT NOT NULL DEFAULT 'spring',
    "globalMood" TEXT,
    "gravity" DOUBLE PRECISION NOT NULL DEFAULT 9.8,
    "timeScale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "dayLengthHours" DOUBLE PRECISION NOT NULL DEFAULT 24,
    "customData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "SceneType" NOT NULL DEFAULT 'INDOOR',
    "imageUrl" TEXT,
    "ambiance" TEXT,
    "populationDensity" TEXT,
    "dangerLevel" INTEGER NOT NULL DEFAULT 0,
    "connectedSceneIds" TEXT,
    "customData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Weather" (
    "id" TEXT NOT NULL,
    "worldStateId" TEXT NOT NULL,
    "condition" "WeatherCondition" NOT NULL DEFAULT 'CLEAR',
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" SMALLINT NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "visibility" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION,
    "uvIndex" INTEGER,
    "pollutionLevel" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "forecastedAt" TIMESTAMP(3),
    "customData" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Weather_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ActivityType" NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "icon" TEXT,
    "category" TEXT,
    "difficulty" TEXT,
    "duration" TEXT,
    "minAffectionLevel" INTEGER,
    "maxAffectionLevel" INTEGER,
    "requiredTraits" TEXT,
    "restrictions" TEXT,
    "engagementBoost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "affectionChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanionActivity" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "timesPerformed" INTEGER NOT NULL DEFAULT 0,
    "lastPerformedAt" TIMESTAMP(3),
    "proficiencyLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT true,
    "customization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanionActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outfit" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "previewUrl" TEXT,
    "colorScheme" TEXT,
    "accessories" TEXT,
    "style" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT true,
    "unlockRequirement" TEXT,
    "customData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "title" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "context" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "tags" TEXT,
    "customData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "content" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "processingTimeMs" INTEGER,
    "editedAt" TIMESTAMP(3),
    "reactions" TEXT,
    "customData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MemoryType" NOT NULL,
    "importance" "MemoryImportance" NOT NULL DEFAULT 'MODERATE',
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "sourceConversationId" TEXT,
    "sourceEventType" TEXT,
    "context" TEXT,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "decayScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "lastAccessedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "tags" TEXT,
    "embedding" TEXT,
    "customData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Moment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "MomentType" NOT NULL,
    "category" "MomentCategory" NOT NULL,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "significance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "tags" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "canShare" BOOLEAN NOT NULL DEFAULT true,
    "eventData" TEXT,
    "customData" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Moment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'SENT',
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "deliveryAttempts" INTEGER NOT NULL DEFAULT 1,
    "lastDeliveryAttemptAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "readAt" TIMESTAMP(3),
    "actionTaken" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "expiresAt" TIMESTAMP(3),
    "customData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledFor" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL,
    "deviceName" TEXT,
    "osType" TEXT NOT NULL,
    "osVersion" TEXT,
    "appVersion" TEXT,
    "pushToken" TEXT,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSeenAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isTrusted" BOOLEAN NOT NULL DEFAULT false,
    "lastVerifiedAt" TIMESTAMP(3),
    "customData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "type" "VoiceSessionType" NOT NULL,
    "status" "VoiceSessionStatus" NOT NULL DEFAULT 'INITIATED',
    "title" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "voiceUrl" TEXT,
    "transcription" TEXT,
    "audioQuality" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "voiceModel" TEXT,
    "customData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VoiceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "category" TEXT,
    "properties" TEXT,
    "metrics" TEXT,
    "sessionId" TEXT,
    "deviceId" TEXT,
    "source" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "customData" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_firebaseUid_idx" ON "User"("firebaseUid");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "Companion_userId_idx" ON "Companion"("userId");

-- CreateIndex
CREATE INDEX "Companion_status_idx" ON "Companion"("status");

-- CreateIndex
CREATE INDEX "Companion_createdAt_idx" ON "Companion"("createdAt");

-- CreateIndex
CREATE INDEX "Companion_lastInteractionAt_idx" ON "Companion"("lastInteractionAt");

-- CreateIndex
CREATE INDEX "Companion_deletedAt_idx" ON "Companion"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Companion_userId_name_key" ON "Companion"("userId", "name");

-- CreateIndex
CREATE INDEX "Relationship_userId_idx" ON "Relationship"("userId");

-- CreateIndex
CREATE INDEX "Relationship_companionId_idx" ON "Relationship"("companionId");

-- CreateIndex
CREATE INDEX "Relationship_status_idx" ON "Relationship"("status");

-- CreateIndex
CREATE INDEX "Relationship_level_idx" ON "Relationship"("level");

-- CreateIndex
CREATE INDEX "Relationship_lastInteractionAt_idx" ON "Relationship"("lastInteractionAt");

-- CreateIndex
CREATE INDEX "Relationship_deletedAt_idx" ON "Relationship"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_userId_companionId_key" ON "Relationship"("userId", "companionId");

-- CreateIndex
CREATE UNIQUE INDEX "WorldState_companionId_key" ON "WorldState"("companionId");

-- CreateIndex
CREATE INDEX "WorldState_companionId_idx" ON "WorldState"("companionId");

-- CreateIndex
CREATE INDEX "Scene_worldStateId_idx" ON "Scene"("worldStateId");

-- CreateIndex
CREATE INDEX "Scene_companionId_idx" ON "Scene"("companionId");

-- CreateIndex
CREATE INDEX "Scene_type_idx" ON "Scene"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Scene_worldStateId_name_key" ON "Scene"("worldStateId", "name");

-- CreateIndex
CREATE INDEX "Weather_worldStateId_idx" ON "Weather"("worldStateId");

-- CreateIndex
CREATE INDEX "Weather_condition_idx" ON "Weather"("condition");

-- CreateIndex
CREATE INDEX "Weather_isCurrent_idx" ON "Weather"("isCurrent");

-- CreateIndex
CREATE INDEX "Weather_recordedAt_idx" ON "Weather"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_name_key" ON "Activity"("name");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_status_idx" ON "Activity"("status");

-- CreateIndex
CREATE INDEX "CompanionActivity_companionId_idx" ON "CompanionActivity"("companionId");

-- CreateIndex
CREATE INDEX "CompanionActivity_activityId_idx" ON "CompanionActivity"("activityId");

-- CreateIndex
CREATE INDEX "CompanionActivity_lastPerformedAt_idx" ON "CompanionActivity"("lastPerformedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanionActivity_companionId_activityId_key" ON "CompanionActivity"("companionId", "activityId");

-- CreateIndex
CREATE INDEX "Outfit_companionId_idx" ON "Outfit"("companionId");

-- CreateIndex
CREATE INDEX "Outfit_isDefault_idx" ON "Outfit"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "Outfit_companionId_name_key" ON "Outfit"("companionId", "name");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Conversation_companionId_idx" ON "Conversation"("companionId");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_deletedAt_idx" ON "Conversation"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_userId_companionId_key" ON "Conversation"("userId", "companionId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- CreateIndex
CREATE INDEX "Message_companionId_idx" ON "Message"("companionId");

-- CreateIndex
CREATE INDEX "Message_role_idx" ON "Message"("role");

-- CreateIndex
CREATE INDEX "Message_status_idx" ON "Message"("status");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_deletedAt_idx" ON "Message"("deletedAt");

-- CreateIndex
CREATE INDEX "Memory_companionId_idx" ON "Memory"("companionId");

-- CreateIndex
CREATE INDEX "Memory_userId_idx" ON "Memory"("userId");

-- CreateIndex
CREATE INDEX "Memory_type_idx" ON "Memory"("type");

-- CreateIndex
CREATE INDEX "Memory_importance_idx" ON "Memory"("importance");

-- CreateIndex
CREATE INDEX "Memory_lastAccessedAt_idx" ON "Memory"("lastAccessedAt");

-- CreateIndex
CREATE INDEX "Memory_createdAt_idx" ON "Memory"("createdAt");

-- CreateIndex
CREATE INDEX "Memory_deletedAt_idx" ON "Memory"("deletedAt");

-- CreateIndex
CREATE INDEX "Moment_userId_idx" ON "Moment"("userId");

-- CreateIndex
CREATE INDEX "Moment_companionId_idx" ON "Moment"("companionId");

-- CreateIndex
CREATE INDEX "Moment_type_idx" ON "Moment"("type");

-- CreateIndex
CREATE INDEX "Moment_category_idx" ON "Moment"("category");

-- CreateIndex
CREATE INDEX "Moment_significance_idx" ON "Moment"("significance");

-- CreateIndex
CREATE INDEX "Moment_occurredAt_idx" ON "Moment"("occurredAt");

-- CreateIndex
CREATE INDEX "Moment_isPublic_idx" ON "Moment"("isPublic");

-- CreateIndex
CREATE INDEX "Moment_deletedAt_idx" ON "Moment"("deletedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_deletedAt_idx" ON "Notification"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Device_pushToken_key" ON "Device"("pushToken");

-- CreateIndex
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

-- CreateIndex
CREATE INDEX "Device_status_idx" ON "Device"("status");

-- CreateIndex
CREATE INDEX "Device_lastSeenAt_idx" ON "Device"("lastSeenAt");

-- CreateIndex
CREATE INDEX "Device_deletedAt_idx" ON "Device"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Device_userId_deviceId_key" ON "Device"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "VoiceSession_userId_idx" ON "VoiceSession"("userId");

-- CreateIndex
CREATE INDEX "VoiceSession_companionId_idx" ON "VoiceSession"("companionId");

-- CreateIndex
CREATE INDEX "VoiceSession_type_idx" ON "VoiceSession"("type");

-- CreateIndex
CREATE INDEX "VoiceSession_status_idx" ON "VoiceSession"("status");

-- CreateIndex
CREATE INDEX "VoiceSession_startedAt_idx" ON "VoiceSession"("startedAt");

-- CreateIndex
CREATE INDEX "VoiceSession_createdAt_idx" ON "VoiceSession"("createdAt");

-- CreateIndex
CREATE INDEX "VoiceSession_deletedAt_idx" ON "VoiceSession"("deletedAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventName_idx" ON "AnalyticsEvent"("eventName");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_category_idx" ON "AnalyticsEvent"("category");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "AnalyticsEvent"("timestamp");

-- AddForeignKey
ALTER TABLE "Companion" ADD CONSTRAINT "Companion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldState" ADD CONSTRAINT "WorldState_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weather" ADD CONSTRAINT "Weather_worldStateId_fkey" FOREIGN KEY ("worldStateId") REFERENCES "WorldState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanionActivity" ADD CONSTRAINT "CompanionActivity_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanionActivity" ADD CONSTRAINT "CompanionActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outfit" ADD CONSTRAINT "Outfit_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Moment" ADD CONSTRAINT "Moment_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


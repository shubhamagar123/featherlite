-- CreateTable Outbox (Event Durability)
CREATE TABLE "Outbox" (
    "id" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex on Outbox
CREATE INDEX "Outbox_status_createdAt_idx" ON "Outbox"("status", "createdAt");
CREATE INDEX "Outbox_aggregateId_idx" ON "Outbox"("aggregateId");
CREATE INDEX "Outbox_eventType_idx" ON "Outbox"("eventType");
CREATE INDEX "Outbox_publishedAt_idx" ON "Outbox"("publishedAt");
CREATE INDEX "Outbox_deletedAt_idx" ON "Outbox"("deletedAt");

-- CreateTable ProcessedEvents (Idempotency)
CREATE TABLE "ProcessedEvents" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "handlerId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex on ProcessedEvents
CREATE UNIQUE INDEX "ProcessedEvents_eventId_handlerId_key" ON "ProcessedEvents"("eventId", "handlerId");
CREATE INDEX "ProcessedEvents_eventId_idx" ON "ProcessedEvents"("eventId");
CREATE INDEX "ProcessedEvents_handlerId_idx" ON "ProcessedEvents"("handlerId");
CREATE INDEX "ProcessedEvents_processedAt_idx" ON "ProcessedEvents"("processedAt");

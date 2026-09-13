-- Add OTP-based phone login identity, plus Planner Events and Nudge
-- Preferences for the Layer 5 (Interaction) HTTP API.
--
-- NOTE: `prisma migrate diff` against the live schema also surfaced a
-- pre-existing, unrelated drift (the DeadLetterEvents model has no migration
-- of its own yet). That gap predates this change and is intentionally left
-- out of this migration to keep it scoped to phone/planner/nudge only.

-- CreateEnum
CREATE TYPE "PlannerEventStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NudgeFrequency" AS ENUM ('IMMEDIATE', 'DAILY', 'WEEKLY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneNumber" TEXT;

-- CreateTable
CREATE TABLE "PlannerEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "PlannerEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PlannerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NudgePreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nudgeType" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "NudgeFrequency" NOT NULL DEFAULT 'DAILY',
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "NudgePreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "PlannerEvent_userId_idx" ON "PlannerEvent"("userId");

-- CreateIndex
CREATE INDEX "PlannerEvent_companionId_idx" ON "PlannerEvent"("companionId");

-- CreateIndex
CREATE INDEX "PlannerEvent_scheduledFor_idx" ON "PlannerEvent"("scheduledFor");

-- CreateIndex
CREATE INDEX "PlannerEvent_status_idx" ON "PlannerEvent"("status");

-- CreateIndex
CREATE INDEX "PlannerEvent_deletedAt_idx" ON "PlannerEvent"("deletedAt");

-- CreateIndex
CREATE INDEX "NudgePreference_userId_idx" ON "NudgePreference"("userId");

-- CreateIndex
CREATE INDEX "NudgePreference_deletedAt_idx" ON "NudgePreference"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NudgePreference_userId_nudgeType_key" ON "NudgePreference"("userId", "nudgeType");

-- AddForeignKey
ALTER TABLE "PlannerEvent" ADD CONSTRAINT "PlannerEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerEvent" ADD CONSTRAINT "PlannerEvent_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "Companion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NudgePreference" ADD CONSTRAINT "NudgePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

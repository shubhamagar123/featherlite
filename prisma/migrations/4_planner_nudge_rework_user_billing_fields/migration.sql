-- Planner/Nudge rework + new User profile/billing fields.
-- NOTE: `prisma migrate diff` also reported a pre-existing, unrelated drift
-- (a `DeadLetterEvents` table with no migration of its own, even though the
-- Prisma model and application code for it already exist). That drift is
-- intentionally excluded here to keep this migration scoped to the
-- planner/nudge/user/billing changes it's named for.

-- CreateEnum
CREATE TYPE "PlannerEventSource" AS ENUM ('USER_STATED', 'INFERRED');

-- CreateEnum
CREATE TYPE "BillingTier" AS ENUM ('FREE', 'PREMIUM');

-- DropIndex
DROP INDEX "NudgePreference_userId_nudgeType_key";

-- DropIndex
DROP INDEX "PlannerEvent_scheduledFor_idx";

-- NudgePreference: replace generic (nudgeType, enabled, frequency,
-- quietHours*) rows with one row per user holding a simple boolean per
-- category (care_hydration, people_to_remember, checking_in).
ALTER TABLE "NudgePreference" DROP COLUMN "enabled",
DROP COLUMN "frequency",
DROP COLUMN "nudgeType",
DROP COLUMN "quietHoursEnd",
DROP COLUMN "quietHoursStart",
ADD COLUMN     "careHydration" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "checkingIn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "peopleToRemember" BOOLEAN NOT NULL DEFAULT true;

-- PlannerEvent: rename scheduledFor -> eventDate, add recurrence,
-- kaiSuggestionText, createdFrom per the product spec's field set.
ALTER TABLE "PlannerEvent" DROP COLUMN "scheduledFor",
ADD COLUMN     "createdFrom" "PlannerEventSource" NOT NULL DEFAULT 'USER_STATED',
ADD COLUMN     "eventDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "kaiSuggestionText" TEXT,
ADD COLUMN     "recurrence" TEXT;

-- User: profile screen fields + billing tier.
ALTER TABLE "User" ADD COLUMN     "activeCompanion" TEXT NOT NULL DEFAULT 'kai',
ADD COLUMN     "addressTerm" TEXT,
ADD COLUMN     "billingTier" "BillingTier" NOT NULL DEFAULT 'FREE';

-- DropEnum
DROP TYPE "NudgeFrequency";

-- CreateIndex
CREATE UNIQUE INDEX "NudgePreference_userId_key" ON "NudgePreference"("userId");

-- CreateIndex
CREATE INDEX "PlannerEvent_eventDate_idx" ON "PlannerEvent"("eventDate");

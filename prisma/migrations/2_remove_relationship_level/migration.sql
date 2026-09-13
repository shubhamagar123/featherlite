-- Remove staged relationship "level" concept.
--
-- Relationship closeness is now an emergent read computed at query time from
-- raw signals (firstInteractionAt, totalInteractions, consented memory count,
-- affection/trust/familiarity scores) rather than a persisted named stage.
-- See src/engines/relationship/README.md.

-- DropIndex
DROP INDEX IF EXISTS "Relationship_level_idx";

-- AlterTable
ALTER TABLE "Relationship" DROP COLUMN IF EXISTS "level";

-- DropEnum
DROP TYPE IF EXISTS "RelationshipLevel";

-- Existing projects start at version 1. Reversible: ALTER TABLE "Project" DROP COLUMN "version";.
ALTER TABLE "Project" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

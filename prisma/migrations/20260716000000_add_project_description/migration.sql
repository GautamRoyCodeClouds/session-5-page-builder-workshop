-- Add an optional page-description column. The column is nullable, so existing
-- projects retain a NULL description and continue to publish unchanged. The
-- change is reversible: `ALTER TABLE "Project" DROP COLUMN "description";`.
ALTER TABLE "Project" ADD COLUMN "description" VARCHAR(300);

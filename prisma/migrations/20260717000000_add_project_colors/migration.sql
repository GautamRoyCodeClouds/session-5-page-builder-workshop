-- Add optional text/button color columns. Both are nullable, so existing
-- projects keep NULL colors and continue to publish with the default palette.
-- Reversible: `ALTER TABLE "Project" DROP COLUMN "textColor", DROP COLUMN "buttonColor";`.
ALTER TABLE "Project" ADD COLUMN "textColor" VARCHAR(7),
ADD COLUMN "buttonColor" VARCHAR(7);

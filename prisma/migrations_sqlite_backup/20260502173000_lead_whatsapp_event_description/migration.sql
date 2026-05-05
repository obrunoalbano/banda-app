-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "Lead" ADD COLUMN "eventDescription" TEXT;

-- Backfill from previous columns when available
UPDATE "Lead" SET "whatsapp" = "phone" WHERE "phone" IS NOT NULL;
UPDATE "Lead" SET "eventDescription" = "guestCount" WHERE "guestCount" IS NOT NULL;

-- Remove old columns
ALTER TABLE "Lead" DROP COLUMN "phone";
ALTER TABLE "Lead" DROP COLUMN "guestCount";

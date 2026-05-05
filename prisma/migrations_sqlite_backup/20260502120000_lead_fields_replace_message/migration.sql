-- AlterTable
ALTER TABLE "Lead" DROP COLUMN "message";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "eventDate" TEXT;
ALTER TABLE "Lead" ADD COLUMN "city" TEXT;
ALTER TABLE "Lead" ADD COLUMN "eventType" TEXT;
ALTER TABLE "Lead" ADD COLUMN "guestCount" TEXT;

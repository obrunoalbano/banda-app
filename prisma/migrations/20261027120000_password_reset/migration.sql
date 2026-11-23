-- AlterTable
ALTER TABLE "Band" ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Band_passwordResetTokenHash_key" ON "Band"("passwordResetTokenHash");

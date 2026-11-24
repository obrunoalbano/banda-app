-- AlterTable
ALTER TABLE "Band" ADD COLUMN     "inviteLinkNonce" TEXT,
ADD COLUMN     "inviteLinkRole" "BandRole" NOT NULL DEFAULT 'VIEWER';

-- CreateIndex
CREATE UNIQUE INDEX "Band_inviteLinkNonce_key" ON "Band"("inviteLinkNonce");


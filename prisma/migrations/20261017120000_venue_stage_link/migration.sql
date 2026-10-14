-- Liga a casa da banda ao palco do diretório (Explorar Palcos). Só adições.
-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "stageId" TEXT;

-- CreateIndex
CREATE INDEX "Venue_stageId_idx" ON "Venue"("stageId");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_bandId_stageId_key" ON "Venue"("bandId", "stageId");

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;


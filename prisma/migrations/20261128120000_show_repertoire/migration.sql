-- AlterTable
ALTER TABLE "Show" ADD COLUMN     "repertoireId" TEXT,
ADD COLUMN     "songOrder" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Show_repertoireId_idx" ON "Show"("repertoireId");

-- AddForeignKey
ALTER TABLE "Show" ADD CONSTRAINT "Show_repertoireId_fkey" FOREIGN KEY ("repertoireId") REFERENCES "Repertoire"("id") ON DELETE SET NULL ON UPDATE CASCADE;


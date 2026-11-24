-- CreateEnum
CREATE TYPE "RehearsalSongStatus" AS ENUM ('REHEARSED', 'MISSED');

-- AlterTable
ALTER TABLE "Rehearsal" ADD COLUMN     "songOrder" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "RehearsalSongCheck" (
    "id" TEXT NOT NULL,
    "rehearsalId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "occurrenceDate" TIMESTAMP(3) NOT NULL,
    "status" "RehearsalSongStatus" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RehearsalSongCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RehearsalSongCheck_songId_idx" ON "RehearsalSongCheck"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "RehearsalSongCheck_rehearsalId_songId_occurrenceDate_key" ON "RehearsalSongCheck"("rehearsalId", "songId", "occurrenceDate");

-- AddForeignKey
ALTER TABLE "RehearsalSongCheck" ADD CONSTRAINT "RehearsalSongCheck_rehearsalId_fkey" FOREIGN KEY ("rehearsalId") REFERENCES "Rehearsal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehearsalSongCheck" ADD CONSTRAINT "RehearsalSongCheck_songId_fkey" FOREIGN KEY ("songId") REFERENCES "RepertoireSong"("id") ON DELETE CASCADE ON UPDATE CASCADE;


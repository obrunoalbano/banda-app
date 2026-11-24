-- CreateEnum
CREATE TYPE "RehearsalRecurrence" AS ENUM ('NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('CONFIRMED', 'DECLINED');

-- CreateTable
CREATE TABLE "Repertoire" (
    "id" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repertoire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepertoireSong" (
    "id" TEXT NOT NULL,
    "repertoireId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "artists" TEXT,
    "spotifyUrl" TEXT,
    "spotifyTrackId" TEXT,
    "imageUrl" TEXT,
    "durationMs" INTEGER,
    "notes" TEXT,

    CONSTRAINT "RepertoireSong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rehearsal" (
    "id" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "recurrence" "RehearsalRecurrence" NOT NULL DEFAULT 'NONE',
    "recurrenceUntil" TIMESTAMP(3),
    "repertoireId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rehearsal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RehearsalAttendance" (
    "id" TEXT NOT NULL,
    "rehearsalId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "occurrenceDate" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RehearsalAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Repertoire_bandId_name_idx" ON "Repertoire"("bandId", "name");

-- CreateIndex
CREATE INDEX "RepertoireSong_repertoireId_position_idx" ON "RepertoireSong"("repertoireId", "position");

-- CreateIndex
CREATE INDEX "Rehearsal_bandId_date_idx" ON "Rehearsal"("bandId", "date");

-- CreateIndex
CREATE INDEX "RehearsalAttendance_memberId_idx" ON "RehearsalAttendance"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "RehearsalAttendance_rehearsalId_memberId_occurrenceDate_key" ON "RehearsalAttendance"("rehearsalId", "memberId", "occurrenceDate");

-- AddForeignKey
ALTER TABLE "Repertoire" ADD CONSTRAINT "Repertoire_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepertoireSong" ADD CONSTRAINT "RepertoireSong_repertoireId_fkey" FOREIGN KEY ("repertoireId") REFERENCES "Repertoire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rehearsal" ADD CONSTRAINT "Rehearsal_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rehearsal" ADD CONSTRAINT "Rehearsal_repertoireId_fkey" FOREIGN KEY ("repertoireId") REFERENCES "Repertoire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehearsalAttendance" ADD CONSTRAINT "RehearsalAttendance_rehearsalId_fkey" FOREIGN KEY ("rehearsalId") REFERENCES "Rehearsal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehearsalAttendance" ADD CONSTRAINT "RehearsalAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "BandMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;


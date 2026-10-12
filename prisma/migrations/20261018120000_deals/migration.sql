-- CreateEnum
CREATE TYPE "DealStep" AS ENUM ('PRIMEIRO_CONTATO', 'PROPOSTA', 'PERDEU', 'GANHOU');

-- CreateEnum
CREATE TYPE "DealSource" AS ENUM ('CONTATO', 'EXPLORADOR');

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "step" "DealStep" NOT NULL DEFAULT 'PRIMEIRO_CONTATO',
    "source" "DealSource" NOT NULL,
    "leadId" TEXT,
    "stageId" TEXT,
    "venueId" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "stepChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deal_bandId_step_stepChangedAt_idx" ON "Deal"("bandId", "step", "stepChangedAt");

-- CreateIndex
CREATE INDEX "Deal_leadId_idx" ON "Deal"("leadId");

-- CreateIndex
CREATE INDEX "Deal_stageId_idx" ON "Deal"("stageId");

-- CreateIndex
CREATE INDEX "Deal_venueId_idx" ON "Deal"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_bandId_leadId_key" ON "Deal"("bandId", "leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_bandId_stageId_key" ON "Deal"("bandId", "stageId");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;


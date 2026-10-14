-- Campos para importação em lote de palcos (base da equipe) e novo tipo Teatro. Só adições.
-- AlterEnum
ALTER TYPE "StageType" ADD VALUE 'TEATRO';

-- AlterTable
ALTER TABLE "Stage" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "externalSource" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "whatsapp" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Stage_externalSource_externalId_key" ON "Stage"("externalSource", "externalId");


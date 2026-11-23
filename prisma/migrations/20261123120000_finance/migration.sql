-- CreateEnum
CREATE TYPE "FinanceEntryType" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "FinanceCategory" AS ENUM ('TRANSPORTE', 'ALIMENTACAO', 'HOSPEDAGEM', 'SOM_E_LUZ', 'MUSICO_FREELANCER', 'EQUIPE', 'COMISSAO', 'EQUIPAMENTO', 'ENSAIO', 'DIVULGACAO', 'TAXAS_E_IMPOSTOS', 'CACHE_EXTRA', 'MERCH', 'PATROCINIO', 'DIREITOS_AUTORAIS', 'OUTROS');

-- AlterTable
ALTER TABLE "Show" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentDueDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FinanceEntry" (
    "id" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "type" "FinanceEntryType" NOT NULL,
    "category" "FinanceCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "showId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceEntry_bandId_date_idx" ON "FinanceEntry"("bandId", "date");

-- CreateIndex
CREATE INDEX "FinanceEntry_showId_idx" ON "FinanceEntry"("showId");

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill (manual): shows já marcados como pagos não têm data de recebimento; usa a data do show.
UPDATE "Show" SET "paidAt" = "date" WHERE "paymentStatus" = 'PAGO' AND "paidAt" IS NULL;

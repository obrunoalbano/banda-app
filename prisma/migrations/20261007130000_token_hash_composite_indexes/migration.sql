-- Token de ingestão de leads: guarda só o SHA-256 (hex).
-- Tokens existentes são convertidos in-place, então integrações já configuradas continuam funcionando.
ALTER TABLE "Band" RENAME COLUMN "leadIngestToken" TO "leadIngestTokenHash";
UPDATE "Band"
SET "leadIngestTokenHash" = encode(sha256(convert_to("leadIngestTokenHash", 'UTF8')), 'hex')
WHERE "leadIngestTokenHash" IS NOT NULL;
ALTER INDEX "Band_leadIngestToken_key" RENAME TO "Band_leadIngestTokenHash_key";

-- Índices compostos alinhados às queries (sempre filtradas por bandId + ordenação/filtro).
DROP INDEX "Venue_bandId_idx";
CREATE INDEX "Venue_bandId_updatedAt_idx" ON "Venue"("bandId", "updatedAt");
CREATE INDEX "Venue_bandId_city_idx" ON "Venue"("bandId", "city");

DROP INDEX "Show_bandId_idx";
DROP INDEX "Show_date_idx";
CREATE INDEX "Show_bandId_date_idx" ON "Show"("bandId", "date");

DROP INDEX "Lead_bandId_idx";
DROP INDEX "Lead_createdAt_idx";
CREATE INDEX "Lead_bandId_createdAt_idx" ON "Lead"("bandId", "createdAt");

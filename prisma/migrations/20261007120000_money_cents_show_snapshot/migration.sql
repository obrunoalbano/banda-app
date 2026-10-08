-- Dinheiro em centavos (Int) em vez de DOUBLE PRECISION.
-- Show passa a guardar o próprio cachê (snapshot), inclusive para shows em casa.
-- Casa com shows não pode mais ser apagada (FK NO ACTION em vez de CASCADE).

-- Venue.valorCache (reais, float) -> Venue.valorCacheCents (centavos, int)
ALTER TABLE "Venue" ADD COLUMN "valorCacheCents" INTEGER;
UPDATE "Venue" SET "valorCacheCents" = ROUND("valorCache" * 100)::INTEGER WHERE "valorCache" IS NOT NULL;
ALTER TABLE "Venue" DROP COLUMN "valorCache";

-- Show.privateValorCache -> Show.cacheCents (todos os shows)
ALTER TABLE "Show" ADD COLUMN "cacheCents" INTEGER;
-- Evento particular: usa o valor que já estava no show.
UPDATE "Show" SET "cacheCents" = ROUND("privateValorCache" * 100)::INTEGER
WHERE "venueId" IS NULL AND "privateValorCache" IS NOT NULL;
-- Show em casa: congela o cachê atual da casa (é o valor que a UI exibia até aqui).
UPDATE "Show" AS s SET "cacheCents" = v."valorCacheCents"
FROM "Venue" AS v
WHERE s."venueId" = v."id" AND v."valorCacheCents" IS NOT NULL;
ALTER TABLE "Show" DROP COLUMN "privateValorCache";

-- FK Show.venueId: CASCADE -> NO ACTION
ALTER TABLE "Show" DROP CONSTRAINT "Show_venueId_fkey";
ALTER TABLE "Show" ADD CONSTRAINT "Show_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

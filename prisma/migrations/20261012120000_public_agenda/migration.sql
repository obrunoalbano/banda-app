-- Agenda pública: slug da banda, opt-in e campos de publicação do show.

-- Band.slug: gerado a partir do nome (minúsculas, sem acento, só [a-z0-9-]).
-- Nomes repetidos recebem sufixo -2, -3… (por ordem de cadastro).
ALTER TABLE "Band" ADD COLUMN "slug" TEXT;
ALTER TABLE "Band" ADD COLUMN "publicAgendaEnabled" BOOLEAN NOT NULL DEFAULT false;

WITH base AS (
  SELECT
    id,
    "createdAt",
    COALESCE(
      NULLIF(
        left(
          trim(BOTH '-' FROM regexp_replace(
            translate(lower(name), 'áàâãäåéèêëíìîïóòôõöúùûüçñý', 'aaaaaaeeeeiiiiooooouuuucny'),
            '[^a-z0-9]+', '-', 'g'
          )),
          45
        ),
        ''
      ),
      'banda'
    ) AS s
  FROM "Band"
),
ranked AS (
  SELECT id, s, row_number() OVER (PARTITION BY s ORDER BY "createdAt", id) AS n FROM base
)
UPDATE "Band" AS b
SET "slug" = CASE WHEN r.n = 1 THEN r.s ELSE r.s || '-' || r.n END
FROM ranked AS r
WHERE b.id = r.id;

ALTER TABLE "Band" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Band_slug_key" ON "Band"("slug");

-- Show: visibilidade pública, link de ingressos e cancelamento.
ALTER TABLE "Show" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Show" ADD COLUMN "ticketUrl" TEXT;
ALTER TABLE "Show" ADD COLUMN "cancelledAt" TIMESTAMP(3);
-- Padrão escolhido: shows em casa são públicos; eventos particulares ficam ocultos.
UPDATE "Show" SET "isPublic" = true WHERE "venueId" IS NOT NULL;

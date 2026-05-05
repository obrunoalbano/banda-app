-- AlterTable
ALTER TABLE "Band" ADD COLUMN "leadIngestToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Band_leadIngestToken_key" ON "Band"("leadIngestToken");

CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "metadata" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Lead_bandId_idx" ON "Lead"("bandId");
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

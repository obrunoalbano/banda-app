-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Show" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bandId" TEXT NOT NULL,
    "venueId" TEXT,
    "privateEventDetails" TEXT,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Show_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Show_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Show" ("bandId", "createdAt", "date", "id", "paymentStatus", "time", "updatedAt", "venueId") SELECT "bandId", "createdAt", "date", "id", "paymentStatus", "time", "updatedAt", "venueId" FROM "Show";
DROP TABLE "Show";
ALTER TABLE "new_Show" RENAME TO "Show";
CREATE INDEX "Show_bandId_idx" ON "Show"("bandId");
CREATE INDEX "Show_venueId_idx" ON "Show"("venueId");
CREATE INDEX "Show_date_idx" ON "Show"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

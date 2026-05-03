-- CreateTable
CREATE TABLE "Show" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bandId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Show_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Show_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Show_bandId_idx" ON "Show"("bandId");

-- CreateIndex
CREATE INDEX "Show_venueId_idx" ON "Show"("venueId");

-- CreateIndex
CREATE INDEX "Show_date_idx" ON "Show"("date");

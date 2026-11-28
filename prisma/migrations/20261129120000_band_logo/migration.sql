-- CreateTable
CREATE TABLE "BandLogo" (
    "bandId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BandLogo_pkey" PRIMARY KEY ("bandId")
);

-- AddForeignKey
ALTER TABLE "BandLogo" ADD CONSTRAINT "BandLogo_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;


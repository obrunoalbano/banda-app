-- Multi-bandas: a conta passa a ser User; a banda vira tenant com integrantes (BandMember).
-- Aditiva: as colunas de login da Band ficam (legado) e são copiadas para User com o MESMO id,
-- para que sessões (JWT com sub = id da banda) continuem válidas depois do deploy.

-- CreateEnum
CREATE TYPE "BandRole" AS ENUM ('ADMIN', 'VIEWER');

-- AlterTable
ALTER TABLE "Band" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "disabledAt" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetTokenHash" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BandMember" (
    "id" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "BandRole" NOT NULL DEFAULT 'VIEWER',
    "inviteTokenHash" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BandMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetTokenHash_key" ON "User"("passwordResetTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "BandMember_inviteTokenHash_key" ON "BandMember"("inviteTokenHash");

-- CreateIndex
CREATE INDEX "BandMember_userId_idx" ON "BandMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BandMember_bandId_email_key" ON "BandMember"("bandId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "BandMember_bandId_userId_key" ON "BandMember"("bandId", "userId");

-- AddForeignKey
ALTER TABLE "BandMember" ADD CONSTRAINT "BandMember_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandMember" ADD CONSTRAINT "BandMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill: cada banda existente vira um usuário (mesmo id) e administrador(a) da própria banda.
INSERT INTO "User" ("id", "name", "email", "phone", "passwordHash", "disabledAt", "mustChangePassword",
                    "passwordResetTokenHash", "passwordResetExpiresAt", "createdAt", "updatedAt")
SELECT b."id", b."responsible", b."email", NULLIF(b."phone", ''), b."passwordHash", b."disabledAt", b."mustChangePassword",
       b."passwordResetTokenHash", b."passwordResetExpiresAt", b."createdAt", CURRENT_TIMESTAMP
FROM "Band" b
WHERE b."email" IS NOT NULL AND b."passwordHash" IS NOT NULL;

INSERT INTO "BandMember" ("id", "bandId", "userId", "name", "email", "role", "joinedAt", "createdAt", "updatedAt")
SELECT 'mbr_' || b."id", b."id", b."id", b."responsible", b."email", 'ADMIN', b."createdAt", b."createdAt", CURRENT_TIMESTAMP
FROM "Band" b
WHERE b."email" IS NOT NULL AND b."passwordHash" IS NOT NULL;

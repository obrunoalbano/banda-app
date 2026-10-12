-- Painel superadmin: usuários da equipe (AdminUser), base curada de palcos (Stage)
-- e controle de conta das bandas (desativar, senha provisória). Só adições.
-- CreateEnum
CREATE TYPE "StageType" AS ENUM ('BAR', 'PUB', 'CASA_DE_SHOW', 'CENTRO_CULTURAL', 'RESTAURANTE', 'ESPACO_DE_EVENTOS', 'OUTRO');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Band" ADD COLUMN     "disabledAt" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "disabledAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "StageType" NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instagram" TEXT,
    "website" TEXT,
    "publicPhone" TEXT,
    "publicEmail" TEXT,
    "capacity" INTEGER,
    "notes" TEXT,
    "sourceNote" TEXT,
    "status" "StageStatus" NOT NULL DEFAULT 'DRAFT',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "Stage_status_state_city_idx" ON "Stage"("status", "state", "city");

-- CreateIndex
CREATE INDEX "Stage_updatedAt_idx" ON "Stage"("updatedAt");

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;


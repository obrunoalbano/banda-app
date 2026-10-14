-- Formulário de contato público: opt-in e domínios autorizados por banda.
ALTER TABLE "Band" ADD COLUMN "leadFormEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Band" ADD COLUMN "leadAllowedOrigins" TEXT[] DEFAULT ARRAY[]::TEXT[];

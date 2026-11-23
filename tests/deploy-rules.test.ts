import { describe, expect, it } from "vitest";
import { envKeys, migrationPlan, riskyStatements } from "../scripts/deploy-rules.mjs";

describe("riskyStatements", () => {
  it("migrations aditivas passam", () => {
    const sql = `-- AlterTable
ALTER TABLE "Show" ADD COLUMN "paidAt" TIMESTAMP(3);
CREATE TABLE "FinanceEntry" ("id" TEXT NOT NULL, CONSTRAINT "x" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "a" ON "Band"("b");
ALTER TABLE "Band" ADD COLUMN "flag" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Show" SET "paidAt" = "date" WHERE "paymentStatus" = 'PAGO';`;
    expect(riskyStatements(sql)).toEqual([]);
  });
  it("aponta remoção, renomeação, NOT NULL e exclusão de dados", () => {
    const sql = `ALTER TABLE "Show" DROP COLUMN "old";
ALTER TABLE "Show" RENAME COLUMN "a" TO "b";
ALTER TABLE "Show" ALTER COLUMN "x" SET NOT NULL;
ALTER TABLE "Show" ADD COLUMN "y" TEXT NOT NULL;
-- DROP TABLE "comentario";
DELETE FROM "Lead";`;
    expect(riskyStatements(sql).map((r) => r.reason)).toEqual([
      "remove estrutura",
      "renomeia",
      "torna coluna obrigatória",
      "coluna obrigatória sem DEFAULT",
      "apaga dados",
    ]);
  });
});

describe("envKeys e migrationPlan", () => {
  it("lê variáveis ativas e comentadas", () => {
    expect(envKeys('DATABASE_URL="x"\n# NEXT_PUBLIC_APP_URL="y"\n# comentário qualquer\nAUTH_SECRET=""')).toEqual([
      "DATABASE_URL",
      "NEXT_PUBLIC_APP_URL",
      "AUTH_SECRET",
    ]);
  });
  it("separa pendentes e desconhecidas", () => {
    expect(migrationPlan(["a", "c", "b"], ["a", "z"])).toEqual({ pending: ["b", "c"], unknown: ["z"] });
  });
});

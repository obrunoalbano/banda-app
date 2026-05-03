import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/app/generated/prisma/client";

function sqliteAbsolutePath(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!raw.startsWith("file:")) {
    return path.join(process.cwd(), "dev.db");
  }
  const rel = raw.slice("file:".length).replace(/^\.\//, "");
  if (path.isAbsolute(rel)) return rel;
  return path.join(process.cwd(), rel);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient() {
  const adapter = new PrismaBetterSqlite3({ url: sqliteAbsolutePath() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

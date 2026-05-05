import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** Proxy corporativo / antivírus que intercepta TLS → use DATABASE_SSL_REJECT_UNAUTHORIZED=false só em dev. */
function pgSslFromEnv(): { rejectUnauthorized: boolean } | undefined {
  const raw = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase();
  if (raw === "false" || raw === "0") {
    return { rejectUnauthorized: false };
  }
  if (raw === "true" || raw === "1") {
    return { rejectUnauthorized: true };
  }
  return undefined;
}

function createClient() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida");
  }
  const ssl = pgSslFromEnv();
  // Evita conflitos quando a connection string vem com `sslmode=require` (sem garantias no `pg`).
  // Quando estamos explicitamente dizendo para não validar o certificado, forçamos `ssl=true`.
  if (ssl?.rejectUnauthorized === false) {
    try {
      const u = new URL(connectionString);
      u.searchParams.delete("sslmode");
      u.searchParams.set("ssl", "true");
      connectionString = u.toString();
    } catch {
      // Se não conseguir parsear, seguimos com o connectionString original.
    }
  }
  const adapter =
    ssl !== undefined
      ? new PrismaPg({ connectionString, ssl })
      : new PrismaPg(connectionString);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

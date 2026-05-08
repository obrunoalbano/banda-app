import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/**
 * TLS com cadeia não confiável (proxy corporativo, etc.).
 * Na Vercel, defina `DATABASE_SSL_REJECT_UNAUTHORIZED=false` se aparecer P1011 self-signed chain.
 */
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

function sanitizeConnectionStringForInsecureTls(connectionString: string): string {
  try {
    const u = new URL(connectionString);
    u.searchParams.delete("sslmode");
    u.searchParams.delete("ssl");
    u.searchParams.set("ssl", "true");
    return u.toString();
  } catch {
    return connectionString;
  }
}

function createClient() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida");
  }
  const ssl = pgSslFromEnv();
  if (ssl?.rejectUnauthorized === false) {
    connectionString = sanitizeConnectionStringForInsecureTls(connectionString);
  }

  // Pool aplica `ssl` de forma explícita; PrismaPg só com string+ssl pode falhar em alguns builds.
  const pool = new Pool({
    connectionString,
    ...(ssl ? { ssl } : {}),
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.DATABASE_POOL_IDLE_MS ?? 10_000),
    connectionTimeoutMillis: Number(process.env.DATABASE_POOL_CONN_TIMEOUT_MS ?? 15_000),
  });

  const adapter = new PrismaPg(pool, { disposeExternalPool: true });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

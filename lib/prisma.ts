import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function parseBoolean(value: string | undefined): boolean | undefined {
  const raw = value?.trim().toLowerCase();
  if (!raw) return undefined;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  return undefined;
}

/**
 * Resolve a política TLS com fallback por envs comuns em plataformas cloud.
 */
function pgSslFromEnvOrUrl(connectionString: string): { rejectUnauthorized: boolean } | undefined {
  const explicit = parseBoolean(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED);
  if (explicit !== undefined) {
    return { rejectUnauthorized: explicit };
  }

  const tlsRejectUnauthorized = parseBoolean(process.env.NODE_TLS_REJECT_UNAUTHORIZED);
  if (tlsRejectUnauthorized !== undefined) {
    return { rejectUnauthorized: tlsRejectUnauthorized };
  }

  const pgSslMode = process.env.PGSSLMODE?.trim().toLowerCase();
  if (pgSslMode === "disable") return undefined;
  if (pgSslMode === "no-verify") return { rejectUnauthorized: false };
  if (pgSslMode === "require" || pgSslMode === "verify-ca" || pgSslMode === "verify-full") {
    return { rejectUnauthorized: true };
  }

  try {
    const u = new URL(connectionString);
    const sslmode = u.searchParams.get("sslmode")?.trim().toLowerCase();
    if (sslmode === "no-verify") return { rejectUnauthorized: false };
  } catch {
    // Ignora URL inválida e mantém comportamento padrão.
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
  const ssl = pgSslFromEnvOrUrl(connectionString);
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

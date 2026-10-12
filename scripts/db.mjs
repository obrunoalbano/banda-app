/**
 * Conexão com o banco para scripts (pg puro), com trava de segurança:
 * banco que não é local exige --confirm-remote. Usa DIRECT_URL (conexão de sessão) ou DATABASE_URL.
 * Para o banco local: `node scripts/with-local-db.mjs node scripts/<script>.mjs …`.
 */
import { config as loadEnv } from "dotenv";
import pg from "pg";

loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ path: ".env", override: false, quiet: true });

export function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

export function argValue(name) {
  const args = process.argv.slice(2);
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

export async function connectDb() {
  const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error("DATABASE_URL não definida.");
    process.exit(1);
  }
  const url = new URL(rawUrl);
  const isLocal = ["127.0.0.1", "localhost"].includes(url.hostname);
  console.log(`Banco: ${url.hostname}:${url.port || 5432} ${isLocal ? "(local)" : "(REMOTO)"}`);
  if (!isLocal && !hasFlag("confirm-remote")) {
    console.error("Banco remoto: repita o comando com --confirm-remote se tem certeza.");
    process.exit(1);
  }
  // TLS: mesmo comportamento de lib/prisma.ts para o pooler do Supabase.
  const insecure = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false";
  for (const p of ["sslmode", "pgbouncer", "connection_limit"]) url.searchParams.delete(p);
  const client = new pg.Client({
    connectionString: url.toString(),
    ssl: isLocal ? false : { rejectUnauthorized: !insecure },
  });
  await client.connect();
  return client;
}

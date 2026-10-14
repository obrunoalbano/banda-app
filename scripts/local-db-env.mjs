/** Configuração compartilhada do banco local (scripts/local-db.mjs). */
export const LOCAL_DB_PORT = Number(process.env.LOCAL_DB_PORT ?? 54329);
export const LOCAL_DB_URL = `postgresql://postgres:postgres@127.0.0.1:${LOCAL_DB_PORT}/postgres?sslmode=disable`;

/**
 * Variáveis que apontam app e Prisma CLI para o banco local. Sobrescrevem as do .env.local
 * (o Next e o dotenv não substituem variáveis já definidas no processo).
 */
export const LOCAL_DB_ENV = {
  DATABASE_URL: LOCAL_DB_URL,
  DIRECT_URL: LOCAL_DB_URL,
  // Neutraliza o TLS configurado para o Supabase no .env.local.
  DATABASE_SSL_REJECT_UNAUTHORIZED: "",
  PGSSLMODE: "disable",
  DATABASE_POOL_MAX: "1",
};

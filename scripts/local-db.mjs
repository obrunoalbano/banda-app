/**
 * Banco Postgres LOCAL para desenvolvimento/validação (PGlite), sem tocar em produção.
 * Dados persistem em .local-db/ (gitignored). Apagar a pasta = começar do zero.
 *
 *   npm run db:local          # terminal 1: sobe o banco (deixe rodando)
 *   npm run db:local:migrate  # terminal 2: aplica as migrations (prisma migrate deploy)
 *   npm run db:local:seed     # banda de exemplo (login: demo@local.test / senha-local-123)
 *   npm run dev:local         # app em http://localhost:3000 usando este banco
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { LOCAL_DB_PORT } from "./local-db-env.mjs";

const dataDir = new URL("../.local-db", import.meta.url).pathname;
const db = await PGlite.create({ dataDir });
const server = new PGLiteSocketServer({ db, port: LOCAL_DB_PORT, host: "127.0.0.1", maxConnections: 20 });
await server.start();
console.log(`Banco local pronto em 127.0.0.1:${LOCAL_DB_PORT} (dados em .local-db/). Ctrl+C para parar.`);

async function shutdown() {
  await server.stop();
  await db.close(); // grava os dados no disco
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

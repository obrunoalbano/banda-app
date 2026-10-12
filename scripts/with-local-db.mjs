/**
 * Roda um comando apontando para o banco local: `node scripts/with-local-db.mjs next dev`.
 * Usado por `npm run dev:local` e `npm run db:local:migrate`.
 */
import { spawn } from "node:child_process";
import { LOCAL_DB_ENV, LOCAL_DB_URL } from "./local-db-env.mjs";

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error("Uso: node scripts/with-local-db.mjs <comando> [args…]");
  process.exit(1);
}
console.log(`→ usando banco LOCAL (${LOCAL_DB_URL.replace(/:[^:@/]*@/, ":***@")})`);
const child = spawn("npx", [cmd, ...args], { stdio: "inherit", env: { ...process.env, ...LOCAL_DB_ENV } });
child.on("exit", (code) => process.exit(code ?? 1));

/**
 * Cria (ou redefine a senha de) um superadmin — necessário para o PRIMEIRO acesso ao painel /admin.
 * Os demais administradores podem ser criados pelo próprio painel.
 *
 *   npm run admin:create -- --email voce@empresa.com --name "Seu Nome"            # banco do .env.local
 *   node scripts/with-local-db.mjs node scripts/create-superadmin.mjs --email …    # banco local
 *   … --reset                    # já existe: gera nova senha provisória
 *   … --confirm-remote           # obrigatório quando o banco NÃO é local (ex.: produção)
 *
 * Imprime uma senha provisória (troca obrigatória no primeiro acesso). Só o hash é salvo.
 */
import { randomInt, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";
import pg from "pg";

loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ path: ".env", override: false, quiet: true });

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const flag = (name) => args.includes(`--${name}`);

const email = arg("email")?.trim().toLowerCase();
const name = arg("name")?.trim();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Uso: npm run admin:create -- --email voce@empresa.com --name "Seu Nome" [--reset] [--confirm-remote]');
  process.exit(1);
}

const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}
const url = new URL(rawUrl);
const isLocal = ["127.0.0.1", "localhost"].includes(url.hostname);
console.log(`Banco: ${url.hostname}:${url.port || 5432} ${isLocal ? "(local)" : "(REMOTO)"}`);
if (!isLocal && !flag("confirm-remote")) {
  console.error("Banco remoto: repita o comando com --confirm-remote se tem certeza.");
  process.exit(1);
}

// TLS: mesmo comportamento de lib/prisma.ts para o pooler do Supabase.
const insecure = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false";
url.searchParams.delete("sslmode");
url.searchParams.delete("pgbouncer");
url.searchParams.delete("connection_limit");
const ssl = isLocal ? false : { rejectUnauthorized: !insecure };

const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const chars = Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]);
const tempPassword = `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8).join("")}`;
const passwordHash = bcrypt.hashSync(tempPassword, 12);

const client = new pg.Client({ connectionString: url.toString(), ssl });
await client.connect();
try {
  const existing = await client.query(`SELECT id FROM "AdminUser" WHERE email = $1`, [email]);
  if (existing.rowCount) {
    if (!flag("reset")) {
      console.error(`Já existe um administrador com ${email}. Use --reset para gerar nova senha provisória.`);
      process.exit(1);
    }
    await client.query(
      `UPDATE "AdminUser" SET "passwordHash" = $1, "mustChangePassword" = true, "disabledAt" = NULL, "updatedAt" = now() WHERE email = $2`,
      [passwordHash, email],
    );
    console.log(`Senha redefinida para ${email}.`);
  } else {
    if (!name) {
      console.error("Informe --name para criar um novo administrador.");
      process.exit(1);
    }
    await client.query(
      `INSERT INTO "AdminUser" (id, name, email, "passwordHash", "mustChangePassword", "updatedAt") VALUES ($1, $2, $3, $4, true, now())`,
      [randomUUID(), name, email, passwordHash],
    );
    console.log(`Administrador criado: ${name} <${email}>.`);
  }
  console.log(`\nSenha provisória: ${tempPassword}\nAcesse /admin/login — a troca de senha é obrigatória no primeiro acesso.`);
} finally {
  await client.end();
}

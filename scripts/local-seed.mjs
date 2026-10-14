/**
 * Popula o banco LOCAL com uma banda de exemplo (recria a cada execução).
 * Login: demo@local.test / senha-local-123 · Agenda pública: /b/banda-demo
 * Recusa rodar se a URL não for local (proteção contra apagar dados reais).
 */
import bcrypt from "bcryptjs";
import pg from "pg";
import { LOCAL_DB_URL } from "./local-db-env.mjs";

const url = new URL(LOCAL_DB_URL);
if (!["127.0.0.1", "localhost"].includes(url.hostname)) {
  console.error("Seed só roda contra banco local.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: LOCAL_DB_URL });
await client.connect();

/** Data pura YYYY-MM-DD daqui a `days` dias. */
const inDays = (days) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const BAND = "demo-band";
await client.query(`DELETE FROM "Band" WHERE id = $1 OR email = 'demo@local.test'`, [BAND]);
await client.query(
  `INSERT INTO "Band" (id, name, responsible, phone, email, "passwordHash", slug, "publicAgendaEnabled", "updatedAt")
   VALUES ($1, 'Banda Demo', 'Ana Demo', '(11) 99999-0000', 'demo@local.test', $2, 'banda-demo', true, now())`,
  [BAND, bcrypt.hashSync("senha-local-123", 10)],
);

const venues = [
  ["demo-v1", "Bar do Zé", "Zé", "(13) 99999-1111", "ze@bar.test", "Santos", "SP", 150000, "FINALIZADO"],
  ["demo-v2", "Pub Rock", "Rita", "(19) 98888-2222", "", "Campinas", "SP", null, "ENVIADO"],
  ["demo-v3", "Casa Nova", "Léo", "(11) 97777-3333", "", "São Paulo", "SP", 80000, "NAO_ENVIADO"],
];
for (const v of venues) {
  await client.query(
    `INSERT INTO "Venue" (id, "bandId", name, responsible, phone, email, city, state, "valorCacheCents", "sendStatus", "updatedAt")
     VALUES ($1, '${BAND}', $2, $3, $4, $5, $6, $7, $8, $9, now())`,
    v,
  );
}

// [id, venueId, privateCity, privateState, privateDetails, date, time, cacheCents, payment, isPublic, ticketUrl, cancelled]
const shows = [
  ["demo-s0", "demo-v1", null, null, null, inDays(-30), "21:00", 150000, "PAGO", true, null, false],
  ["demo-s1", "demo-v1", null, null, null, inDays(8), "21:00", 150000, "AGUARDANDO_PAGAMENTO", true, "https://www.sympla.com.br/", false],
  ["demo-s2", null, "Campinas", "SP", "Casamento — 120 convidados (NÃO deve aparecer na agenda)", inDays(20), "19:30", 500000, "PAGO", false, null, false],
  ["demo-s3", "demo-v2", null, null, null, inDays(35), "22:00", null, "AGUARDANDO_PAGAMENTO", true, null, false],
  ["demo-s4", "demo-v3", null, null, null, inDays(60), "20:00", 80000, "AGUARDANDO_PAGAMENTO", true, null, true],
];
for (const s of shows) {
  await client.query(
    `INSERT INTO "Show" (id, "bandId", "venueId", "privateCity", "privateState", "privateEventDetails", date, time,
       "cacheCents", "paymentStatus", "isPublic", "ticketUrl", "cancelledAt", "updatedAt")
     VALUES ($1, '${BAND}', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CASE WHEN $12 THEN now() END, now())`,
    s,
  );
}

await client.query(
  `INSERT INTO "Lead" (id, "bandId", name, email, whatsapp, "eventType", source)
   VALUES ('demo-l1', '${BAND}', 'Maria Souza', 'maria@exemplo.test', '(11) 91234-5678', 'Casamento', 'landing')`,
);

// Superadmin de exemplo (painel /admin) e alguns palcos da base curada.
await client.query(`DELETE FROM "AdminUser" WHERE email = 'admin@local.test'`);
await client.query(
  `INSERT INTO "AdminUser" (id, name, email, "passwordHash", "updatedAt") VALUES ('demo-admin', 'Admin Demo', 'admin@local.test', $1, now())`,
  [bcrypt.hashSync("senha-admin-123", 10)],
);
await client.query(`DELETE FROM "Stage" WHERE id LIKE 'demo-stage-%'`);
const stages = [
  ["demo-stage-1", "Bar do Zé", "BAR", "Santos", "SP", "{rock,pop}", "@bardoze", "PUBLISHED"],
  ["demo-stage-2", "Pub Rock", "PUB", "Campinas", "SP", "{rock}", "@pubrock", "PUBLISHED"],
  ["demo-stage-3", "Centro Cultural da Vila", "CENTRO_CULTURAL", "Belo Horizonte", "MG", "{mpb,jazz}", null, "DRAFT"],
];
for (const [id, name, type, city, state, genres, instagram, status] of stages) {
  await client.query(
    `INSERT INTO "Stage" (id, name, type, city, state, genres, instagram, status, "verifiedAt", "verifiedById", "createdById", "updatedAt")
     VALUES ($1, $2, $3::"StageType", $4, $5, $6::text[], $7, $8::"StageStatus",
       CASE WHEN $9 THEN now() END, CASE WHEN $9 THEN 'demo-admin' END, 'demo-admin', now())`,
    [id, name, type, city, state, genres, instagram, status, status === "PUBLISHED"],
  );
}

await client.end();
console.log(`Seed ok.
  Painel admin:    http://localhost:3000/admin/login  (admin@local.test / senha-admin-123)
  Login:           demo@local.test / senha-local-123
  Agenda pública:  http://localhost:3000/b/banda-demo
  Widget:          http://localhost:3000/embed/banda-demo/shows?tema=escuro
  API:             http://localhost:3000/api/public/v1/bands/banda-demo/shows`);

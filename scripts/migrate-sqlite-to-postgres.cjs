#!/usr/bin/env node
/* eslint-disable no-console */
const path = require("node:path");
const fs = require("node:fs");
const Database = require("better-sqlite3");
const { Client } = require("pg");
const { config: loadEnv } = require("dotenv");

loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });

function resolveSqlitePath() {
  const raw = process.env.SQLITE_SOURCE_PATH || "./dev.db";
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function resolvePostgresUrl() {
  return process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;
}

function pgSslFromEnv() {
  const raw = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return { rejectUnauthorized: false };
  if (raw === "true" || raw === "1") return { rejectUnauthorized: true };
  return undefined;
}

function getSqliteColumns(db, tableName) {
  return new Set(
    db
      .prepare(`PRAGMA table_info("${tableName}")`)
      .all()
      .map((c) => String(c.name)),
  );
}

function parseMaybeJson(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

async function main() {
  const sqlitePath = resolveSqlitePath();
  const postgresUrl = resolvePostgresUrl();

  if (!postgresUrl) {
    throw new Error("DATABASE_URL não definida (ou TARGET_DATABASE_URL).");
  }
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`Arquivo SQLite não encontrado: ${sqlitePath}`);
  }

  const sqlite = new Database(sqlitePath, { readonly: true });
  const ssl = pgSslFromEnv();
  const pg = new Client({ connectionString: postgresUrl, ...(ssl ? { ssl } : {}) });

  try {
    await pg.connect();
    await pg.query("BEGIN");

    const bands = sqlite.prepare('SELECT * FROM "Band"').all();
    const venues = sqlite.prepare('SELECT * FROM "Venue"').all();
    const shows = sqlite.prepare('SELECT * FROM "Show"').all();
    const leads = sqlite.prepare('SELECT * FROM "Lead"').all();

    const leadColumns = getSqliteColumns(sqlite, "Lead");
    const hasWhatsapp = leadColumns.has("whatsapp");
    const hasPhone = leadColumns.has("phone");
    const hasEventDescription = leadColumns.has("eventDescription");
    const hasMessage = leadColumns.has("message");
    const hasGuestCount = leadColumns.has("guestCount");

    for (const row of bands) {
      await pg.query(
        `INSERT INTO "Band" ("id","name","responsible","phone","email","passwordHash","leadIngestToken","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT ("id") DO UPDATE SET
           "name"=EXCLUDED."name",
           "responsible"=EXCLUDED."responsible",
           "phone"=EXCLUDED."phone",
           "email"=EXCLUDED."email",
           "passwordHash"=EXCLUDED."passwordHash",
           "leadIngestToken"=EXCLUDED."leadIngestToken",
           "createdAt"=EXCLUDED."createdAt",
           "updatedAt"=EXCLUDED."updatedAt"`,
        [
          row.id,
          row.name,
          row.responsible,
          row.phone,
          row.email,
          row.passwordHash,
          row.leadIngestToken ?? null,
          row.createdAt,
          row.updatedAt,
        ],
      );
    }

    for (const row of venues) {
      await pg.query(
        `INSERT INTO "Venue" ("id","bandId","name","responsible","phone","email","city","state","valorCache","instagram","sendStatus","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT ("id") DO UPDATE SET
           "bandId"=EXCLUDED."bandId",
           "name"=EXCLUDED."name",
           "responsible"=EXCLUDED."responsible",
           "phone"=EXCLUDED."phone",
           "email"=EXCLUDED."email",
           "city"=EXCLUDED."city",
           "state"=EXCLUDED."state",
           "valorCache"=EXCLUDED."valorCache",
           "instagram"=EXCLUDED."instagram",
           "sendStatus"=EXCLUDED."sendStatus",
           "createdAt"=EXCLUDED."createdAt",
           "updatedAt"=EXCLUDED."updatedAt"`,
        [
          row.id,
          row.bandId,
          row.name,
          row.responsible,
          row.phone,
          row.email,
          row.city,
          row.state,
          row.valorCache ?? null,
          row.instagram ?? null,
          row.sendStatus ?? "NAO_ENVIADO",
          row.createdAt,
          row.updatedAt,
        ],
      );
    }

    for (const row of shows) {
      await pg.query(
        `INSERT INTO "Show" ("id","bandId","venueId","privateEventDetails","privateCity","privateState","privateValorCache","date","time","paymentStatus","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT ("id") DO UPDATE SET
           "bandId"=EXCLUDED."bandId",
           "venueId"=EXCLUDED."venueId",
           "privateEventDetails"=EXCLUDED."privateEventDetails",
           "privateCity"=EXCLUDED."privateCity",
           "privateState"=EXCLUDED."privateState",
           "privateValorCache"=EXCLUDED."privateValorCache",
           "date"=EXCLUDED."date",
           "time"=EXCLUDED."time",
           "paymentStatus"=EXCLUDED."paymentStatus",
           "createdAt"=EXCLUDED."createdAt",
           "updatedAt"=EXCLUDED."updatedAt"`,
        [
          row.id,
          row.bandId,
          row.venueId ?? null,
          row.privateEventDetails ?? null,
          row.privateCity ?? null,
          row.privateState ?? null,
          row.privateValorCache ?? null,
          row.date,
          row.time,
          row.paymentStatus ?? "AGUARDANDO_PAGAMENTO",
          row.createdAt,
          row.updatedAt,
        ],
      );
    }

    for (const row of leads) {
      const whatsapp =
        (hasWhatsapp ? row.whatsapp : null) ??
        (hasPhone ? row.phone : null) ??
        null;
      const eventDescription =
        (hasEventDescription ? row.eventDescription : null) ??
        (hasMessage ? row.message : null) ??
        (hasGuestCount ? row.guestCount : null) ??
        null;

      await pg.query(
        `INSERT INTO "Lead" ("id","bandId","name","email","whatsapp","eventDate","city","eventType","eventDescription","metadata","source","createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12)
         ON CONFLICT ("id") DO UPDATE SET
           "bandId"=EXCLUDED."bandId",
           "name"=EXCLUDED."name",
           "email"=EXCLUDED."email",
           "whatsapp"=EXCLUDED."whatsapp",
           "eventDate"=EXCLUDED."eventDate",
           "city"=EXCLUDED."city",
           "eventType"=EXCLUDED."eventType",
           "eventDescription"=EXCLUDED."eventDescription",
           "metadata"=EXCLUDED."metadata",
           "source"=EXCLUDED."source",
           "createdAt"=EXCLUDED."createdAt"`,
        [
          row.id,
          row.bandId,
          row.name,
          row.email,
          whatsapp,
          row.eventDate ?? null,
          row.city ?? null,
          row.eventType ?? null,
          eventDescription,
          JSON.stringify(parseMaybeJson(row.metadata)),
          row.source ?? null,
          row.createdAt,
        ],
      );
    }

    await pg.query("COMMIT");

    console.log("Migracao concluida com sucesso.");
    console.log(`Bands:  ${bands.length}`);
    console.log(`Venues: ${venues.length}`);
    console.log(`Shows:  ${shows.length}`);
    console.log(`Leads:  ${leads.length}`);
  } catch (error) {
    await pg.query("ROLLBACK");
    throw error;
  } finally {
    sqlite.close();
    await pg.end();
  }
}

main().catch((err) => {
  console.error("Falha na migracao:", err.message);
  process.exit(1);
});

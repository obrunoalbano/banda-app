import { z } from "zod";
import { ShowPaymentStatus, VenueSendStatus } from "@/app/generated/prisma/enums";
import { MAX_CENTS } from "@/lib/money";

/*
 * Os schemas já NORMALIZAM a entrada (trim, email minúsculo, UF maiúscula, "" → null).
 * Route handlers gravam `parsed.data` direto, sem repetir normalização.
 */

/** Texto obrigatório (trim + não vazio). */
const requiredText = (message?: string) => z.string().trim().min(1, message);

/** Email normalizado (trim + minúsculo). */
const email = (message = "Email inválido") =>
  z.string().trim().toLowerCase().pipe(z.email(message).max(320));

/**
 * Texto opcional: aceita omissão, null, string ou número (formulários externos).
 * String vazia vira `null`.
 */
const optionalText = (maxLen: number) =>
  z.preprocess(
    (v) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    },
    z.union([z.string().max(maxLen), z.null()]).optional(),
  );

/** UF: 2 letras, normalizada para maiúscula. */
const uf = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, "UF inválida");

/** Valor monetário em centavos (inteiro, não negativo). */
const centsSchema = z.number().int().min(0).max(MAX_CENTS, "Valor muito alto");

export const registerBandSchema = z.object({
  name: requiredText("Nome da banda é obrigatório"),
  responsible: requiredText("Responsável é obrigatório"),
  phone: requiredText("Telefone é obrigatório"),
  email: email(),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const bandUpdateSchema = z.object({
  name: requiredText().optional(),
  responsible: requiredText().optional(),
  phone: requiredText().optional(),
  email: email().optional(),
});

export const venueCreateSchema = z.object({
  name: requiredText(),
  responsible: requiredText(),
  phone: requiredText(),
  /** Opcional na UI; persistido como "" (coluna NOT NULL). */
  email: z.union([email(), z.literal("")]).optional(),
  city: requiredText(),
  state: uf,
  valorCacheCents: centsSchema.optional().nullable(),
  instagram: optionalText(200),
  sendStatus: z.enum(VenueSendStatus).optional(),
});

export const venueUpdateSchema = venueCreateSchema.partial();

const showBaseSchema = z.object({
  venueId: optionalText(64),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido"),
  privateEventDetails: optionalText(500),
  privateCity: optionalText(120),
  privateState: optionalText(2),
  /** Omitido na criação de show em casa → herda o cachê atual da casa. */
  cacheCents: centsSchema.optional().nullable(),
  paymentStatus: z.enum(ShowPaymentStatus).optional(),
});

/** Regra: sem casa ⇒ cidade e UF do evento particular obrigatórias. */
export const showCreateSchema = showBaseSchema.superRefine((data, ctx) => {
  if (data.venueId) return;
  if (!data.privateCity) {
    ctx.addIssue({
      code: "custom",
      path: ["privateCity"],
      message: "Informe a cidade do evento particular.",
    });
  }
  if (!data.privateState || !/^[A-Z]{2}$/i.test(data.privateState)) {
    ctx.addIssue({
      code: "custom",
      path: ["privateState"],
      message: "Selecione o estado (UF) do evento particular.",
    });
  }
});

export const showUpdateSchema = showBaseSchema.partial();

/** Aceita `phone` / `message` (legado) como alias opcionais de `whatsapp` / `eventDescription`. */
export function normalizeLeadIngestBody(input: unknown): unknown {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return input;
  }
  const o = { ...(input as Record<string, unknown>) };
  if (o.whatsapp == null && o.phone != null) {
    o.whatsapp = o.phone;
  }
  if (o.eventDescription == null && o.message != null) {
    o.eventDescription = o.message;
  }
  delete o.phone;
  delete o.message;
  return o;
}

const leadIngestObjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: email(),
  whatsapp: optionalText(80),
  eventDate: optionalText(120),
  city: optionalText(200),
  eventType: optionalText(200),
  eventDescription: optionalText(8000),
  source: optionalText(200),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const leadIngestSchema = leadIngestObjectSchema;

export const leadUpdateSchema = leadIngestObjectSchema.partial();

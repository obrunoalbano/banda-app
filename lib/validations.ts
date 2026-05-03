import { z } from "zod";
import { ShowPaymentStatus, VenueSendStatus } from "@/app/generated/prisma/enums";

export const registerBandSchema = z.object({
  name: z.string().min(1, "Nome da banda é obrigatório"),
  responsible: z.string().min(1, "Responsável é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const venueCreateSchema = z.object({
  name: z.string().min(1),
  responsible: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().min(1),
  state: z.string().min(1),
  valorCache: z.number().min(0).optional().nullable(),
  instagram: z.string().optional().nullable(),
  sendStatus: z.enum([
    VenueSendStatus.NAO_ENVIADO,
    VenueSendStatus.ENVIADO,
    VenueSendStatus.FINALIZADO,
  ]).optional(),
});

export const venueUpdateSchema = venueCreateSchema.partial();

const showBaseSchema = z.object({
  venueId: z.string().min(1).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  privateEventDetails: z.string().max(500).nullable().optional(),
  privateCity: z.string().max(120).nullable().optional(),
  privateState: z.string().max(2).nullable().optional(),
  privateValorCache: z.number().min(0).optional().nullable(),
  paymentStatus: z.enum([ShowPaymentStatus.PAGO, ShowPaymentStatus.AGUARDANDO_PAGAMENTO]).optional(),
});

export const showCreateSchema = showBaseSchema.superRefine((data, ctx) => {
  const venueId = typeof data.venueId === "string" ? data.venueId.trim() : "";
  const city = typeof data.privateCity === "string" ? data.privateCity.trim() : "";
  const state = typeof data.privateState === "string" ? data.privateState.trim().toUpperCase() : "";

  if (!venueId) {
    if (!city) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["privateCity"],
        message: "Informe a cidade do evento particular.",
      });
    }
    if (!state || !/^[A-Z]{2}$/.test(state)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["privateState"],
        message: "Selecione o estado (UF) do evento particular.",
      });
    }
  }
});

export const showUpdateSchema = showBaseSchema.partial();

export const bandUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  responsible: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

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

/** Campo de texto opcional: aceita omissão, null, string ou número (ex.: formulários). */
function optionalLeadText(maxLen: number) {
  return z.preprocess(
    (v) => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    },
    z.union([z.string().max(maxLen), z.null()]).optional(),
  );
}

const leadIngestObjectSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  whatsapp: optionalLeadText(80),
  eventDate: optionalLeadText(120),
  city: optionalLeadText(200),
  eventType: optionalLeadText(200),
  eventDescription: optionalLeadText(8000),
  source: optionalLeadText(200),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const leadIngestSchema = leadIngestObjectSchema;

export const leadUpdateSchema = leadIngestObjectSchema.partial();

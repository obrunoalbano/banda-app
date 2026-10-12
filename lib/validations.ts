import { z } from "zod";
import { ShowPaymentStatus, StageStatus, StageType, VenueSendStatus } from "@/app/generated/prisma/enums";
import { MAX_CENTS } from "@/lib/money";
import { slugError } from "@/lib/slug";
import { MAX_ALLOWED_ORIGINS, normalizeOrigin } from "@/lib/origins";

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

/** URL http(s) opcional (ex.: link de ingressos). "" → null. */
const optionalUrl = (maxLen: number) =>
  optionalText(maxLen).refine(
    (v) => v == null || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v),
    "Informe um link completo, começando com https://",
  );

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
  /** Omitido → padrão por tipo (casa = público, particular = oculto). */
  isPublic: z.boolean().optional(),
  ticketUrl: optionalUrl(500),
  /** true = cancelado (mantém na agenda como "Cancelado"); false = reativa. */
  cancelled: z.boolean().optional(),
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

/** Configuração da agenda pública da banda (tela Integrações). */
export const publicAgendaSchema = z.object({
  enabled: z.boolean().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .superRefine((v, ctx) => {
      const message = slugError(v);
      if (message) ctx.addIssue({ code: "custom", message });
    })
    .optional(),
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

/**
 * Envio PÚBLICO do formulário de contato (página, widget ou formulário do site da banda).
 * Sem `metadata` (vetor de spam). `website` é o honeypot (deve vir vazio);
 * `formToken` vem dos formulários do próprio app (anti-robô).
 */
export const publicLeadSchema = leadIngestObjectSchema.omit({ metadata: true }).extend({
  website: z.string().max(500).optional(),
  formToken: z.string().max(300).optional(),
});

/** Configuração do formulário público (tela Integrações → Contatos). */
export const leadFormSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  allowedOrigins: z
    .array(z.string().max(300))
    .max(MAX_ALLOWED_ORIGINS, `Cadastre no máximo ${MAX_ALLOWED_ORIGINS} domínios.`)
    .transform((list, ctx) => {
      const out: string[] = [];
      for (const raw of list) {
        if (!raw.trim()) continue;
        const origin = normalizeOrigin(raw);
        if (!origin) {
          ctx.addIssue({ code: "custom", message: `Domínio inválido: ${raw}` });
          return z.NEVER;
        }
        if (!out.includes(origin)) out.push(origin);
      }
      return out;
    })
    .optional(),
});

/* ── Senha ──────────────────────────────────────────────────────────── */

const newPassword = z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres").max(200);

/** Troca de senha pelo próprio usuário (banda ou superadmin). */
export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, "Informe a senha atual"), newPassword })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "A nova senha deve ser diferente da atual",
    path: ["newPassword"],
  });

/* ── Painel superadmin ──────────────────────────────────────────────── */

/** Superadmin cria conta de banda (senha provisória gerada no servidor). */
export const adminCreateBandSchema = z.object({
  name: requiredText("Nome da banda é obrigatório"),
  responsible: requiredText("Responsável é obrigatório"),
  phone: requiredText("Telefone é obrigatório"),
  email: email(),
});

/** Superadmin ativa/desativa conta de banda. */
export const adminUpdateBandSchema = z.object({ disabled: z.boolean() });

/** Superadmin cria outro superadmin. */
export const adminCreateAdminSchema = z.object({
  name: requiredText("Nome é obrigatório"),
  email: email(),
});

/** Estilos musicais: texto livre separado por vírgula → lista normalizada (minúsculas, sem repetição). */
const genresList = z
  .union([z.array(z.string()), z.string()])
  .transform((v) => {
    const list = (Array.isArray(v) ? v : v.split(","))
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean)
      .map((g) => g.slice(0, 40));
    return [...new Set(list)].slice(0, 15);
  });

/** Instagram: "@casa", "casa" ou URL → "@casa". */
const instagramHandle = optionalText(200).transform((v) => {
  // Ausente continua ausente (PATCH parcial não pode apagar o campo); vazio vira null.
  if (v === undefined) return undefined;
  if (!v) return null;
  const handle = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "");
  return handle ? `@${handle}` : null;
});

const stageBaseSchema = z.object({
  name: requiredText("Nome do palco é obrigatório").pipe(z.string().max(200)),
  type: z.enum(StageType),
  city: requiredText("Cidade é obrigatória").pipe(z.string().max(120)),
  state: uf,
  neighborhood: optionalText(120),
  genres: genresList.optional(),
  instagram: instagramHandle,
  website: optionalText(300).refine(
    (v) => v == null || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v),
    "Informe o site completo, começando com https://",
  ),
  publicPhone: optionalText(40),
  whatsapp: optionalText(40),
  imageUrl: optionalText(1000).refine(
    (v) => v == null || /^https:\/\/[^\s]+$/i.test(v),
    "Informe a URL completa da imagem, começando com https://",
  ),
  publicEmail: z
    .union([email(), z.literal("")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null)),
  capacity: z.number().int().min(1).max(200_000).nullable().optional(),
  notes: optionalText(2000),
  sourceNote: optionalText(500),
});

export const stageCreateSchema = stageBaseSchema.extend({
  status: z.enum(StageStatus).optional(),
});

/** PATCH: campos parciais + ações de curadoria. */
export const stageUpdateSchema = stageBaseSchema.partial().extend({
  status: z.enum(StageStatus).optional(),
  /** true = marca como verificado agora (pela pessoa logada). */
  verify: z.boolean().optional(),
});

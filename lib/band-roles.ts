import type { BandRole } from "@/app/generated/prisma/enums";
import type { Tone } from "@/components/ui/styles";

/** Papéis do integrante na banda (labels e tons). Seguro para componentes client. */

export const BAND_ROLE_LABELS: Record<BandRole, string> = {
  ADMIN: "Administrador",
  VIEWER: "Integrante (visualizador)",
};

export const BAND_ROLE_SHORT: Record<BandRole, string> = {
  ADMIN: "Administrador",
  VIEWER: "Visualizador",
};

export const BAND_ROLE_TONES: Record<BandRole, Tone> = {
  ADMIN: "info",
  VIEWER: "neutral",
};

export const BAND_ROLE_OPTIONS = (Object.keys(BAND_ROLE_LABELS) as BandRole[]).map((value) => ({
  value,
  label: BAND_ROLE_LABELS[value],
}));

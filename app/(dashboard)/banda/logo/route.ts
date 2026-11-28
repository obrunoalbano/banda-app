import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";

/**
 * Logo da banda ativa (PNG). Leitura com sessão (administrador e visualizador: a logo entra nos
 * arquivos do "Compartilhar"). Fica fora de /api (que é só escrita), como o CSV do Financeiro.
 * `?v=<updatedAt>` muda a cada troca de logo, então a resposta pode ficar em cache (privado).
 */
export async function GET(request: Request) {
  const bandId = await requireBandId();
  const logo = await prisma.bandLogo.findUnique({ where: { bandId }, select: { data: true } });
  if (!logo) return new Response("Sem logo", { status: 404 });
  const versioned = new URL(request.url).searchParams.has("v");
  return new Response(new Uint8Array(logo.data), {
    headers: {
      "Content-Type": "image/png",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
      "Cache-Control": versioned ? "private, max-age=31536000, immutable" : "private, no-cache",
    },
  });
}

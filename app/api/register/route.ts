import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerBandSchema } from "@/lib/validations";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = registerBandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, responsible, phone, email, password } = parsed.data;
  const emailNorm = email.trim().toLowerCase();

  const existing = await prisma.band.findUnique({ where: { email: emailNorm } });
  if (existing) {
    return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);
  await prisma.band.create({
    data: {
      name: name.trim(),
      responsible: responsible.trim(),
      phone: phone.trim(),
      email: emailNorm,
      passwordHash,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

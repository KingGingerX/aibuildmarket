import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPackSchema = z.object({
  type: z.enum(["FONT", "EMOJI"]),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  name: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  payload: z.string().min(1),
  priceCents: z.number().int().min(0).max(10000),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const packs = await prisma.cosmeticPack.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ packs });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = await req.json();
  const parsed = createPackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pack = await prisma.cosmeticPack.create({ data: parsed.data });
  return NextResponse.json({ pack }, { status: 201 });
}

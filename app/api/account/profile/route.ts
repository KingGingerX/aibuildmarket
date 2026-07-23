import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  displayName: z.string().min(2).max(40),
});

// PATCH /api/account/profile { displayName } — authenticated self-service
// display name change. Email is intentionally not editable here — it's tied
// to emailVerified / login identity and changing it needs its own re-verify
// flow, which is out of scope for this endpoint.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { displayName: parsed.data.displayName },
  });

  return NextResponse.json({ displayName: user.displayName });
}

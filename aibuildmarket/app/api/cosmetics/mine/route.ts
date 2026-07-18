import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/cosmetics/mine
// Returns every active pack the caller can use right now: admins get
// everything unconditionally, everyone else gets packs they've completed
// a purchase for.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);

  const packs = isAdmin
    ? await prisma.cosmeticPack.findMany({ where: { active: true } })
    : await prisma.cosmeticPack.findMany({
        where: {
          active: true,
          purchases: { some: { userId, status: "COMPLETED" } },
        },
      });

  return NextResponse.json({ packs, isAdmin });
}

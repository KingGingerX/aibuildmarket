import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/listings/mine — every listing the logged-in seller owns, any status.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const listings = await prisma.listing.findMany({
    where: { sellerId: userId },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const shaped = listings.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    category: l.category,
    priceCents: l.priceCents,
    status: l.status,
    crossPosted: l.crossPosted,
    boosted: Boolean(l.boostedUntil && l.boostedUntil.getTime() > now),
    boostedUntil: l.boostedUntil,
    createdAt: l.createdAt,
  }));

  return NextResponse.json({ listings: shaped });
}

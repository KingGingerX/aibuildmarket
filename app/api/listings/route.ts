import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createListingSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(4000),
  category: z.enum(["AI_TOOLS", "BUSINESSES", "IDEAS_IP", "PROMPTS", "GAMES"]),
  priceCents: z.number().int().positive().nullable().optional(),
});

// GET /api/listings
// Public fields only, always. Price/seller only attached if a real session exists.
export async function GET(req: NextRequest) {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: isLoggedIn
      ? { seller: { select: { displayName: true, isVerifiedSeller: true, email: true } } }
      : undefined,
  });

  // Boosted-and-still-active-now listings sort first; everything else keeps
  // its normal newest-first order. Done in JS, not SQL, because "boosted"
  // depends on comparing boostedUntil to the current instant, not a static column.
  const now = Date.now();
  listings.sort((a, b) => {
    const aBoosted = Boolean(a.boostedUntil && a.boostedUntil.getTime() > now);
    const bBoosted = Boolean(b.boostedUntil && b.boostedUntil.getTime() > now);
    if (aBoosted !== bBoosted) return aBoosted ? -1 : 1;
    return 0; // stable sort preserves the createdAt desc order from the query
  });

  const shaped = listings.map((l) => {
    // Base object: what EVERY visitor gets, logged in or not.
    const base = {
      id: l.id,
      title: l.title,
      description: l.description,
      category: l.category,
      imageUrl: l.imageUrl,
      createdAt: l.createdAt,
      crossPosted: l.crossPosted,
      boosted: Boolean(l.boostedUntil && l.boostedUntil.getTime() > now),
    };

    if (!isLoggedIn) {
      // Explicitly do not attach price, seller, or contact fields.
      // This is the actual security boundary — not a CSS blur, an object that
      // never contains the gated fields when there's no verified session.
      return base;
    }

    return {
      ...base,
      priceCents: l.priceCents,
      seller: {
        displayName: (l as unknown as { seller: { displayName: string } }).seller.displayName,
        isVerifiedSeller: (l as unknown as { seller: { isVerifiedSeller: boolean } }).seller.isVerifiedSeller,
      },
    };
  });

  return NextResponse.json({ listings: shaped, authenticated: isLoggedIn });
}

// POST /api/listings — create a listing. Requires a real session with a
// verified email — unverified accounts can browse and buy, not sell, which
// keeps spam/burner listings out without blocking anyone from purchasing.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to list a build." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const seller = await prisma.user.findUnique({ where: { id: userId } });
  if (!seller?.emailVerified) {
    return NextResponse.json(
      { error: "Verify your email before listing a build." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      ...parsed.data,
      sellerId: userId,
    },
  });

  return NextResponse.json({ listing }, { status: 201 });
}

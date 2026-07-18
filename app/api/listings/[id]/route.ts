import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { seller: true },
  });

  if (!listing || !listing.active) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const base = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    createdAt: listing.createdAt,
  };

  if (!isLoggedIn) {
    return NextResponse.json({ listing: base, authenticated: false });
  }

  return NextResponse.json({
    listing: {
      ...base,
      priceCents: listing.priceCents,
      seller: {
        displayName: listing.seller.displayName,
        email: listing.seller.email,
        isVerifiedSeller: listing.seller.isVerifiedSeller,
      },
    },
    authenticated: true,
  });
}

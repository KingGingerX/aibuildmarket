import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const viewerId = session?.user ? (session.user as { id: string }).id : undefined;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { seller: true },
  });

  const isOwner = Boolean(viewerId && listing && viewerId === listing.sellerId);

  if (!listing || (listing.status !== "ACTIVE" && !isOwner)) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const base = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    createdAt: listing.createdAt,
    status: listing.status,
    crossPosted: listing.crossPosted,
    boosted: Boolean(listing.boostedUntil && listing.boostedUntil.getTime() > Date.now()),
  };

  if (!isLoggedIn) {
    return NextResponse.json({ listing: base, authenticated: false });
  }

  return NextResponse.json({
    listing: {
      ...base,
      priceCents: listing.priceCents,
      isOwner,
      seller: {
        displayName: listing.seller.displayName,
        email: listing.seller.email,
        isVerifiedSeller: listing.seller.isVerifiedSeller,
      },
    },
    authenticated: true,
  });
}

const patchSchema = z.object({
  title: z.string().min(3).max(140).optional(),
  description: z.string().min(10).max(4000).optional(),
  priceCents: z.number().int().positive().nullable().optional(),
  status: z.enum(["ACTIVE", "SOLD", "INACTIVE"]).optional(),
  crossPosted: z.boolean().optional(),
});

// PATCH /api/listings/:id — seller-only edit: price, copy, status, cross-post flag.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (listing.sellerId !== userId) {
    return NextResponse.json({ error: "You don't own this listing." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const updated = await prisma.listing.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ listing: updated });
}

// DELETE /api/listings/:id — seller-only. Blocked once a sale has actually
// completed, so a buyer's purchase record never disappears out from under
// them; sellers reach for "Mark Sold" or "Deactivate" at that point instead.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (listing.sellerId !== userId) {
    return NextResponse.json({ error: "You don't own this listing." }, { status: 403 });
  }

  const completedOrder = await prisma.order.findFirst({
    where: { listingId: id, status: "COMPLETED" },
  });
  if (completedOrder) {
    return NextResponse.json(
      { error: "This listing has a completed sale, so it can't be deleted — mark it Sold or Inactive instead to keep the buyer's record intact." },
      { status: 400 }
    );
  }

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}

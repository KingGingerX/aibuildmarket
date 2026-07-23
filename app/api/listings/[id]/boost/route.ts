import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, BOOST_PRICE_CENTS, BOOST_DAYS } from "@/lib/stripe";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// POST /api/listings/:id/boost — seller pays a flat fee to bump their own
// listing to the top of browse/search for BOOST_DAYS. Full price goes to the
// platform — no Stripe Connect destination, same as cosmetic pack purchases.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const { allowed, retryAfterSeconds } = rateLimit(`boost-checkout:${clientIp(req)}:${userId}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (listing.sellerId !== userId) {
    return NextResponse.json({ error: "You don't own this listing." }, { status: 403 });
  }
  if (listing.status !== "ACTIVE") {
    return NextResponse.json({ error: "Only active listings can be boosted." }, { status: 400 });
  }

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Boost: ${listing.title} (${BOOST_DAYS} days)` },
          unit_amount: BOOST_PRICE_CENTS,
        },
        quantity: 1,
      },
    ],
    metadata: { boostListingId: listing.id, boostDays: String(BOOST_DAYS) },
    success_url: `${process.env.NEXT_PUBLIC_URL}/sell/listings?boosted=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/sell/listings?boosted=cancelled`,
  });

  await prisma.boostPurchase.create({
    data: {
      listingId: listing.id,
      stripeSessionId: checkoutSession.id,
      amountCents: BOOST_PRICE_CENTS,
      days: BOOST_DAYS,
      status: "PENDING",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

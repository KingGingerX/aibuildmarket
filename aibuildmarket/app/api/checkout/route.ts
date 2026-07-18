import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, platformFeeFor } from "@/lib/stripe";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// POST /api/checkout { listingId }
// Requires login. Buyer identity and listing seller must both be resolved server-side.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to buy." }, { status: 401 });
  }

  const buyerId = (session.user as { id: string }).id;

  const { allowed, retryAfterSeconds } = rateLimit(`checkout:${clientIp(req)}:${buyerId}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const { listingId } = await req.json();
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { seller: true },
  });

  if (!listing || !listing.active) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (listing.sellerId === buyerId) {
    return NextResponse.json({ error: "You can't buy your own listing." }, { status: 400 });
  }
  if (!listing.priceCents) {
    return NextResponse.json(
      { error: "This listing has no fixed price — contact the seller directly." },
      { status: 400 }
    );
  }
  if (!listing.seller.stripeConnectId) {
    return NextResponse.json(
      { error: "Seller hasn't finished payout setup yet." },
      { status: 400 }
    );
  }

  // Verify live with Stripe that the seller's account can actually accept a
  // destination charge — presence of stripeConnectId alone doesn't mean
  // onboarding finished.
  const account = await stripe.accounts.retrieve(listing.seller.stripeConnectId);
  if (!account.charges_enabled) {
    return NextResponse.json(
      { error: "Seller's payout account isn't fully verified yet." },
      { status: 400 }
    );
  }

  const platformFee = platformFeeFor(listing.priceCents);

  // NOTE: this calls Stripe directly. Swapping to Paid! (this account's existing
  // Stripe automation layer) is the documented next step so product/webhook
  // setup stays centralized — not required for this to work correctly today.
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: listing.title },
          unit_amount: listing.priceCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: { destination: listing.seller.stripeConnectId },
    },
    metadata: { listingId: listing.id, buyerId },
    success_url: `${process.env.NEXT_PUBLIC_URL}/listings/${listing.id}?purchase=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/listings/${listing.id}?purchase=cancelled`,
  });

  await prisma.order.create({
    data: {
      listingId: listing.id,
      buyerId,
      stripeSessionId: checkoutSession.id,
      amountCents: listing.priceCents,
      platformFeeCents: platformFee,
      status: "PENDING",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

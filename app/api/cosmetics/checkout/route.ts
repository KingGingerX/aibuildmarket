import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// POST /api/cosmetics/checkout { packId }
// Buys a font/emoji pack. Full price goes to the platform — no Stripe Connect
// destination, unlike listing sales.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to buy." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const isAdmin = Boolean((session.user as { isAdmin?: boolean }).isAdmin);

  const { allowed, retryAfterSeconds } = rateLimit(`cosmetics-checkout:${clientIp(req)}:${userId}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  if (isAdmin) {
    return NextResponse.json(
      { error: "Admin accounts already have full access to every pack." },
      { status: 400 }
    );
  }

  const { packId } = await req.json();
  const pack = await prisma.cosmeticPack.findUnique({ where: { id: packId } });
  if (!pack || !pack.active) {
    return NextResponse.json({ error: "Pack not found." }, { status: 404 });
  }

  const existing = await prisma.cosmeticPurchase.findUnique({
    where: { userId_packId: { userId, packId } },
  });
  if (existing?.status === "COMPLETED") {
    return NextResponse.json({ error: "You already own this pack." }, { status: 400 });
  }

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${pack.name} (${pack.type === "FONT" ? "Font Pack" : "Emoji Pack"})` },
          unit_amount: pack.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { cosmeticPackId: pack.id, userId },
    success_url: `${process.env.NEXT_PUBLIC_URL}/store?purchase=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/store?purchase=cancelled`,
  });

  // One purchase row per (userId, packId) ever. A prior PENDING/CANCELLED
  // attempt gets its session id replaced rather than erroring on retry.
  await prisma.cosmeticPurchase.upsert({
    where: { userId_packId: { userId, packId } },
    create: {
      userId,
      packId,
      stripeSessionId: checkoutSession.id,
      amountCents: pack.priceCents,
      status: "PENDING",
    },
    update: {
      stripeSessionId: checkoutSession.id,
      amountCents: pack.priceCents,
      status: "PENDING",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

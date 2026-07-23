import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

// Stripe requires the raw request body for signature verification, so this
// route must NOT call req.json() — it reads text and verifies before parsing.
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;

    if (checkoutSession.metadata?.cosmeticPackId) {
      await prisma.cosmeticPurchase.updateMany({
        where: { stripeSessionId: checkoutSession.id, status: "PENDING" },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    } else if (checkoutSession.metadata?.boostListingId) {
      const boost = await prisma.boostPurchase.findUnique({
        where: { stripeSessionId: checkoutSession.id },
      });
      if (boost && boost.status === "PENDING") {
        const boostedUntil = new Date(Date.now() + boost.days * 24 * 60 * 60 * 1000);
        await prisma.$transaction([
          prisma.boostPurchase.update({
            where: { id: boost.id },
            data: { status: "COMPLETED", completedAt: new Date() },
          }),
          prisma.listing.update({
            where: { id: boost.listingId },
            data: { boostedUntil },
          }),
        ]);
      }
    } else {
      const order = await prisma.order.findUnique({
        where: { stripeSessionId: checkoutSession.id },
      });

      if (order && order.status === "PENDING") {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: "COMPLETED", completedAt: new Date() },
          }),
          // One-off goods (tools, businesses, prompt packs, games, ideas) are
          // sold once — mark the listing SOLD so it drops out of browse/search
          // but stays visible to the seller with the sale on record.
          prisma.listing.update({
            where: { id: order.listingId },
            data: { status: "SOLD" },
          }),
        ]);
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    if (checkoutSession.metadata?.cosmeticPackId) {
      await prisma.cosmeticPurchase.updateMany({
        where: { stripeSessionId: checkoutSession.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    } else if (checkoutSession.metadata?.boostListingId) {
      await prisma.boostPurchase.updateMany({
        where: { stripeSessionId: checkoutSession.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    } else {
      await prisma.order.updateMany({
        where: { stripeSessionId: checkoutSession.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}

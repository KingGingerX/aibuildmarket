import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// POST /api/stripe/connect — creates (if needed) a Stripe Express account for
// the logged-in seller and returns a fresh onboarding link. Safe to call
// repeatedly: account links expire after a short time, so "Continue setup"
// on the payouts page just calls this again.
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const stripe = getStripe();
  let accountId = user.stripeConnectId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeConnectId: accountId },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL;
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/sell/payouts`,
    return_url: `${baseUrl}/sell/payouts?onboarded=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}

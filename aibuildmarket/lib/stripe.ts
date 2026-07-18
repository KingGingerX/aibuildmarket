import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is required for Stripe operations.");
  }

  stripeClient ??= new Stripe(apiKey, {
    apiVersion: "2024-06-20" as unknown as Stripe.LatestApiVersion,
  });
  return stripeClient;
}

export const PLATFORM_FEE_BPS = 800;

export function platformFeeFor(priceCents: number): number {
  return Math.round((priceCents * PLATFORM_FEE_BPS) / 10000);
}

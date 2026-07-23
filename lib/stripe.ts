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

export const PLATFORM_FEE_BPS = 500;

export function platformFeeFor(priceCents: number): number {
  return Math.round((priceCents * PLATFORM_FEE_BPS) / 10000);
}

// Listing boost: flat fee, sorts the listing above non-boosted listings in
// browse/search while boostedUntil is in the future.
export const BOOST_PRICE_CENTS = 900;
export const BOOST_DAYS = 7;

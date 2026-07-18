import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20" as unknown as Stripe.LatestApiVersion,
});

// 8% — matches the fee shown on the marketplace page and revenue-transparency copy.
export const PLATFORM_FEE_BPS = 800;

export function platformFeeFor(priceCents: number): number {
  return Math.round((priceCents * PLATFORM_FEE_BPS) / 10000);
}

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

// TEMPORARY one-off route. Delete this file after use.
// GET: reports every field on the platform's own Stripe account that could be
// rendering as "KWP" on Connect onboarding / checkout pages.
// POST { name }: updates the cosmetic branding display name (not the legal
// business_profile.name, which is tied to KYC/verification) to the given value.
const TOKEN = "62248ff0a025eb6eaf627b01a94a5f26e1ad3eb1c830cb76";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-branding-token");
  if (token !== TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve();

  return NextResponse.json({
    accountId: account.id,
    business_profile_name: account.business_profile?.name ?? null,
    business_profile_url: account.business_profile?.url ?? null,
    settings_dashboard_display_name: account.settings?.dashboard?.display_name ?? null,
    settings_branding_display_name: (account.settings as unknown as { branding?: { primary_color?: string; icon?: string; logo?: string } })?.branding ?? null,
    company_name: (account as unknown as { company?: { name?: string } }).company?.name ?? null,
    email: account.email ?? null,
  });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-branding-token");
  if (token !== TOKEN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Missing name." }, { status: 400 });
  }

  const stripe = getStripe();
  const before = await stripe.accounts.retrieve();
  const updated = await stripe.accounts.update(before.id, {
    business_profile: { name },
  });

  return NextResponse.json({
    before: {
      business_profile_name: before.business_profile?.name ?? null,
      settings_dashboard_display_name: before.settings?.dashboard?.display_name ?? null,
    },
    after: {
      business_profile_name: updated.business_profile?.name ?? null,
      settings_dashboard_display_name: updated.settings?.dashboard?.display_name ?? null,
    },
  });
}

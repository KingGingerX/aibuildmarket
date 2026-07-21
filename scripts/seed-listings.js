// One-off: bulk-insert Goody's built products as marketplace listings under the admin seller account.
// Run: node scripts/seed-listings.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SELLER_EMAIL = "kinggingerxxx@gmail.com";

const LISTINGS = [
  {
    title: "TGB Global Systems — AI Business-in-a-Box Course",
    description:
      "Two-tier course teaching how to build and launch automated AI-powered businesses from scratch, packaged with the sales engine and funnel used to sell it. $99 core tier / $199 upgraded tier with extended modules.",
    category: "AI_TOOLS",
    priceCents: 9900,
  },
  {
    title: "MarketFunnel",
    description:
      "End-to-end marketing funnel system — landing pages, email capture, and automated follow-up sequencing built for launching digital products fast.",
    category: "AI_TOOLS",
    priceCents: null,
  },
  {
    title: "SiteKick",
    description:
      "Website sales automation tool that finds prospects, audits their site, and pitches a redesign/build automatically. Elite tier includes expanded outreach and reporting.",
    category: "AI_TOOLS",
    priceCents: null,
  },
  {
    title: "RevDaemon",
    description:
      "Real 5-income-stream automation system — runs multiple monetization channels concurrently with no manual babysitting. Rebuilt from the ground up to execute real transactions, not simulated ones.",
    category: "BUSINESSES",
    priceCents: null,
  },
  {
    title: "AlphaGirl Workout",
    description:
      "$67 women's fitness program — structured training plan packaged as a digital product with Gumroad delivery and dedicated traffic funnel.",
    category: "AI_TOOLS",
    priceCents: 6700,
  },
  {
    title: "AAE Venice — Affiliate Automation Engine",
    description:
      "Full affiliate marketing automation engine: recruits affiliates, tracks performance, and manages payouts. Includes a $47 Pro upsell tier.",
    category: "AI_TOOLS",
    priceCents: 4700,
  },
  {
    title: "AdVelocity",
    description:
      "AI ad campaign generator — produces and manages ad creative and campaign structure across platforms. $47 lifetime access paywall.",
    category: "AI_TOOLS",
    priceCents: 4700,
  },
  {
    title: "FanslyBot",
    description:
      "Automated Fansly account manager — handles posting, messaging, and engagement on autopilot for content creators.",
    category: "AI_TOOLS",
    priceCents: null,
  },
  {
    title: "ELFF — Elite Lead Footprint Formulator",
    description:
      "Lead generation platform: Flask + Stripe with $49/$99/$199 tiers, a 13-email nurture funnel, and a built-in honeypot system for filtering junk leads.",
    category: "AI_TOOLS",
    priceCents: 4900,
  },
  {
    title: "GEO Platform",
    description:
      "LLM and Bing search optimization CLI suite — 9 products covering AI-search visibility and citation tracking. $97/$297 tiers, live webhook + upsell flow.",
    category: "AI_TOOLS",
    priceCents: 9700,
  },
  {
    title: "InstaGeniq",
    description:
      "Instagram monetization toolkit — Flask + Stripe, $37/$97/$197 tiers, health-checked and confirmed working.",
    category: "AI_TOOLS",
    priceCents: 3700,
  },
  {
    title: "CashMoto",
    description:
      "CLI tool for automating Whop storefront operations — the Whop equivalent of a Stripe automation CLI. One command to activate and go.",
    category: "AI_TOOLS",
    priceCents: null,
  },
  {
    title: "AutoDate",
    description:
      "Dating profile auto-signup CLI — provisions profiles across 6 dating sites. BASIC/PRO/ELITE tiers at $27/$47/$97 with Stripe + Flask payment integration.",
    category: "AI_TOOLS",
    priceCents: 2700,
  },
  {
    title: "The Gameboard",
    description:
      "Gamified peer-to-peer marketplace with real Stripe payments wired end-to-end — buy, sell, and trade with built-in game mechanics driving engagement.",
    category: "GAMES",
    priceCents: null,
  },
  {
    title: "ConstantHalo — InvestorIQ Outreach Pipeline",
    description:
      "Automated investor outreach pipeline — sources, filters, and contacts investors at scale. Live and running with a 93/100 internal quality grade.",
    category: "AI_TOOLS",
    priceCents: null,
  },
  {
    title: "Reflexion",
    description:
      "6-agent autonomous digital-product pipeline — a self-directed multi-agent system that researches, builds, and ships digital products with minimal human input.",
    category: "AI_TOOLS",
    priceCents: null,
  },
];

async function main() {
  const seller = await prisma.user.findUnique({ where: { email: SELLER_EMAIL } });
  if (!seller) {
    throw new Error(`Seller account ${SELLER_EMAIL} not found — run scripts/seed-admin.js first.`);
  }

  let created = 0;
  let skipped = 0;

  for (const item of LISTINGS) {
    const existing = await prisma.listing.findFirst({
      where: { title: item.title, sellerId: seller.id },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.listing.create({
      data: {
        title: item.title,
        description: item.description,
        category: item.category,
        priceCents: item.priceCents,
        sellerId: seller.id,
        active: true,
      },
    });
    created++;
  }

  console.log(`Seed complete: ${created} listings created, ${skipped} already existed (skipped).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

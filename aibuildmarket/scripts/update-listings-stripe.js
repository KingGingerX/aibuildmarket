// One-off: sync marketplace listings against real Stripe catalog (Paid! live key),
// rebrand GEO Platform -> AIRanked, and drop discontinued products.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const SELLER_EMAIL = "kinggingerxxx@gmail.com";

const REMOVE_TITLES = ["AutoDate", "InstaGeniq"];

// title -> { newTitle?, priceCents, note }, sourced from live Stripe products/prices
// pulled via Paid!'s sk_live key (2026-07-17).
const UPDATES = {
  "TGB Global Systems — AI Business-in-a-Box Course": {
    priceCents: 19900,
    note: "Matches Stripe product 'TGB Global Systems Course — Premium' (prod_UbWjF7jDi18fS9).",
  },
  "SiteKick": {
    priceCents: 9700,
    note: "Matches Stripe product 'SiteKick Elite — Lifetime Access' (prod_UbWkxeUkWBq7mR).",
  },
  "RevDaemon": {
    priceCents: 19700,
    note: "Matches Stripe product 'Revenue System Bundle' (prod_UXzUob9RUkQYaV), RevDaemon's flagship bundle.",
  },
  "AlphaGirl Workout": {
    priceCents: 6700,
    note: "Matches Stripe product 'AlphaGirl Workout — Complete Program' (prod_UbWkwiYsUayjrn).",
  },
  "AAE Venice — Affiliate Automation Engine": {
    priceCents: 4700,
    note: "Matches Stripe product 'AAE Venice — Affiliate Engine Base' (prod_UbWmLiLLsJWc66); Pro tier is $97.",
  },
  "AdVelocity": {
    priceCents: 4700,
    note: "Matches Stripe product 'AdVelocity Pro — Lifetime Access' (prod_UXowW7MpnxnK5C).",
  },
  "FanslyBot": {
    priceCents: 9700,
    note: "Matches Stripe product 'FanslyBot' base tier (prod_UbWrZqC3BdXzST); Creator $197 / Moneymaker $497 tiers also live.",
  },
  "ELFF — Elite Lead Footprint Formulator": {
    priceCents: 4900,
    note: "Matches Stripe product 'ELFF Starter Pack — 25 Leads' (prod_UXpM4capzcE1dN); Pro $99 / Agency $199 also live.",
  },
  "GEO Platform": {
    newTitle: "AIRanked",
    description:
      "LLM and Bing search optimization CLI suite (rebranded from GEO Platform) — 9 products covering AI-search visibility and citation tracking. Lifetime license priced from live Stripe catalog; Agency (unlimited products) tier at $297 also available.",
    priceCents: 9700,
    note: "Matches Stripe product 'GEO Platform — Lifetime License' (prod_UbWmuKQA3nHZeC), rebrand applied at listing level.",
  },
  "Ninth Circle": {
    priceCents: 1900,
    note: "Matches Stripe product 'Premium Seller Monthly' (prod_UfzaXWI6qQL8zw), entry price point; Annual $179 also live.",
  },
  "Bro Cmon": {
    priceCents: 3000,
    note: "Matches Stripe product 'Bro, C'mon Elite Lifetime' (prod_UapMZgIbmF71bZ), current active price.",
  },
  "SyncdLab": {
    priceCents: 1900,
    note: "Matches Stripe product 'SyncPass Monthly' (prod_UjlZLY9KcSbx1L), entry price point.",
  },
  "The Gameboard": {
    priceCents: 1900,
    note: "Matches Stripe product 'Pro Player' (prod_UjQsbDBBgK4PsG).",
  },
};

async function main() {
  const seller = await prisma.user.findUnique({ where: { email: SELLER_EMAIL } });
  if (!seller) throw new Error(`Seller ${SELLER_EMAIL} not found`);

  let removed = 0;
  for (const title of REMOVE_TITLES) {
    const r = await prisma.listing.deleteMany({ where: { title, sellerId: seller.id } });
    removed += r.count;
  }

  let updated = 0;
  for (const [title, u] of Object.entries(UPDATES)) {
    const listing = await prisma.listing.findFirst({ where: { title, sellerId: seller.id } });
    if (!listing) {
      console.log(`SKIP (not found): ${title}`);
      continue;
    }
    const data = { priceCents: u.priceCents };
    if (u.newTitle) data.title = u.newTitle;
    if (u.description) data.description = u.description;
    await prisma.listing.update({ where: { id: listing.id }, data });
    updated++;
    console.log(`Updated: ${title}${u.newTitle ? ` -> ${u.newTitle}` : ""} | $${(u.priceCents / 100).toFixed(2)} | ${u.note}`);
  }

  console.log(`\nDone. Removed ${removed} listing(s), updated ${updated} listing(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

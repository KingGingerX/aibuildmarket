const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const stripeFile = path.join(process.env.TEMP || "/tmp", "stripe_full2.json");
const stripeData = JSON.parse(fs.readFileSync(stripeFile, "utf8"));

// Same product IDs used to set prices originally (scripts/update-listings-stripe.js).
const LISTING_TO_PRODUCT = {
  "TGB Global Systems — AI Business-in-a-Box Course": "prod_UbWjF7jDi18fS9",
  "SiteKick": "prod_UbWkxeUkWBq7mR",
  "RevDaemon": "prod_UXzUob9RUkQYaV",
  "AlphaGirl Workout": "prod_UbWkwiYsUayjrn",
  "AAE Venice — Affiliate Automation Engine": "prod_UbWmLiLLsJWc66",
  "AdVelocity": "prod_UXowW7MpnxnK5C",
  "FanslyBot": "prod_UbWrZqC3BdXzST", // now FansMatrix in DB, product itself still named FanslyBot in Stripe
  "ELFF — Elite Lead Footprint Formulator": "prod_UXpM4capzcE1dN",
  "GEO Platform": "prod_UbWmuKQA3nHZeC", // now AIRanked in DB
  "Ninth Circle": "prod_UfzaXWI6qQL8zw",
  "Bro Cmon": "prod_UapMZgIbmF71bZ",
  "SyncdLab": "prod_UjlZLY9KcSbx1L",
  "The Gameboard": "prod_UjQsbDBBgK4PsG",
};

const DB_TITLE_MAP = {
  "TGB Global Systems — AI Business-in-a-Box Course": "TGB Global Systems — AI Business-in-a-Box Course",
  "SiteKick": "SiteKick",
  "RevDaemon": "RevDaemon",
  "AlphaGirl Workout": "AlphaGirl Workout",
  "AAE Venice — Affiliate Automation Engine": "AAE Venice — Affiliate Automation Engine",
  "AdVelocity": "AdVelocity",
  "FanslyBot": "FansMatrix",
  "ELFF — Elite Lead Footprint Formulator": "ELFF — Elite Lead Footprint Formulator",
  "GEO Platform": "AIRanked",
  "Ninth Circle": "Ninth Circle",
  "Bro Cmon": "Bro Cmon",
  "SyncdLab": "SyncdLab",
  "The Gameboard": "The Gameboard",
};

async function main() {
  const prisma = new PrismaClient();
  const dbListings = await prisma.listing.findMany({ select: { title: true, priceCents: true } });
  const dbByTitle = Object.fromEntries(dbListings.map((l) => [l.title, l.priceCents]));

  console.log("listing".padEnd(45), "db_price".padEnd(10), "stripe_price".padEnd(12), "product_active?", "match?");
  for (const [key, productId] of Object.entries(LISTING_TO_PRODUCT)) {
    const dbTitle = DB_TITLE_MAP[key];
    const dbPrice = dbByTitle[dbTitle];
    if (dbPrice === undefined) {
      console.log(dbTitle.padEnd(45), "REMOVED FROM DB — skip");
      continue;
    }
    const product = stripeData.find((p) => p.id === productId);
    if (!product) {
      console.log(dbTitle.padEnd(45), String(dbPrice).padEnd(10), "PRODUCT NOT FOUND (inactive/deleted)");
      continue;
    }
    const activePrices = product.prices.filter((pr) => pr.unit_amount != null);
    const cheapest = activePrices.sort((a, b) => a.unit_amount - b.unit_amount)[0];
    const stripePrice = cheapest ? cheapest.unit_amount : null;
    const match = stripePrice === dbPrice ? "OK" : "MISMATCH";
    console.log(
      dbTitle.padEnd(45),
      String(dbPrice).padEnd(10),
      String(stripePrice).padEnd(12),
      "yes".padEnd(15),
      match,
      activePrices.length > 1 ? `(${activePrices.length} tiers: ${activePrices.map((p) => p.unit_amount).join(",")})` : ""
    );
  }

  // ConstantHalo has no Stripe product match — verify it's still null in DB (Contact Seller).
  const ch = dbByTitle["ConstantHalo — InvestorIQ Outreach Pipeline"];
  console.log("\nConstantHalo — InvestorIQ Outreach Pipeline".padEnd(45), String(ch), "(no Stripe product — expect null)");

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

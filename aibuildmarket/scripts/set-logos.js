const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const LOGOS = {
  "AIRanked": "/logos/airanked.webp",
  "AdVelocity": "/logos/advelocity.webp",
  "AlphaGirl Workout": "/logos/alphagirl.webp",
  "Bro Cmon": "/logos/brocmon.webp",
  "ConstantHalo — InvestorIQ Outreach Pipeline": "/logos/constanthalo.webp",
  "ELFF — Elite Lead Footprint Formulator": "/logos/elff.webp",
  "FansMatrix": "/logos/fansmatrix.webp",
  "Ninth Circle": "/logos/ninthcircle.webp",
  "SyncdLab": "/logos/syncdlab.webp",
  "TGB Global Systems — AI Business-in-a-Box Course": "/logos/tgbcourse.webp",
};

async function main() {
  let updated = 0;
  for (const [title, imageUrl] of Object.entries(LOGOS)) {
    const r = await prisma.listing.updateMany({ where: { title }, data: { imageUrl } });
    if (r.count === 0) console.log(`SKIP (not found): ${title}`);
    else updated += r.count;
  }
  console.log(`Updated ${updated} listing(s) with real logos.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());

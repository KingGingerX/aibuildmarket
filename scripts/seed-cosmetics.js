// One-off: seed the initial font/emoji pack catalog.
// Run: node scripts/seed-cosmetics.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const FONT_PACKS = [
  { slug: "space-mono", name: "Space Mono", description: "Technical, monospace, hacker energy.", payload: "'Space Mono', monospace", priceCents: 199 },
  { slug: "playfair-display", name: "Playfair Display", description: "Editorial serif, high-end and dramatic.", payload: "'Playfair Display', serif", priceCents: 199 },
  { slug: "pacifico", name: "Pacifico", description: "Handwritten script, casual and friendly.", payload: "'Pacifico', cursive", priceCents: 249 },
  { slug: "poppins", name: "Poppins", description: "Clean rounded geometric sans, modern and bold.", payload: "'Poppins', sans-serif", priceCents: 149 },
];

const EMOJI_PACKS = [
  { slug: "hustle-pack", name: "Hustle Pack", description: "For closing deals and flexing wins.", payload: JSON.stringify(["🔥", "💰", "🚀", "💎", "⚡", "🏆"]), priceCents: 149 },
  { slug: "reactions-pack", name: "Reactions Pack", description: "Quick reactions for comment threads.", payload: JSON.stringify(["😂", "👀", "💯", "🤝", "👍", "🙌"]), priceCents: 99 },
  { slug: "builder-pack", name: "Builder Pack", description: "For the AI-builder crowd.", payload: JSON.stringify(["🤖", "🧠", "⚙️", "🛠️", "🧪", "📈"]), priceCents: 149 },
];

async function main() {
  for (const pack of FONT_PACKS) {
    await prisma.cosmeticPack.upsert({
      where: { slug: pack.slug },
      create: { ...pack, type: "FONT" },
      update: {},
    });
  }
  for (const pack of EMOJI_PACKS) {
    await prisma.cosmeticPack.upsert({
      where: { slug: pack.slug },
      create: { ...pack, type: "EMOJI" },
      update: {},
    });
  }
  const count = await prisma.cosmeticPack.count();
  console.log(`Cosmetic catalog seeded. Total active packs: ${count}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

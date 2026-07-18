const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const OUT_DIR = path.join(__dirname, "..", "public", "logos");
fs.mkdirSync(OUT_DIR, { recursive: true });

const SOURCES = {
  airanked: "C:/Users/goods/AIRanked/airanked_logo.png",
  advelocity: "C:/Users/goods/AdVelocity/public/logo.jpeg",
  alphagirl: "C:/Users/goods/AlphaGirl-Workout/alphagirl logo.jpg",
  brocmon: "C:/Users/goods/bro_cmon/app/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024x1024@1x.png",
  constanthalo: "C:/Users/goods/investoriq/ConstantHalo/ConstantHalo_Logo.png",
  elff: "C:/Users/goods/ELFF/ELFF_LOGO.jpeg",
  fansmatrix: "C:/Users/goods/FansMatrix/FansMatrix_Logo.png",
  ninthcircle: "C:/Users/goods/WarCircle/n9nthcircle_Logo.png",
  syncdlab: "C:/Users/goods/SyncdLab/SyncdLab_Logo1.png",
  tgbcourse: "C:/Users/goods/course-platform/MAsterClass_logo.png",
};

async function main() {
  for (const [slug, src] of Object.entries(SOURCES)) {
    const out = path.join(OUT_DIR, `${slug}.webp`);
    await sharp(src)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 85 })
      .toFile(out);
    const { size } = fs.statSync(out);
    console.log(`${slug}.webp <- ${src} (${(size / 1024).toFixed(1)}KB)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

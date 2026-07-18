const fs = require("fs");
const path = require("path");

const file = path.join(process.env.TEMP || "/tmp", "stripe_full.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));

const targets = [
  "TGB", "AlphaGirl", "AAE Venice", "AdVelocity", "FanslyBot", "elff",
  "GEO", "NinthCircle", "BroCmon", "Bro,", "CashMoto", "Whop", "SyncdLab",
  "Gameboard", "ConstantHalo", "InvestorIQ", "Reflexion", "RevDaemon",
  "MarketFunnel", "SiteKick",
];

for (const p of data) {
  const meta = JSON.stringify(p.metadata || {});
  const hay = (p.name + " " + meta).toLowerCase();
  if (targets.some((t) => hay.includes(t.toLowerCase()))) {
    console.log(p.id, "|", p.name, "| meta:", meta, "| prices:", JSON.stringify(p.prices));
  }
}

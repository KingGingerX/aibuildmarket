const https = require("https");

const KEY = process.env.STRIPE_KEY;

function stripeGet(path) {
  return new Promise((resolve, reject) => {
    https.get(
      { hostname: "api.stripe.com", path, auth: `${KEY}:` },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      }
    ).on("error", reject);
  });
}

async function fetchAllProducts() {
  let all = [];
  let startingAfter = "";
  while (true) {
    const path = `/v1/products?limit=100&active=true${startingAfter ? `&starting_after=${startingAfter}` : ""}`;
    const d = await stripeGet(path);
    if (d.error) throw new Error(d.error.message);
    all = all.concat(d.data);
    if (!d.has_more) break;
    startingAfter = d.data[d.data.length - 1].id;
  }
  return all;
}

async function fetchAllPrices() {
  let all = [];
  let startingAfter = "";
  while (true) {
    const path = `/v1/prices?limit=100&active=true${startingAfter ? `&starting_after=${startingAfter}` : ""}`;
    const d = await stripeGet(path);
    if (d.error) throw new Error(d.error.message);
    all = all.concat(d.data);
    if (!d.has_more) break;
    startingAfter = d.data[d.data.length - 1].id;
  }
  return all;
}

async function main() {
  const [products, prices] = await Promise.all([fetchAllProducts(), fetchAllPrices()]);
  const priceByProduct = {};
  for (const pr of prices) {
    const pid = typeof pr.product === "string" ? pr.product : pr.product.id;
    if (!priceByProduct[pid]) priceByProduct[pid] = [];
    priceByProduct[pid].push({
      id: pr.id,
      unit_amount: pr.unit_amount,
      currency: pr.currency,
      recurring: pr.recurring ? pr.recurring.interval : null,
    });
  }
  const out = products.map((p) => ({
    id: p.id,
    name: p.name,
    metadata: p.metadata,
    prices: priceByProduct[p.id] || [],
  }));
  console.log(JSON.stringify(out, null, 2));
  console.error(`TOTAL PRODUCTS: ${products.length}, TOTAL PRICES: ${prices.length}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

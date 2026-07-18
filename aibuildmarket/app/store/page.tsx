import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BuyPackButton from "./BuyPackButton";

export default async function StorePage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const isAdmin = Boolean((session?.user as { isAdmin?: boolean } | undefined)?.isAdmin);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const packs = await prisma.cosmeticPack.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    include: userId
      ? { purchases: { where: { userId, status: "COMPLETED" } } }
      : undefined,
  });

  const fontPacks = packs.filter((p) => p.type === "FONT");
  const emojiPacks = packs.filter((p) => p.type === "EMOJI");

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px" }}>
      <h1>Store</h1>
      <p className="dim">
        Font packs and emoji packs for your comments and profile. Unlocked packs show up in the composer everywhere on the site.
        {isAdmin && " Your admin account has every pack unlocked automatically."}
      </p>

      <h2 style={{ marginTop: 32 }}>Font Packs</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {fontPacks.map((p) => (
          <div key={p.id} className="stat-card">
            <div style={{ fontFamily: p.payload, fontSize: 20 }}>{p.name}</div>
            <div className="dim" style={{ fontSize: 13, margin: "6px 0" }}>{p.description}</div>
            <BuyPackButton
              packId={p.id}
              priceCents={p.priceCents}
              owned={isAdmin || ("purchases" in p && (p as unknown as { purchases: unknown[] }).purchases.length > 0)}
              isLoggedIn={isLoggedIn}
            />
          </div>
        ))}
        {fontPacks.length === 0 && <p className="dim">No font packs yet.</p>}
      </div>

      <h2 style={{ marginTop: 32 }}>Emoji Packs</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {emojiPacks.map((p) => (
          <div key={p.id} className="stat-card">
            <div style={{ fontSize: 20 }}>{JSON.parse(p.payload).slice(0, 6).join(" ")}</div>
            <div style={{ marginTop: 4 }}>{p.name}</div>
            <div className="dim" style={{ fontSize: 13, margin: "6px 0" }}>{p.description}</div>
            <BuyPackButton
              packId={p.id}
              priceCents={p.priceCents}
              owned={isAdmin || ("purchases" in p && (p as unknown as { purchases: unknown[] }).purchases.length > 0)}
              isLoggedIn={isLoggedIn}
            />
          </div>
        ))}
        {emojiPacks.length === 0 && <p className="dim">No emoji packs yet.</p>}
      </div>
    </main>
  );
}

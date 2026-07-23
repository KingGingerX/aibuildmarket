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
    <main className="page-shell" style={{ maxWidth: 960 }}>
      <h1>Store</h1>
      <p className="dim">
        Cosmetic packs for how your name and comments look elsewhere on the site — not related to listing a build for sale.
        Unlock a pack once and it&apos;s yours to use anywhere on AI Build Market.
        {isAdmin && " Your admin account has every pack unlocked automatically."}
        {!isLoggedIn && " Log in to unlock a pack — the price shown is what it costs, one time, forever."}
      </p>

      <h2 style={{ marginTop: 36, marginBottom: 4 }}>Font Packs</h2>
      <p className="dim" style={{ fontSize: 13, marginBottom: 16 }}>Changes the font your display name and comments render in.</p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {fontPacks.map((p) => {
          const owned = isAdmin || ("purchases" in p && (p as unknown as { purchases: unknown[] }).purchases.length > 0);
          return (
            <div key={p.id} className="card store-pack-card" style={{ padding: 18 }}>
              <div style={{ fontFamily: p.payload, fontSize: 22 }}>{p.name}</div>
              <div className="dim" style={{ fontSize: 12.5, margin: "8px 0 14px", lineHeight: 1.5 }}>{p.description}</div>
              <BuyPackButton packId={p.id} priceCents={p.priceCents} owned={owned} isLoggedIn={isLoggedIn} />
            </div>
          );
        })}
        {fontPacks.length === 0 && <p className="dim">No font packs yet.</p>}
      </div>

      <h2 style={{ marginTop: 36, marginBottom: 4 }}>Emoji Packs</h2>
      <p className="dim" style={{ fontSize: 13, marginBottom: 16 }}>Unlocks a set of emoji shortcuts in the comment composer.</p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {emojiPacks.map((p) => {
          const owned = isAdmin || ("purchases" in p && (p as unknown as { purchases: unknown[] }).purchases.length > 0);
          return (
            <div key={p.id} className="card store-pack-card" style={{ padding: 18 }}>
              <div style={{ fontSize: 22 }}>{JSON.parse(p.payload).slice(0, 6).join(" ")}</div>
              <div style={{ marginTop: 6, fontWeight: 600 }}>{p.name}</div>
              <div className="dim" style={{ fontSize: 12.5, margin: "6px 0 14px", lineHeight: 1.5 }}>{p.description}</div>
              <BuyPackButton packId={p.id} priceCents={p.priceCents} owned={owned} isLoggedIn={isLoggedIn} />
            </div>
          );
        })}
        {emojiPacks.length === 0 && <p className="dim">No emoji packs yet.</p>}
      </div>
    </main>
  );
}

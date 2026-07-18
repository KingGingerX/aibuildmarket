import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import CosmeticPackForm from "./CosmeticPackForm";
import PackRow from "./PackRow";

export default async function AdminPage() {
  const session = await requireAdmin();
  if (!session) redirect("/");

  const [userCount, listingCount, orderCount, revenue, packs] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count({ where: { active: true } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.aggregate({ where: { status: "COMPLETED" }, _sum: { platformFeeCents: true } }),
    prisma.cosmeticPack.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const cosmeticRevenue = await prisma.cosmeticPurchase.aggregate({
    where: { status: "COMPLETED" },
    _sum: { amountCents: true },
  });

  return (
    <main className="admin-shell" style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px" }}>
      <h1>Admin</h1>
      <p className="dim">Full access — every font pack and emoji pack is unlocked on your account automatically.</p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, margin: "24px 0" }}>
        <div className="stat-card"><div className="dim">Users</div><div style={{ fontSize: 28 }}>{userCount}</div></div>
        <div className="stat-card"><div className="dim">Active Listings</div><div style={{ fontSize: 28 }}>{listingCount}</div></div>
        <div className="stat-card"><div className="dim">Completed Orders</div><div style={{ fontSize: 28 }}>{orderCount}</div></div>
        <div className="stat-card"><div className="dim">Platform Fee Revenue</div><div style={{ fontSize: 28 }}>${((revenue._sum.platformFeeCents ?? 0) / 100).toFixed(2)}</div></div>
      </section>

      <section style={{ margin: "24px 0" }}>
        <div className="stat-card" style={{ maxWidth: 320 }}>
          <div className="dim">Cosmetic Pack Revenue</div>
          <div style={{ fontSize: 28 }}>${((cosmeticRevenue._sum.amountCents ?? 0) / 100).toFixed(2)}</div>
        </div>
      </section>

      <h2>Create Font / Emoji Pack</h2>
      <CosmeticPackForm />

      <h2 style={{ marginTop: 32 }}>All Packs ({packs.length})</h2>
      {packs.length === 0 ? (
        <p className="dim">No packs yet — create one above.</p>
      ) : (
        <div className="stack">
          {packs.map((p) => (
            <PackRow key={p.id} pack={p} />
          ))}
        </div>
      )}
    </main>
  );
}

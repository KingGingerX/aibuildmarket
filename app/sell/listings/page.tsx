import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ManageListingRow from "./ManageListingRow";

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ boosted?: string }>;
}) {
  const { boosted } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const listings = await prisma.listing.findMany({
    where: { sellerId: userId },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();

  return (
    <main className="page-shell" style={{ maxWidth: 820 }}>
      <h1>My Listings</h1>
      <p className="dim">
        Edit, price, deactivate, mark sold, boost, or delete anything you've listed. Free to list —{" "}
        <Link href="/listings/new" style={{ color: "var(--molten)" }}>list a new build</Link>.
      </p>

      {boosted === "1" && <div className="purchase-banner purchase-success">Boost active — check your email for the receipt.</div>}
      {boosted === "cancelled" && <div className="purchase-banner purchase-cancelled">Boost checkout was cancelled — no charge was made.</div>}

      {listings.length === 0 ? (
        <p className="dim" style={{ marginTop: 24 }}>You haven't listed anything yet.</p>
      ) : (
        <div className="stack" style={{ marginTop: 24, gap: 16 }}>
          {listings.map((l) => (
            <ManageListingRow
              key={l.id}
              listing={{
                id: l.id,
                title: l.title,
                description: l.description,
                category: l.category,
                priceCents: l.priceCents,
                status: l.status,
                crossPosted: l.crossPosted,
                boosted: Boolean(l.boostedUntil && l.boostedUntil.getTime() > now),
                boostedUntil: l.boostedUntil ? l.boostedUntil.toISOString() : null,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ListingCard, { ListingCardData } from "../components/ListingCard";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  const listings = q
    ? await prisma.listing.findMany({
        where: {
          active: true,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: isLoggedIn ? { seller: { select: { displayName: true, isVerifiedSeller: true } } } : undefined,
      })
    : [];

  const cards: ListingCardData[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    category: l.category,
    imageUrl: l.imageUrl,
    priceCents: isLoggedIn ? l.priceCents : undefined,
    seller: isLoggedIn ? (l as unknown as { seller: ListingCardData["seller"] }).seller : undefined,
  }));

  return (
    <main className="section" style={{ paddingTop: 48 }}>
      <div className="section-head"><h2>Search Listings</h2></div>
      <form className="search-bar" method="GET">
        <input name="q" defaultValue={q ?? ""} placeholder="Search tools, businesses, prompts, games…" />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {!q ? (
        <p className="dim">Type something to search active listings.</p>
      ) : cards.length === 0 ? (
        <p className="dim">No listings match &ldquo;{q}&rdquo;.</p>
      ) : (
        <div className="grid">
          {cards.map((c) => (
            <ListingCard key={c.id} listing={c} authenticated={isLoggedIn} />
          ))}
        </div>
      )}
    </main>
  );
}

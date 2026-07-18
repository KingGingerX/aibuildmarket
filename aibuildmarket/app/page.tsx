import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ListingCard, { ListingCardData } from "./components/ListingCard";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/categories";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  const activeCategory = category && CATEGORY_ORDER.includes(category) ? category : undefined;

  const listings = await prisma.listing.findMany({
    where: { active: true, ...(activeCategory ? { category: activeCategory as never } : {}) },
    orderBy: { createdAt: "desc" },
    include: isLoggedIn ? { seller: { select: { displayName: true, isVerifiedSeller: true } } } : undefined,
  });

  const counts = await prisma.listing.groupBy({
    by: ["category"],
    where: { active: true },
    _count: true,
  });
  const countByCategory = Object.fromEntries(counts.map((c) => [c.category, c._count]));
  const totalCount = counts.reduce((sum, c) => sum + c._count, 0);

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
    <main>
      <section className="hero">
        <div className="hero-watermark" aria-hidden="true">
          <Image src="/logo.jpg" alt="" fill sizes="1100px" />
        </div>
        <h1>
          Sell what your <span className="accent">AI built</span>. Buy what works.
        </h1>
        <p>Tools, businesses, prompts, ideas, and games — built with AI, sold to real buyers. We bring the traffic. You bring the build.</p>
        <div className="hero-ctas">
          <a href="#listings" className="btn btn-primary btn-lg">Browse the Marketplace</a>
          <Link href="/listings/new" className="btn btn-ghost btn-lg">List Your First Build — Free</Link>
        </div>
      </section>

      <section className="section" id="listings">
        <div className="section-head">
          <h2>Browse by Category</h2>
          <Link href="/search" className="see-all">Search listings →</Link>
        </div>
        <div className="cat-rail">
          <Link href="/" className={`cat-pill${!activeCategory ? " active" : ""}`}>
            <span className="cat-name">All</span>
            <span className="cat-count mono">{totalCount}</span>
          </Link>
          {CATEGORY_ORDER.map((value) => {
            const meta = CATEGORY_META[value];
            return (
              <Link key={value} href={`/?category=${value}`} className={`cat-pill${activeCategory === value ? " active" : ""}`}>
                <span className="cat-icon">{meta.icon}</span>
                <span className="cat-name">{meta.label}</span>
                <span className="cat-count mono">{countByCategory[value] ?? 0}</span>
              </Link>
            );
          })}
        </div>

        {!isLoggedIn && (
          <p className="dim" style={{ marginBottom: 24, fontSize: 13.5 }}>
            Browsing as a guest — <Link href="/login" style={{ color: "var(--molten)" }}>log in</Link> to see price, seller, and comments on every listing.
          </p>
        )}

        {cards.length === 0 ? (
          <p className="dim">No active listings in this category yet.</p>
        ) : (
          <div className="grid">
            {cards.map((c) => (
              <ListingCard key={c.id} listing={c} authenticated={isLoggedIn} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="seller-banner">
          <div className="seller-banner-copy">
            <h3>Stop paying for ads. Come sell where the buyers already are.</h3>
            <p>Every listing gets placed in front of buyers actively looking to spend — no ad account, no targeting setup, no wasted spend testing creatives. We only take a cut when you actually get paid.</p>
            <Link href="/listings/new" className="btn btn-primary">List a Build — Takes 4 Minutes</Link>
          </div>
          <div className="stat-row">
            <div className="stat"><div className="num">8%</div><div className="lbl">house fee<br />(sale only)</div></div>
            <div className="stat"><div className="num">$0</div><div className="lbl">to list<br />a build</div></div>
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="section-head"><h2>Frequently Asked Questions</h2></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 820 }}>
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 6 }}>What is AI Build Market?</h3>
            <p className="dim" style={{ fontSize: 13.5, lineHeight: 1.6 }}>AI Build Market is an online marketplace where people who build AI tools, AI-powered businesses, prompt packs, product ideas, and games can list them for sale directly to buyers. The platform takes a transaction fee only when a sale completes.</p>
          </div>
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 6 }}>How much does AI Build Market charge to sell something?</h3>
            <p className="dim" style={{ fontSize: 13.5, lineHeight: 1.6 }}>Listing is free. AI Build Market charges a transaction fee only on completed sales, so sellers pay nothing upfront to list an AI tool, business, prompt pack, idea, or game.</p>
          </div>
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 6 }}>Is AI Build Market responsible for what's sold on the platform?</h3>
            <p className="dim" style={{ fontSize: 13.5, lineHeight: 1.6 }}>No. AI Build Market is a venue connecting independent buyers and sellers. Every sale is a direct agreement between buyer and seller, and all listings are sold as-is unless a seller states an additional guarantee in writing on the listing.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

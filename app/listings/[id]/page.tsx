import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/categories";
import Link from "next/link";
import { CATEGORY_ICONS, BoxIcon, LockIcon, CheckIcon } from "@/app/components/Icon";
import BuyButton from "./BuyButton";
import Comments from "./Comments";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "status-ok",
  SOLD: "status-sold",
  INACTIVE: "status-off",
};

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ purchase?: string }>;
}) {
  const { id } = await params;
  const { purchase } = await searchParams;
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const viewerId = session?.user ? (session.user as { id: string }).id : undefined;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { seller: true },
  });

  if (!listing) notFound();
  const isOwner = viewerId === listing.sellerId;
  if (listing.status !== "ACTIVE" && !isOwner) notFound();

  const meta = CATEGORY_META[listing.category] ?? { label: listing.category, accent: "molten" as const };
  const CatIcon = CATEGORY_ICONS[listing.category] ?? BoxIcon;

  return (
    <main className="listing-detail">
      {purchase === "success" && (
        <div className="purchase-banner purchase-success">
          Payment received — check your email for the Stripe receipt. The seller has been notified.
        </div>
      )}
      {purchase === "cancelled" && (
        <div className="purchase-banner purchase-cancelled">Checkout was cancelled — no charge was made.</div>
      )}

      {listing.imageUrl && (
        <Image
          src={listing.imageUrl}
          alt={`${listing.title} logo`}
          width={72}
          height={72}
          unoptimized
          className="detail-logo"
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div className={`cat-tag accent-${meta.accent}`}><CatIcon className="cat-tag-icon" /> {meta.label}</div>
        {isOwner && <span className={`status-badge ${STATUS_BADGE[listing.status]}`}>{listing.status}</span>}
        {listing.crossPosted && <span className="dim" style={{ fontSize: 11.5 }}>Also listed elsewhere</span>}
      </div>
      <h1>{listing.title}</h1>
      <p className="desc">{listing.description}</p>

      {isLoggedIn ? (
        <div className="buy-box">
          <div>
            <div className="price">{listing.priceCents ? `$${(listing.priceCents / 100).toFixed(2)}` : "Contact Seller"}</div>
            <div className="dim" style={{ fontSize: 12.5, marginTop: 6 }}>
              Seller: {listing.seller.displayName}
              {listing.seller.isVerifiedSeller ? <span className="verified"> <CheckIcon /> verified</span> : ""}
            </div>
          </div>
          {isOwner ? (
            <Link href="/sell/listings" className="btn btn-ghost">Manage This Listing</Link>
          ) : listing.status === "SOLD" ? (
            <p className="dim" style={{ fontSize: 13 }}>This listing has sold.</p>
          ) : listing.priceCents ? (
            <BuyButton listingId={listing.id} />
          ) : (
            <p className="dim" style={{ fontSize: 13 }}>Contact the seller directly to negotiate a price.</p>
          )}
        </div>
      ) : (
        <div className="buy-box">
          <div className="gate-note"><LockIcon /> Log in to see price and seller</div>
        </div>
      )}

      <Comments listingId={listing.id} authenticated={isLoggedIn} />
    </main>
  );
}

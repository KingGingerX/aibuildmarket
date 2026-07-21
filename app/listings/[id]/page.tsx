import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/categories";
import { CATEGORY_ICONS, BoxIcon, LockIcon, CheckIcon } from "@/app/components/Icon";
import BuyButton from "./BuyButton";
import Comments from "./Comments";

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

  if (!listing || !listing.active) notFound();

  const meta = CATEGORY_META[listing.category] ?? { label: listing.category, accent: "molten" as const };
  const CatIcon = CATEGORY_ICONS[listing.category] ?? BoxIcon;
  const isOwner = viewerId === listing.sellerId;

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
      <div className={`cat-tag accent-${meta.accent}`}><CatIcon className="cat-tag-icon" /> {meta.label}</div>
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
            <p className="dim" style={{ fontSize: 13 }}>This is your listing.</p>
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

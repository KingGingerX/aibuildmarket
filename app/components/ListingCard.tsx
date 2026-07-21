import Link from "next/link";
import Image from "next/image";
import { CATEGORY_META } from "@/lib/categories";
import { CATEGORY_ICONS, BoxIcon, LockIcon, CheckIcon } from "./Icon";

export type ListingCardData = {
  id: string;
  title: string;
  description: string;
  category: string;
  priceCents?: number | null;
  imageUrl?: string | null;
  seller?: { displayName: string; isVerifiedSeller: boolean } | null;
};

export default function ListingCard({ listing, authenticated }: { listing: ListingCardData; authenticated: boolean }) {
  const meta = CATEGORY_META[listing.category] ?? { label: listing.category, accent: "molten" as const };
  const CatIcon = CATEGORY_ICONS[listing.category] ?? BoxIcon;

  return (
    <Link href={`/listings/${listing.id}`} className="card">
      <div className="card-media">
        <span className="card-cat-tag">{meta.label}</span>
        {listing.imageUrl ? (
          <Image src={listing.imageUrl} alt={`${listing.title} logo`} width={120} height={120} unoptimized />
        ) : (
          <span className={`card-media-icon accent-${meta.accent}`}><CatIcon /></span>
        )}
      </div>
      <div className="card-body">
        <h4 className="card-title">{listing.title}</h4>
        <p className="card-desc">{listing.description.slice(0, 130)}{listing.description.length > 130 ? "…" : ""}</p>

        {authenticated && listing.seller ? (
          <div className="card-seller">
            <div className="seller-dot" />
            <span>{listing.seller.displayName}</span>
            {listing.seller.isVerifiedSeller && <span className="verified"><CheckIcon /> verified</span>}
          </div>
        ) : (
          <div className="gate-note"><LockIcon /> Log in to see seller</div>
        )}

        <div className="card-footer">
          {authenticated ? (
            <div className="price">{listing.priceCents ? `$${(listing.priceCents / 100).toFixed(2)}` : "Contact Seller"}</div>
          ) : (
            <div className="gate-note"><LockIcon /> Log in to see price</div>
          )}
          <span className="btn btn-primary buy-btn">{authenticated ? "View" : "Log In"}</span>
        </div>
      </div>
    </Link>
  );
}

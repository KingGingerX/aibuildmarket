"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Listing = {
  id: string;
  title: string;
  category: string;
  priceCents: number | null;
  active: boolean;
};

export default function ListingRow({ listing }: { listing: Listing }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggleActive() {
    setBusy(true);
    try {
      await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !listing.active }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stat-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <b>{listing.title}</b>{" "}
        <span className="dim">
          ({listing.category}) — {listing.priceCents ? `$${(listing.priceCents / 100).toFixed(2)}` : "Contact"}
        </span>
        {!listing.active && <span className="dim" style={{ marginLeft: 8 }}>(inactive)</span>}
      </div>
      <button className="btn btn-ghost" disabled={busy} onClick={toggleActive}>
        {listing.active ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
}

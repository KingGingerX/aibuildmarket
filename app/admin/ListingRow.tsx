"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Listing = {
  id: string;
  title: string;
  category: string;
  priceCents: number | null;
  status: "ACTIVE" | "SOLD" | "INACTIVE";
};

export default function ListingRow({ listing }: { listing: Listing }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function setStatus(status: "ACTIVE" | "INACTIVE") {
    setBusy(true);
    try {
      await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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
        {listing.status !== "ACTIVE" && <span className="dim" style={{ marginLeft: 8 }}>({listing.status.toLowerCase()})</span>}
      </div>
      {listing.status === "SOLD" ? (
        <span className="dim" style={{ fontSize: 12.5 }}>Sold — moderation N/A</span>
      ) : (
        <button className="btn btn-ghost" disabled={busy} onClick={() => setStatus(listing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}>
          {listing.status === "ACTIVE" ? "Deactivate" : "Activate"}
        </button>
      )}
    </div>
  );
}

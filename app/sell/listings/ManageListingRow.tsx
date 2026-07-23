"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Status = "ACTIVE" | "SOLD" | "INACTIVE";

type Listing = {
  id: string;
  title: string;
  description: string;
  category: string;
  priceCents: number | null;
  status: Status;
  crossPosted: boolean;
  boosted: boolean;
  boostedUntil: string | null;
};

const STATUS_BADGE: Record<Status, string> = {
  ACTIVE: "status-ok",
  SOLD: "status-sold",
  INACTIVE: "status-off",
};

export default function ManageListingRow({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [hasPrice, setHasPrice] = useState(listing.priceCents !== null);
  const [price, setPrice] = useState(listing.priceCents ? (listing.priceCents / 100).toFixed(2) : "");

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] || data.error || "Update failed.");
      router.refresh();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    const priceCents = hasPrice ? Math.round(parseFloat(price) * 100) : null;
    if (hasPrice && (!price || Number.isNaN(priceCents) || (priceCents as number) <= 0)) {
      setError("Enter a valid price, or switch to Contact Seller.");
      return;
    }
    const ok = await patch({ title, description, priceCents });
    if (ok) setEditing(false);
  }

  async function toggleCrossPosted() {
    await patch({ crossPosted: !listing.crossPosted });
  }

  async function setStatus(status: Status) {
    await patch({ status });
  }

  async function deleteListing() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  async function boost() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/listings/${listing.id}/boost`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't start boost checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="stat-card">
        <form onSubmit={saveEdit} className="stack">
          <div className="field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={140} required />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} minLength={10} maxLength={4000} required />
          </div>
          <div className="field">
            <label>Pricing</label>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, textTransform: "none" }}>
                <input type="radio" checked={hasPrice} onChange={() => setHasPrice(true)} /> Fixed price
              </label>
              <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, textTransform: "none" }}>
                <input type="radio" checked={!hasPrice} onChange={() => setHasPrice(false)} /> Contact seller
              </label>
            </div>
          </div>
          {hasPrice && (
            <div className="field">
              <label>Price (USD)</label>
              <input type="number" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="149.00" />
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save Changes"}</button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setEditing(false); setError(""); }}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Link href={`/listings/${listing.id}`} style={{ fontWeight: 600 }}>{listing.title}</Link>
            <span className={`status-badge ${STATUS_BADGE[listing.status]}`} style={{ fontSize: 10.5, padding: "3px 8px" }}>{listing.status}</span>
            {listing.boosted && <span className="status-badge status-boost" style={{ fontSize: 10.5, padding: "3px 8px" }}>Boosted</span>}
          </div>
          <div className="dim" style={{ fontSize: 12.5, marginTop: 4 }}>
            {listing.category} — {listing.priceCents ? `$${(listing.priceCents / 100).toFixed(2)}` : "Contact Seller"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" disabled={busy} onClick={() => setEditing(true)}>Edit</button>
          {listing.status !== "SOLD" && (
            <button className="btn btn-ghost" disabled={busy} onClick={() => setStatus("SOLD")}>Mark Sold</button>
          )}
          {listing.status !== "SOLD" && (
            <button className="btn btn-ghost" disabled={busy} onClick={() => setStatus(listing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}>
              {listing.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </button>
          )}
          {listing.status === "ACTIVE" && !listing.boosted && (
            <button className="btn btn-ghost" disabled={busy} onClick={boost}>Boost — $9</button>
          )}
          <button
            className="btn btn-ghost"
            disabled={busy}
            onClick={deleteListing}
            style={confirmDelete ? { borderColor: "var(--danger)", color: "var(--danger)" } : undefined}
          >
            {confirmDelete ? "Confirm Delete?" : "Delete"}
          </button>
        </div>
      </div>

      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, marginTop: 12, textTransform: "none", color: "var(--text-dim)" }}>
        <input type="checkbox" checked={listing.crossPosted} disabled={busy} onChange={toggleCrossPosted} />
        Also listed on other marketplaces (shown to buyers)
      </label>

      {error && <div className="form-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}

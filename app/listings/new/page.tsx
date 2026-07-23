"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/categories";

export default function NewListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORY_ORDER[0]);
  const [hasPrice, setHasPrice] = useState(true);
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const priceCents = hasPrice ? Math.round(parseFloat(price) * 100) : null;
    if (hasPrice && (!price || Number.isNaN(priceCents) || (priceCents as number) <= 0)) {
      setError("Enter a valid price, or switch to Contact Seller.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, priceCents }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error?.formErrors?.[0] || data.error || "Couldn't create listing.");
      return;
    }
    router.push(`/listings/${data.listing.id}`);
  }

  return (
    <main className="page-shell" style={{ maxWidth: 640 }}>
      <h1>List a Build</h1>
      <p className="dim">Free to list. AI Build Market takes a 5% fee only when it sells. You'll need a connected Stripe payout account before a buyer can complete checkout — set that up from <a href="/sell/payouts" style={{ color: "var(--molten)" }}>Payouts</a>.</p>

      <form onSubmit={handleSubmit} className="stack" style={{ marginTop: 24 }}>
        <div className="field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={140} required />
        </div>

        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>{CATEGORY_META[c].label}</option>
            ))}
          </select>
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
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Publishing…" : "Publish Listing"}
        </button>
      </form>
    </main>
  );
}

"use client";
import { useState } from "react";

export default function BuyButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn btn-primary btn-lg" onClick={buy} disabled={loading}>
        {loading ? "Redirecting to checkout…" : "Buy Now"}
      </button>
      {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}

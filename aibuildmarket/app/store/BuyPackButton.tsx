"use client";
import { useState } from "react";

export default function BuyPackButton({
  packId,
  priceCents,
  owned,
  isLoggedIn,
}: {
  packId: string;
  priceCents: number;
  owned: boolean;
  isLoggedIn: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (owned) {
    return <div className="btn btn-ghost" style={{ pointerEvents: "none" }}>✓ Owned</div>;
  }

  if (!isLoggedIn) {
    return <a href="/login" className="btn btn-primary">Log in to buy — ${(priceCents / 100).toFixed(2)}</a>;
  }

  async function buy() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/cosmetics/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="btn btn-primary" disabled={busy} onClick={buy}>
        {busy ? "Redirecting…" : `Buy — $${(priceCents / 100).toFixed(2)}`}
      </button>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

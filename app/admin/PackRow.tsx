"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Pack = {
  id: string;
  type: "FONT" | "EMOJI";
  name: string;
  description: string;
  priceCents: number;
  active: boolean;
};

export default function PackRow({ pack }: { pack: Pack }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function toggleActive() {
    setBusy(true);
    try {
      await fetch(`/api/admin/cosmetics/${pack.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !pack.active }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stat-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <b>{pack.name}</b> <span className="dim">({pack.type}) — ${(pack.priceCents / 100).toFixed(2)}</span>
        <div className="dim" style={{ fontSize: 13 }}>{pack.description}</div>
      </div>
      <button className="btn btn-ghost" disabled={busy} onClick={toggleActive}>
        {pack.active ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
}

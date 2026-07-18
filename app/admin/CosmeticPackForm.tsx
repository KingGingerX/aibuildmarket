"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CosmeticPackForm() {
  const [type, setType] = useState<"FONT" | "EMOJI">("FONT");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [payload, setPayload] = useState("");
  const [priceCents, setPriceCents] = useState("299");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/cosmetics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          slug,
          name,
          description,
          payload,
          priceCents: Number(priceCents),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] || JSON.stringify(data.error) || "Failed to create pack.");
      setSlug("");
      setName("");
      setDescription("");
      setPayload("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="stack" style={{ maxWidth: 480 }}>
      <div className="field">
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value as "FONT" | "EMOJI")}>
          <option value="FONT">Font Pack</option>
          <option value="EMOJI">Emoji Pack</option>
        </select>
      </div>
      <div className="field">
        <label>Slug (url-safe id)</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="space-mono" required />
      </div>
      <div className="field">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Space Mono" required />
      </div>
      <div className="field">
        <label>Description</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Monospace, technical" required />
      </div>
      <div className="field">
        <label>{type === "FONT" ? "CSS font-family value" : "Emoji list (comma separated)"}</label>
        <input
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder={type === "FONT" ? "'Space Mono', monospace" : "🔥,⚡,🚀,💎"}
          required
        />
      </div>
      <div className="field">
        <label>Price (cents)</label>
        <input type="number" min={0} value={priceCents} onChange={(e) => setPriceCents(e.target.value)} required />
      </div>
      {error && <div className="form-error">{error}</div>}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "Creating…" : "Create Pack"}
      </button>
    </form>
  );
}

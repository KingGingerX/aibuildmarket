"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({ displayName }: { displayName: string }) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] || "Couldn't update name.");
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <div className="field">
        <label>Display Name</label>
        <input value={name} onChange={(e) => { setName(e.target.value); setSuccess(false); }} minLength={2} maxLength={40} required />
      </div>
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">Saved.</div>}
      <button type="submit" className="btn btn-primary" disabled={submitting || name === displayName}>
        {submitting ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

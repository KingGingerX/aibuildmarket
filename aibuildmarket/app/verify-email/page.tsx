"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"checking" | "ok" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token in the link. Copy the full link from your email.");
      return;
    }
    fetch(`/api/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Verification failed.");
        setStatus("ok");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [token]);

  return (
    <div className="auth-card">
      <h2>Email Verification</h2>
      {status === "checking" && <p className="dim">Verifying your link…</p>}
      {status === "ok" && (
        <>
          <p style={{ color: "var(--teal)" }}>Email verified. You can now list a build.</p>
          <Link href="/listings/new" className="btn btn-primary" style={{ display: "inline-block", marginTop: 16 }}>
            List Your First Build
          </Link>
        </>
      )}
      {status === "error" && <p style={{ color: "var(--danger)" }}>{message}</p>}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="auth-shell">
      <Suspense fallback={<div className="auth-card"><p className="dim">Loading…</p></div>}>
        <VerifyEmailInner />
      </Suspense>
    </main>
  );
}

"use client";
import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ emailSent: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error?.formErrors?.[0] || data.error?.fieldErrors?.password?.[0] || data.error || "Signup failed.");
      return;
    }
    setDone({ emailSent: data.emailSent, message: data.message });
  }

  if (done) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <h2>Account Created</h2>
          <p className={done.emailSent ? "form-success" : "dim"}>{done.message}</p>
          <a href="/login" className="btn btn-primary" style={{ display: "inline-block", marginTop: 16 }}>
            Go to Log In
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h2>Create Account</h2>
        <form onSubmit={handleSubmit} className="stack">
          <div className="field">
            <label>Display Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password (min 8 chars)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn btn-primary">Create Account</button>
        </form>
        <p className="help-text">
          You'll need to verify your email before you can list a build for sale.
        </p>
      </div>
    </main>
  );
}

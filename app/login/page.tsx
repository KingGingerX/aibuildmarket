"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h2>Log In</h2>
        <form onSubmit={handleSubmit} className="stack">
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <a href="/forgot-password" style={{ color: "var(--molten)", fontSize: 12.5, alignSelf: "flex-end" }}>Forgot password?</a>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn btn-primary">Log In</button>
        </form>
        <p className="help-text">
          No account? <a href="/signup" style={{ color: "var(--molten)" }}>Sign up</a>
        </p>
      </div>
    </main>
  );
}

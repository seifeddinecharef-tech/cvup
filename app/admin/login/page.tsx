"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Login failed.");

      const next = searchParams.get("next");
      window.location.href = next && next.startsWith("/admin") ? next : "/admin";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <span className="brand-logo-circle brand-logo-circle--compact">
            <Image src="/brand/cvup-logo.png" alt="CVUp" width={42} height={42} className="brand-logo" priority />
          </span>
          <div>
            <strong>CVUp</strong>
            <span>Admin workspace</span>
          </div>
        </div>

        <div className="admin-login-copy">
          <p className="admin-eyebrow">Secure access</p>
          <h1>Sign in to CVUp Admin</h1>
          <p>Use your private administrator credentials to access client dossiers and payment controls.</p>
        </div>

        <form onSubmit={submit} className="admin-login-form">
          <label>
            Email
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {message ? <p className="admin-login-error">{message}</p> : null}

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

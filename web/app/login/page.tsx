"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest, saveToken } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await apiRequest<{ access_token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ phone, code }) });
      saveToken(res.access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Sign in</h1>
      <p className="muted">Demo mode: use any Indian number and the code 000000.</p>
      <form onSubmit={submit}>
        <label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" /></label>
        <label>Code<input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} /></label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}

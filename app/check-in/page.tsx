"use client";

import { FormEvent, useEffect, useState } from "react";

type CheckResult = {
  status: "ready" | "valid" | "used" | "invalid";
  ticket?: {
    public_number?: string;
    buyer_name?: string;
    kind?: string;
    admission_type?: "adult" | "kids";
    checked_in_at?: string | null;
  };
};

export default function CheckInPage() {
  const [ticket, setTicket] = useState("");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    const timer = window.setTimeout(() => {
      if (token) setTicket(token);
      fetch("/api/status", { cache: "no-store" }).then(response => setAuthenticated(response.ok));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/status/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (response.ok) setAuthenticated(true);
    else setError("Incorrect shared password.");
  };

  const lookup = async (confirm: boolean) => {
    setError("");
    const response = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket, confirm }),
    });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    const data = (await response.json()) as CheckResult & { error?: string };
    if (!response.ok) setError(data.error ?? "Ticket lookup failed.");
    else setResult(data);
  };

  if (authenticated === null) return <main className="admin-shell"><p>Loading check-in…</p></main>;
  if (!authenticated) {
    return (
      <main className="admin-shell">
        <form className="admin-login" onSubmit={login}>
          <p className="eyebrow">Staff access</p><h1>Ticket check-in</h1>
          <label>Shared password<input type="password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button--primary" type="submit">Continue</button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <section className="checkin-card">
        <p className="eyebrow">Rhythms of Hope</p><h1>Ticket check-in</h1>
        <label>Scan QR or enter ticket number<input value={ticket} onChange={event => { setTicket(event.target.value); setResult(null); }} placeholder="ROH-000001" /></label>
        <button className="button button--ghost" onClick={() => void lookup(false)} disabled={!ticket}>Validate ticket</button>
        {result && (
          <div className={`check-result check-result--${result.status}`}>
            <strong>{result.status === "ready" ? "Valid ticket" : result.status === "valid" ? "Checked in" : result.status === "used" ? "Already used" : "Invalid ticket"}</strong>
            {result.ticket && <p>{result.ticket.public_number}<br />{result.ticket.buyer_name}<br />{result.ticket.admission_type === "kids" ? "Kids admission · 15 and under" : "Adult admission · 16+"}</p>}
            {result.status === "ready" && <button className="button button--primary" onClick={() => void lookup(true)}>Admit guest</button>}
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
      </section>
    </main>
  );
}

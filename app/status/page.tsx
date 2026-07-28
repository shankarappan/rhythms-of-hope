"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Availability = {
  capacity: number;
  paidSold: number;
  complimentaryIssued: number;
  totalIssued: number;
  remaining: number;
  complimentaryAvailable: number;
  lastPurchaseAt: string | null;
};

export default function StatusPage() {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/status", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as { availability: Availability };
      setAvailability(data.availability);
    } else {
      setAvailability(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(refresh, 15000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/status/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError("That password was not accepted.");
      return;
    }
    setPassword("");
    await refresh();
  };

  if (loading) return <main className="admin-shell"><p>Loading ticket status…</p></main>;
  if (!availability) {
    return (
      <main className="admin-shell">
        <form className="admin-login" onSubmit={login}>
          <p className="eyebrow">Private event dashboard</p>
          <h1>Ticket status</h1>
          <p>Enter the shared Moksha Base password to continue.</p>
          <label>
            Shared password
            <input type="password" value={password} onChange={event => setPassword(event.target.value)} required />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button--primary" type="submit">View status</button>
        </form>
      </main>
    );
  }
  const percentage = Math.round((availability.totalIssued / availability.capacity) * 100);
  return (
    <main className="admin-shell">
      <section className="status-dashboard">
        <div className="status-dashboard__heading">
          <div>
            <p className="eyebrow">Rhythms of Hope</p>
            <h1>Ticket status</h1>
          </div>
          <a href="/check-in">Open check-in</a>
        </div>
        <div className="status-progress" aria-label={`${percentage}% of capacity allocated`}>
          <span style={{ width: `${percentage}%` }} />
        </div>
        <p className="status-percentage">{percentage}% allocated · updates every 15 seconds</p>
        <div className="status-grid">
          <article><span>Paid</span><strong>{availability.paidSold}</strong><small>of 300</small></article>
          <article><span>Complimentary</span><strong>{availability.complimentaryIssued}</strong><small>of 50</small></article>
          <article><span>Total issued</span><strong>{availability.totalIssued}</strong><small>of 350</small></article>
          <article><span>Remaining</span><strong>{availability.remaining}</strong><small>admissions</small></article>
        </div>
        <p className="status-last">
          {availability.lastPurchaseAt
            ? `Latest allocation: ${new Date(availability.lastPurchaseAt).toLocaleString("en-NZ")}`
            : "No tickets have been issued yet."}
        </p>
      </section>
    </main>
  );
}

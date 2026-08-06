"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Result = {
  pending: boolean;
  order?: {
    quantity: number;
    kind: "paid" | "complimentary";
    amountTotal: number;
    emailStatus: string;
    tickets: { number: string }[];
  };
};

export default function TicketSuccessPage() {
  const [result, setResult] = useState<Result>({ pending: true });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      const timer = window.setTimeout(() => setFailed(true), 0);
      return () => window.clearTimeout(timer);
    }
    let attempts = 0;
    const load = async () => {
      attempts += 1;
      const response = await fetch(`/api/tickets/order/${encodeURIComponent(sessionId)}`, { cache: "no-store" });
      if (response.ok) {
        setResult((await response.json()) as Result);
        return;
      }
      if (response.status === 202 && attempts < 12) {
        window.setTimeout(load, 2000);
        return;
      }
      setFailed(true);
    };
    void load();
  }, []);

  return (
    <main className="utility-page">
      <section className="utility-card utility-card--success">
        <p className="eyebrow">Booking acknowledgement</p>
        {failed ? (
          <>
            <h1>Payment received</h1>
            <p>Your booking is still being confirmed. Please check your email shortly or contact info@mokshabase.com if it does not arrive.</p>
          </>
        ) : result.pending ? (
          <>
            <h1>Preparing your tickets…</h1>
            <p>We are securely allocating your ticket numbers and sending your confirmation email.</p>
          </>
        ) : (
          <>
            <h1>You’re coming to Rhythms of Hope.</h1>
            <p>
              {result.order?.quantity} {result.order?.kind === "complimentary" ? "complimentary " : ""}
              {result.order?.quantity === 1 ? "ticket has" : "tickets have"} been issued.
            </p>
            <div className="confirmation-numbers">
              {result.order?.tickets.map(ticket => <strong key={ticket.number}>{ticket.number}</strong>)}
            </div>
            <p>Your receipt and QR-coded PDF tickets are being sent to the email address used at checkout.</p>
          </>
        )}
        <Link className="button button--primary" href="/">Return to the event website</Link>
      </section>
    </main>
  );
}

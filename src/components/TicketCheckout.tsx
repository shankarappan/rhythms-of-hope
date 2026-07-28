"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { SectionHeading } from "./SectionHeading";

type Availability = {
  remaining: number;
  paidAvailable: number;
  complimentaryAvailable: number;
  salesOpen: boolean;
};

export function TicketCheckout() {
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const subtotal = quantity * 20;
  const fee = quantity * 2;
  const total = subtotal + fee;

  useEffect(() => {
    fetch("/api/tickets/availability", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => setAvailability(data as Availability | null))
      .catch(() => setAvailability(null));
  }, []);

  const availabilityText = useMemo(() => {
    if (!availability) return "Live availability will be confirmed at checkout.";
    if (availability.remaining === 0) return "Sold out";
    return `${availability.remaining} of 350 admissions currently remain`;
  }, [availability]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/tickets/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, coupon }),
      });
      const result = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error ?? "Checkout could not be started.");
      window.location.assign(result.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.");
      setSubmitting(false);
    }
  };

  const salesOpen = availability?.salesOpen ?? false;
  const soldOut = availability?.remaining === 0;

  return (
    <section className="tickets section" id="tickets">
      <div className="tickets__intro" data-reveal>
        <SectionHeading
          eyebrow="General admission"
          title="Join us for an evening of hope."
          body="Book without creating an account. Your name and email are collected securely at Stripe Checkout, then your numbered QR tickets and receipt are sent by Moksha Base."
        />
        <div className="ticket-event-line">
          <p><strong>Saturday, 17 October 2026</strong><span>Doors 4:00 pm · Show 5:00 pm</span></p>
          <p><strong>Te Whare Maui Event Centre</strong><span>Hamilton</span></p>
        </div>
      </div>
      <form className="ticket-checkout" onSubmit={submit} data-reveal>
        <div className="ticket-checkout__heading">
          <div><span>General admission</span><strong>NZ$22</strong><small>NZ$20 ticket + NZ$2 booking/processing fee</small></div>
          <p>{availabilityText}</p>
        </div>
        <label className="ticket-field">
          <span>Number of tickets</span>
          <select value={quantity} onChange={event => setQuantity(Number(event.target.value))}>
            {Array.from({ length: 10 }, (_, index) => index + 1).map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="ticket-field">
          <span>Complimentary code <small>optional</small></span>
          <input
            value={coupon}
            onChange={event => setCoupon(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="Enter code"
          />
        </label>
        {coupon && <p className="ticket-code-note">Your code will be validated securely when you continue.</p>}
        <div className="ticket-summary">
          <div><span>Tickets × {quantity}</span><strong>NZ${subtotal.toFixed(2)}</strong></div>
          <div><span>Booking/processing fee × {quantity}</span><strong>NZ${fee.toFixed(2)}</strong></div>
          <div className="ticket-summary__total"><span>Total before any valid discount</span><strong>NZ${total.toFixed(2)}</strong></div>
          <small>No GST charged</small>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button
          className="button button--ticket"
          type="submit"
          disabled={submitting || !salesOpen || soldOut}
        >
          {soldOut ? "Sold out" : !salesOpen ? "Tickets opening soon" : submitting ? "Opening checkout…" : "Continue to secure checkout"}
          <span aria-hidden="true">↗</span>
        </button>
        <p className="ticket-checkout__note">Maximum 10 tickets per order. Your reservation is held for 30 minutes while you complete checkout.</p>
      </form>
    </section>
  );
}

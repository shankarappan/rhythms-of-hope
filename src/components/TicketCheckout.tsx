"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ADULT_TICKET_PRICE_CENTS,
  BOOKING_FEE_CENTS,
  EVENT_ADDRESS,
  EVENT_DATE,
  EVENT_DOORS_TIME,
  EVENT_SHOW_TIME,
  EVENT_VENUE,
  KIDS_TICKET_PRICE_CENTS,
  MAX_PER_ORDER,
} from "../../lib/event-config";
import { SectionHeading } from "./SectionHeading";
import { SponsorShowcase } from "./SponsorShowcase";

type Availability = {
  salesOpen: boolean;
  soldOut: boolean;
};

export function TicketCheckout() {
  const [adultQuantity, setAdultQuantity] = useState(1);
  const [kidsQuantity, setKidsQuantity] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const totalTickets = adultQuantity + kidsQuantity;
  const adultSubtotal = adultQuantity * ADULT_TICKET_PRICE_CENTS;
  const kidsSubtotal = kidsQuantity * KIDS_TICKET_PRICE_CENTS;
  const fee = totalTickets * BOOKING_FEE_CENTS;
  const total = adultSubtotal + kidsSubtotal + fee;

  useEffect(() => {
    fetch("/api/tickets/availability", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => setAvailability(data as Availability | null))
      .catch(() => setAvailability(null));
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/tickets/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adultQuantity, kidsQuantity, coupon }),
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
  const soldOut = availability?.soldOut ?? false;

  return (
    <section className="tickets section" id="tickets">
      <div className="tickets__intro" data-reveal>
        <SectionHeading
          eyebrow="Admission options"
          title="Join us for an evening of hope."
          body="Choose Adult tickets or Kids tickets for guests aged 15 and under. Your details are collected securely at Stripe Checkout, then your numbered QR tickets and receipt are sent by Moksha Base."
        />
      </div>
      <form className="ticket-checkout" onSubmit={submit} data-reveal>
        <div className="ticket-checkout__heading">
          <div><span>Adult · 16+</span><strong>NZ$25</strong><small>NZ$23 ticket + NZ$2 processing fee</small></div>
          <div><span>Kids · 15 and under</span><strong>NZ$15</strong><small>NZ$13 ticket + NZ$2 processing fee</small></div>
        </div>
        <div className="ticket-quantity-grid">
          <label className="ticket-field">
            <span>Adult tickets <small>16+</small></span>
            <select value={adultQuantity} onChange={event => setAdultQuantity(Number(event.target.value))}>
              {Array.from({ length: MAX_PER_ORDER - kidsQuantity + 1 }, (_, index) => index).map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="ticket-field">
            <span>Kids tickets <small>15 years or younger</small></span>
            <select value={kidsQuantity} onChange={event => setKidsQuantity(Number(event.target.value))}>
              {Array.from({ length: MAX_PER_ORDER - adultQuantity + 1 }, (_, index) => index).map(value => (
              <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
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
          {adultQuantity > 0 && <div><span>Adult admission × {adultQuantity}</span><strong>NZ${(adultSubtotal / 100).toFixed(2)}</strong></div>}
          {kidsQuantity > 0 && <div><span>Kids admission × {kidsQuantity}</span><strong>NZ${(kidsSubtotal / 100).toFixed(2)}</strong></div>}
          <div><span>Processing fee × {totalTickets}</span><strong>NZ${(fee / 100).toFixed(2)}</strong></div>
          <div className="ticket-summary__total"><span>Total before any valid discount</span><strong>NZ${(total / 100).toFixed(2)}</strong></div>
          <small>No GST charged</small>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button
          className="button button--ticket"
          type="submit"
          disabled={submitting || !salesOpen || soldOut || totalTickets < 1 || totalTickets > MAX_PER_ORDER}
        >
          {soldOut ? "Sold out" : !salesOpen ? "Tickets opening soon" : submitting ? "Opening checkout…" : "Continue to secure checkout"}
          <span aria-hidden="true">↗</span>
        </button>
        <p className="ticket-checkout__note">Maximum 10 tickets total per order. Kids tickets are for guests aged 15 or younger. Your reservation is held for 30 minutes while you complete checkout.</p>
      </form>
      <SponsorShowcase />
      <div className="ticket-event-line" data-reveal>
        <p><strong>{EVENT_DATE}</strong><span>Doors {EVENT_DOORS_TIME} · Show {EVENT_SHOW_TIME}</span></p>
        <p><strong>{EVENT_VENUE}</strong><span>{EVENT_ADDRESS}</span></p>
      </div>
    </section>
  );
}

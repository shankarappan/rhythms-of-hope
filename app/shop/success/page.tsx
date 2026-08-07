"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { MerchCartItem } from "@/lib/merch";

type Result = { pending: boolean; order?: { id: string; amountTotal: number; status: string; items: MerchCartItem[] } };
export default function ShopSuccessPage() {
  const [result, setResult] = useState<Result>({ pending: true });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) { const timer = window.setTimeout(() => setFailed(true), 0); return () => window.clearTimeout(timer); }
    void fetch(`/api/merch/order/${encodeURIComponent(sessionId)}`, { cache: "no-store" }).then(async response => {
      if (!response.ok) return setFailed(true);
      setResult(await response.json() as Result);
    }).catch(() => setFailed(true));
  }, []);
  return <main className="utility-page"><section className="utility-card utility-card--success"><p className="eyebrow">Venue pickup order</p>{failed ? <><h1>Payment received</h1><p>Your order is still being confirmed. Please check your email shortly or contact info@mokshabase.com.</p></> : result.pending ? <><h1>Preparing your order…</h1><p>We are recording your selections and sending your confirmation.</p></> : <><h1>Thank you for carrying HOPE.</h1><p>Your T-shirt order is confirmed for pickup at the event venue.</p><div className="merch-confirmation">{result.order?.items.map(item => <p key={`${item.colour}-${item.size}`}><span>{item.colour} · size {item.size}</span><strong>× {item.quantity}</strong></p>)}</div><p>We sent the order details to your checkout email and a copy to Moksha Base.</p></>}<Link className="button button--primary" href="/#shop">Return to the shop</Link></section></main>;
}

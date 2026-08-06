"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { MerchOrder, MerchOrderStatus } from "@/lib/merch-store";
import { merchItemName } from "@/lib/merch";

const statuses: MerchOrderStatus[] = ["new", "ready", "collected", "cancelled"];
export default function OrdersPage() {
  const [orders, setOrders] = useState<MerchOrder[] | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | MerchOrderStatus>("all");
  const refresh = useCallback(async () => {
    const response = await fetch("/api/orders", { cache: "no-store" });
    setOrders(response.ok ? ((await response.json()) as { orders: MerchOrder[] }).orders : null);
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  const login = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    const response = await fetch("/api/orders/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) return setError("That password was not accepted.");
    setPassword(""); await refresh();
  };
  const update = async (id: string, status: MerchOrderStatus) => {
    const response = await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (response.ok) await refresh();
  };
  const visible = useMemo(() => (orders ?? []).filter(order => filter === "all" || order.status === filter), [orders, filter]);
  if (orders === null) return <main className="admin-shell"><form className="admin-login" onSubmit={login}><p className="eyebrow">Private merchandise dashboard</p><h1>HOPE orders</h1><p>Enter the Moksha Base merchandise password to continue.</p><label>Shared password<input type="password" value={password} onChange={event => setPassword(event.target.value)} required /></label>{error && <p className="form-error">{error}</p>}<button className="button button--primary">View orders</button></form></main>;
  return <main className="orders-shell"><section className="orders-dashboard">
    <header><div><p className="eyebrow">Rhythms of Hope merchandise</p><h1>Pickup orders</h1><p>{orders.length} paid order{orders.length === 1 ? "" : "s"} · customer details are shown only for fulfilment.</p></div><button className="button button--ghost" onClick={() => refresh()}>Refresh</button></header>
    <div className="order-filters"><button className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>All <strong>{orders.length}</strong></button>{statuses.map(status => <button key={status} className={filter === status ? "is-active" : ""} onClick={() => setFilter(status)}>{status} <strong>{orders.filter(order => order.status === status).length}</strong></button>)}</div>
    <div className="order-list">{visible.length ? visible.map(order => <article className="order-card" key={order.id}>
      <div className="order-card__top"><div><span className={`order-status order-status--${order.status}`}>{order.status}</span><h2>{order.buyerName}</h2><p><a href={`mailto:${order.buyerEmail}`}>{order.buyerEmail}</a>{order.buyerPhone && <> · <a href={`tel:${order.buyerPhone}`}>{order.buyerPhone}</a></>}</p></div><div><strong>NZ${(order.amountTotal / 100).toFixed(2)}</strong><small>{new Date(order.createdAt).toLocaleString("en-NZ")}</small></div></div>
      <ul>{order.items.map(item => <li key={`${item.audience}-${item.colour}-${item.size}`}><span>{merchItemName(item)}</span><strong>× {item.quantity}</strong></li>)}</ul>
      <footer><small>#{order.id}</small><label>Fulfilment status<select value={order.status} onChange={event => void update(order.id, event.target.value as MerchOrderStatus)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label></footer>
    </article>) : <p className="orders-empty">No orders match this filter.</p>}</div>
  </section></main>;
}

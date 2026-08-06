"use client";

import { useMemo, useState } from "react";
import { MERCH_MAX_ITEMS, MERCH_PICKUP, MERCH_PRICE_CENTS, merchSizes, type MerchCartItem, type MerchColour, type MerchSize } from "../../lib/merch";

const gallery = {
  black: ["/merch/black-flat.jpg", "/merch/black-adult-man.jpg", "/merch/black-adult-woman.jpg", "/merch/black-kids.jpg"],
  white: ["/merch/white-adults.jpg", "/merch/white-kids.jpg"],
};

export function MerchShop() {
  const [colour, setColour] = useState<MerchColour>("black");
  const [size, setSize] = useState<MerchSize>("M");
  const [quantity, setQuantity] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [cart, setCart] = useState<MerchCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const images = gallery[colour];
  const total = useMemo(() => totalItems * MERCH_PRICE_CENTS, [totalItems]);
  const chooseColour = (next: MerchColour) => { setColour(next); setPhoto(0); };
  const add = () => {
    setError("");
    if (totalItems + quantity > MERCH_MAX_ITEMS) return setError(`A maximum of ${MERCH_MAX_ITEMS} shirts can be purchased per order.`);
    setCart(current => {
      const index = current.findIndex(item => item.colour === colour && item.size === size);
      if (index < 0) return [...current, { colour, size, quantity }];
      return current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: item.quantity + quantity } : item);
    });
  };
  const checkout = async () => {
    setLoading(true); setError("");
    const response = await fetch("/api/merch/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart }) });
    const data = await response.json() as { checkoutUrl?: string; error?: string };
    if (!response.ok || !data.checkoutUrl) { setLoading(false); setError(data.error ?? "Checkout could not be started."); return; }
    window.location.assign(data.checkoutUrl);
  };
  return <section className="merch section" id="shop">
    <div className="merch__intro" data-reveal>
      <p className="eyebrow">Wear the message</p><h2>Carry HOPE<br /><span>beyond the stage.</span></h2>
      <p>Choose a black or white HOPE T-shirt in your preferred size. Every purchase helps support the purpose of Rhythms of Hope and the community conversations it brings together.</p>
      <div className="merch__facts"><span>NZ$35 each</span><span>Sizes XS–XL</span><span>Venue pickup</span></div>
    </div>
    <div className="merch-builder" data-reveal>
      <div className={`merch-gallery merch-gallery--${colour}`}>
        <img src={images[Math.min(photo, images.length - 1)]} alt={`${colour} HOPE T-shirt preview`} />
        <div className="merch-thumbs">{images.map((image, index) => <button key={image} className={photo === index ? "is-active" : ""} onClick={() => setPhoto(index)} aria-label={`View product image ${index + 1}`}><img src={image} alt="" /></button>)}</div>
      </div>
      <div className="merch-config">
        <div className="merch-config__heading"><div><p className="eyebrow">HOPE collection</p><h3>Classic T-shirt</h3></div><strong>NZ$35</strong></div>
        <fieldset><legend>Choose a colour</legend><div className="merch-options merch-options--colour"><button className={colour === "black" ? "is-active" : ""} onClick={() => chooseColour("black")}><i className="swatch swatch--black" />Black</button><button className={colour === "white" ? "is-active" : ""} onClick={() => chooseColour("white")}><i className="swatch swatch--white" />White</button></div></fieldset>
        <fieldset><legend>Choose a size</legend><div className="merch-sizes">{merchSizes.map(option => <button className={size === option ? "is-active" : ""} key={option} onClick={() => setSize(option)}>{option}</button>)}</div></fieldset>
        <div className="merch-add"><label>Quantity<select value={quantity} onChange={event => setQuantity(Number(event.target.value))}>{[1,2,3,4,5].map(value => <option key={value}>{value}</option>)}</select></label><button className="button button--primary" onClick={add}>Add to bag <span aria-hidden="true">+</span></button></div>
      </div>
    </div>
    <aside className="merch-cart" aria-live="polite">
      <div><p className="eyebrow">Your order</p><h3>{totalItems ? `${totalItems} shirt${totalItems === 1 ? "" : "s"} in your bag` : "Your bag is ready"}</h3><p>Secure payment through Stripe. Name, email and phone are collected at checkout.</p></div>
      <div className="merch-cart__items">{cart.length ? cart.map((item, index) => <div key={`${item.colour}-${item.size}`}><span>{item.colour} · size {item.size}</span><strong>× {item.quantity}</strong><button aria-label="Remove item" onClick={() => setCart(current => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>) : <p>Select your options above, then add a shirt to begin.</p>}</div>
      <div className="merch-cart__checkout"><p><span>Total</span><strong>NZ${(total / 100).toFixed(2)}</strong></p><button className="button button--ticket" disabled={!cart.length || loading} onClick={checkout}>{loading ? "Opening secure checkout…" : "Continue to secure checkout"} <span aria-hidden="true">↗</span></button><small>Pickup: {MERCH_PICKUP}</small>{error && <p className="form-error">{error}</p>}</div>
    </aside>
  </section>;
}

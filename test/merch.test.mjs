import assert from "node:assert/strict";
import test from "node:test";
import { decodeMerchCart, encodeMerchCart, MERCH_MAX_ITEMS, parseMerchCart } from "../lib/merch.ts";

test("validates and combines duplicate merchandise selections", () => {
  const items = parseMerchCart([
    { audience: "adult", colour: "black", size: "M", quantity: 2 },
    { audience: "adult", colour: "black", size: "M", quantity: 1 },
  ]);
  assert.deepEqual(items, [{ audience: "adult", colour: "black", size: "M", quantity: 3 }]);
});

test("round trips compact Stripe metadata", () => {
  const items = [
    { audience: "kids", colour: "white", size: "XS", quantity: 2 },
    { audience: "adult", colour: "black", size: "XL", quantity: 1 },
  ];
  assert.deepEqual(decodeMerchCart(encodeMerchCart(items)), items);
});

test("rejects invalid variants and oversized bags", () => {
  assert.throws(() => parseMerchCart([{ audience: "adult", colour: "blue", size: "M", quantity: 1 }]));
  assert.throws(() => parseMerchCart([{ audience: "adult", colour: "black", size: "M", quantity: MERCH_MAX_ITEMS + 1 }]));
});

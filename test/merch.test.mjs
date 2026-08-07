import assert from "node:assert/strict";
import test from "node:test";
import { decodeMerchCart, encodeMerchCart, MERCH_MAX_ITEMS, parseMerchCart } from "../lib/merch.ts";

test("validates and combines duplicate merchandise selections", () => {
  const items = parseMerchCart([
    { colour: "black", size: "M", quantity: 2 },
    { colour: "black", size: "M", quantity: 1 },
  ]);
  assert.deepEqual(items, [{ colour: "black", size: "M", quantity: 3 }]);
});

test("round trips compact Stripe metadata", () => {
  const items = [
    { colour: "white", size: "XS", quantity: 2 },
    { colour: "black", size: "XL", quantity: 1 },
  ];
  assert.deepEqual(decodeMerchCart(encodeMerchCart(items)), items);
});

test("rejects invalid variants and oversized bags", () => {
  assert.throws(() => parseMerchCart([{ colour: "blue", size: "M", quantity: 1 }]));
  assert.throws(() => parseMerchCart([{ colour: "black", size: "M", quantity: MERCH_MAX_ITEMS + 1 }]));
});

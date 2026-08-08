import assert from "node:assert/strict";
import test from "node:test";
import {
  ADULT_TICKET_PRICE_CENTS,
  BOOKING_FEE_CENTS,
  KIDS_TICKET_PRICE_CENTS,
  MAX_PER_ORDER,
  admissionLabel,
} from "../lib/event-config.ts";

test("prices adult and kids admission with the same processing fee", () => {
  assert.equal(ADULT_TICKET_PRICE_CENTS + BOOKING_FEE_CENTS, 2500);
  assert.equal(KIDS_TICKET_PRICE_CENTS + BOOKING_FEE_CENTS, 1500);
});

test("labels kids eligibility clearly", () => {
  assert.equal(admissionLabel("adult"), "Adult admission (16+)");
  assert.equal(admissionLabel("kids"), "Kids admission (15 years or younger)");
  assert.equal(MAX_PER_ORDER, 10);
});

export const EVENT_ID = "rhythms-of-hope-2026";
export const EVENT_NAME = "Rhythms of Hope";
export const EVENT_SUBTITLE = "Te Hīkoi o te Tūmanako";
export const EVENT_DATE = "Saturday, 17 October 2026";
export const EVENT_TIME = "Doors open 4:00 pm · Show starts 5:00 pm";
export const EVENT_VENUE = "Te Whare Maui Event Centre, Hamilton";
export const CAPACITY = 350;
export const COMPLIMENTARY_CAPACITY = 50;
export const PAID_CAPACITY = CAPACITY - COMPLIMENTARY_CAPACITY;
export const MAX_PER_ORDER = 10;
export const TICKET_PRICE_CENTS = 2000;
export const BOOKING_FEE_CENTS = 200;
export const RESERVATION_SECONDS = 31 * 60;
export const MOKSHA_DONATION_PAYMENT_LINK_ID = "plink_1Tv3ubFNUoRQzHYGYHan2Dht";

export type TicketKind = "paid" | "complimentary";

export function ticketNumber(id: number) {
  return `ROH-${String(id).padStart(6, "0")}`;
}

import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type RuntimeEnv = {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_COMPLIMENTARY_COUPON_ID?: string;
  COMPLIMENTARY_CODE_HASH?: string;
  RESEND_API_KEY?: string;
  STATUS_PASSWORD?: string;
  ORDERS_PASSWORD?: string;
  SESSION_SIGNING_SECRET?: string;
  TICKETING_ENABLED?: string;
  MERCH_ENABLED?: string;
};

export function getRuntimeEnv(): RuntimeEnv {
  return env as unknown as RuntimeEnv;
}

export function getDb() {
  const runtime = getRuntimeEnv();
  if (!runtime.DB) throw new Error("Cloudflare D1 binding DB is unavailable.");
  return drizzle(runtime.DB, { schema });
}

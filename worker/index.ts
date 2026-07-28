import handler from "vinext/server/app-router-entry";

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_COMPLIMENTARY_COUPON_ID?: string;
  COMPLIMENTARY_CODE_HASH?: string;
  RESEND_API_KEY?: string;
  STATUS_PASSWORD?: string;
  SESSION_SIGNING_SECRET?: string;
  TICKETING_ENABLED?: string;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return handler.fetch(request, env, ctx);
  },
};

# Rhythms of Hope

The public website for **Rhythms of Hope — Te Hīkoi o te Tūmanako**, a proposed community cancer-awareness event, book launch, shared conversation, meal and live music experience from Moksha Base.

## Project principles

- Hopeful, dignified and community-centred storytelling
- Clear separation between confirmed information and planning details
- Accessible, responsive experience across phones, tablets and desktops
- Modular content and feature boundaries for future tickets, donations, merchandise, programme and venue information
- No implied sponsor, partner, beneficiary or fundraising claims without confirmation

## Local development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run lint
```

The `main` branch deploys automatically from GitHub Actions to Cloudflare
Workers. Cloudflare D1 stores reservations, orders, tickets, QR check-ins and
webhook idempotency records.

The GitHub `production` environment requires these encrypted secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_COMPLIMENTARY_COUPON_ID`
- `COMPLIMENTARY_CODE_HASH`
- `RESEND_API_KEY`
- `STATUS_PASSWORD`
- `ORDERS_PASSWORD`
- `SESSION_SIGNING_SECRET`

Ticket sales stay closed while `TICKETING_ENABLED` is `false` in
`wrangler.jsonc`. Only change it after the live payment, webhook, ticket PDF,
email and check-in flow has passed an end-to-end test.

## GoDaddy API administration

GoDaddy access is deliberately kept outside the public Vite application. Never
use a `VITE_*` variable for the token: Vite exposes those values in the browser
bundle.

1. Revoke any token that has been pasted into chat, email, source code or a
   terminal command.
2. Generate a new GoDaddy Personal Access Token with the minimum required
   scopes. The read-only connection check needs `domains.domain:read`.
3. Copy the example file and add the new token locally:

   ```bash
   cp .env.example .env.local
   ```

4. Set `GODADDY_PAT` in `.env.local`, then verify access:

   ```bash
   npm run godaddy:check
   ```

The `.env.local` file is ignored by Git. The reusable client currently exposes
only a read-only domain-list operation; DNS mutation should be added separately
with explicit safeguards when it is required.

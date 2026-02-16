# Payment Setup (Interswitch + Paystack)

## Prerequisites

1. **Create `.env` from `.env.example`** – The Prisma migration requires `DATABASE_URL`. Without it you'll get:
   ```
   PrismaConfigEnvError: Missing required environment variable: DATABASE_URL
   ```
   ```bash
   cp .env.example .env
   # Edit .env and set DATABASE_URL (PostgreSQL connection string)
   ```

2. **Ensure `DATABASE_URL` is set** – Example for local PostgreSQL:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/cng_logistics?schema=public"
   ```

## Environment Variables

Add these to your `.env` file (or copy from `.env.example`):

### Interswitch (TEST mode)
```
INTERSWITCH_MERCHANT_CODE=your_merchant_code
INTERSWITCH_PAY_ITEM_ID=your_pay_item_id
INTERSWITCH_HMAC_SECRET=your_hmac_secret
INTERSWITCH_INIT_URL=https://newwebpay.qa.interswitchng.com/collections/w/pay
INTERSWITCH_VERIFY_URL=https://sandbox.interswitchng.com/api/v3/purchases/verify
INTERSWITCH_SITE_REDIRECT_URL=https://cng-logistics.onrender.com/api/v1/payment/interswitch/callback
INTERSWITCH_CALLBACK_URL=https://cng-logistics.onrender.com/api/v1/payment/interswitch/callback
INTERSWITCH_MODE=TEST
INTERSWITCH_CURRENCY_NUMERIC=566
INTERSWITCH_SIGNATURE_HEADER=x-interswitch-signature
```

### Paystack
```
PAYSTACK_SECRET_KEY=sk_live_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key
```

### Base URLs
```
BASE_URL=https://cng-logistics.onrender.com
FRONTEND_BASE_URL=https://your-frontend-url.com
```

## Seed Payment Methods

After setting up `.env`, run:

```bash
node scripts/seed-payment-methods.js
```

## Frontend Integration

The frontend (`cnc-logistics-hub`) is already wired to the payment endpoints:
- **Payment page**: `/payment` – creates order, selects Paystack/Interswitch, redirects to gateway
- **Payment return**: `/payment/return` – handles callback, verifies Paystack, redirects to dashboard
- **API base**: Uses `/api` (proxy in dev) or production URL.

### Local Payment Testing (fixes "Route not found" 404)

To test payments locally, run both backend and frontend:

1. **Backend** (CNG_LOGISTICS): `npm run dev` or `node src/server.js` (runs on port 5000)
2. **Frontend** (cnc-logistics-hub): `npm run dev` (runs on port 3000)

The frontend proxy now defaults to `http://localhost:5000`. If you get 404 on `/api/v1/payment/process` or `/api/v1/payment/paystack/initialize`, ensure:
- The backend is running locally on port 5000
- Payment routes are registered (they are in `src/app.js` at `/api/v1/payment`)
- Run `node scripts/seed-payment-methods.js` to seed Paystack/Interswitch methods

To use the production API instead, set in frontend `.env`:
```
VITE_PROXY_TARGET=https://cng-logistics.onrender.com
```

For local Interswitch callbacks, set in backend `.env`:
```
INTERSWITCH_SITE_REDIRECT_URL=http://localhost:5000/api/v1/payment/interswitch/callback
INTERSWITCH_CALLBACK_URL=http://localhost:5000/api/v1/payment/interswitch/callback
BASE_URL=http://localhost:5000
FRONTEND_BASE_URL=http://localhost:3000
```

## Paystack Dashboard

1. **Callback URL**: `https://cng-logistics.onrender.com/api/v1/payment/paystack/callback`
2. **Webhook URL**: `https://cng-logistics.onrender.com/api/v1/payment/paystack/webhook`

## Interswitch Test Cards

See: https://docs.interswitchgroup.com/docs/test-cards

## Database Migration

**Run this only after `DATABASE_URL` is set in `.env`.**

Create payment tables:

```bash
npx prisma migrate dev --name add-payment-models
```

Or for production:

```bash
npx prisma migrate deploy
```

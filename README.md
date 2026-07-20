# VenueVista

A premium Telangana function-hall discovery and booking app for Android and iOS.

## Run

```bash
npm install
npm start
```

Scan the QR code with Expo Go, or press `a`, `i`, or `w` for Android, iOS, or web.

## Live backend setup

The app runs without credentials in demo mode. To connect production services:

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Copy `.env.example` to `.env` and add the project URL and publishable key.
3. Create a Razorpay account and add test keys as Supabase Edge Function secrets:

```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=xxx
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

4. Configure a Razorpay webhook to call the verification function before using live keys.
5. Give venue partners the `owner` role in the `profiles` table. Customers retain the default `customer` role.

Never place the Razorpay secret key in `.env` or in the mobile application. Only the public key belongs in the app.

## Demo accounts

With no `.env`, any valid-looking email and six-character password work locally. Use an email containing `owner` (for example `owner@venuevista.demo`) to open the owner dashboard.

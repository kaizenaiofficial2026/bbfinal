# Seylan MPGS production go-live

Last verified: 27 July 2026.

## Current safety state

- Vercel Production payments are deliberately disabled.
- The public release that preceded this work was built with the Seylan MTF
  origin and a TEST merchant. Do not re-enable it.
- Preview/local may continue using MTF.
- All seven currently published packages use USD. Historical payment rows also
  include LKR and must remain historical; checkout rejects any new order whose
  currency does not exactly match `MPGS_CURRENCY`.

## Production configuration

Set these on Vercel **Production** while `PAYMENTS_ENABLED=false`:

```text
MPGS_BASE_URL=https://seylan.gateway.mastercard.com
MPGS_API_VERSION=100
MPGS_MERCHANT_ID=<non-TEST production MID>
MPGS_API_PASSWORD=<production API password>
MPGS_MERCHANT_NAME=Beyond Borders
MPGS_CURRENCY=USD
MPGS_WEBHOOK_SECRET=<gateway-issued 32-character secret>
NEXT_PUBLIC_SITE_URL=https://www.beyondborders.lk
PAYMENTS_ENABLED=false
```

Keep secrets in Vercel/Merchant Administration. Never paste them into source,
logs, tickets, screenshots, or this document.

In Seylan Merchant Administration, confirm:

- Hosted Checkout and the `PURCHASE` operation are enabled;
- USD and the required card brands are enabled for the production MID;
- 3-D Secure is enabled and tested;
- the HTTPS notification URL is
  `https://www.beyondborders.lk/api/payments/webhook`;
- its Notification Secret is the same 32-character value stored in Vercel.

Redeploy after changing the environment. `MPGS_BASE_URL` is baked into the
Content Security Policy at build time.

## Required verification before broad enablement

1. Run the complete mocked/unit suite, typecheck, lint, build, and security audit.
2. Complete MTF success, 3DS challenge, decline, cancel/timeout, return,
   duplicate webhook, and reconciliation-recovery checks using the isolated test
   Supabase project.
3. Deploy the hardened code with Production payments still disabled.
4. Confirm the live CSP contains only
   `https://seylan.gateway.mastercard.com` for MPGS script/connect/frame access.
5. Set `PAYMENTS_ENABLED=true`, redeploy, and make one controlled low-value
   real-card purchase.
6. In the app, Merchant Administration, email/SMS, and the bank account, verify
   the same order id, exact USD amount, captured state, one receipt, and eventual
   settlement.
7. Perform and verify a full refund. Confirm the local payment becomes
   `refunded`; partial refunds/disputes remain captured but generate a manual
   review warning and preserve the gateway state for operations.
8. Test duplicate notification delivery and an abandoned browser return.

The project is currently on Vercel Hobby, whose cron fallback runs daily. For a
shorter recovery objective, move to a plan/scheduler that permits a 5–15 minute
reconciliation cadence before broad payment volume.

## Official references

- [Hosted Checkout integration steps](https://seylan.gateway.mastercard.com/api/documentation/integrationGuidelines/hostedCheckout/integrationSteps.html?locale=en_US)
- [Establish a Hosted Checkout session](https://seylan.gateway.mastercard.com/api/documentation/integrationGuidelines/hostedCheckout/establishingAsession.html?locale=en_US)
- [Implement the Hosted Payment Page](https://seylan.gateway.mastercard.com/api/documentation/integrationGuidelines/hostedCheckout/implementingTheHostedPaymentPage.html?locale=en_US)
- [Interpret the response](https://seylan.gateway.mastercard.com/api/documentation/integrationGuidelines/hostedCheckout/interpretingTheResponse.html?locale=en_US)
- [Webhook notifications](https://seylan.gateway.mastercard.com/api/documentation/integrationGuidelines/supportedFeatures/pickAdditionalFunctionality/webhookNotifications.html?locale=en_US)
- [Retrieve Order v100](https://seylan.gateway.mastercard.com/api/documentation/apiDocumentation/rest-json/version/100/operation/Transaction%3A%20%20Retrieve%20Order.html?locale=en_US)


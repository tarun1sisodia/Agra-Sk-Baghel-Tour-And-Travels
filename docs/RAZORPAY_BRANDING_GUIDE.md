# Razorpay logo and checkout branding — Agra SK Baghel Tour & Travels

This repository now passes the Agra SK Baghel square brand mark through Razorpay Checkout's `image` option, and uses **Agra SK Baghel Tour & Travels** as the Checkout business name.

## Update the logo in the Razorpay Dashboard

1. Sign in to the Razorpay Dashboard with an Owner/Admin account.
2. Open **Account & Settings → Checkout Settings → Branding** (some accounts show **Checkout Styling**).
3. Edit **Brand name and logo**. Set the displayed brand name to **Agra SK Baghel Tour & Travels**.
4. Upload the square brand mark as a PNG/JPG. Recommended: export `sk-baghel-mark.svg` as a transparent **512 × 512 px PNG** under **1 MB**.
5. Save the logo/settings, then open a test checkout and confirm the displayed name and logo.

## Website Checkout setting

Razorpay's Checkout `name` option controls the business name shown in the payment form; its optional `image` option accepts a logo URL (or base64 image). These code paths now use:

```ts
name: "Agra SK Baghel Tour & Travels",
image: `${window.location.origin}/assets/brand/agra-sk-baghel-mark.svg`,
```

The logo must remain publicly reachable over HTTPS from the customer website. The dashboard logo and the website's Checkout `image` option are separate settings, so set both and verify the result on the live domain after deployment.

References:
- [Razorpay Checkout options — `name` and `image`](https://razorpay.com/docs/server-integration/python/test-app/)
- [Razorpay: Checkout Settings → Branding](https://razorpay.com/blog/razorpay-checkout-customization/)

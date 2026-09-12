# 🔌 NotifyPush Zero-Code Webhook Adapters

Directly connect **GitHub**, **Stripe**, **Razorpay**, and **Shopify** webhooks to your NotifyPush topics with zero custom backend coding.

---

## 🚀 Available Adapters

| Provider | Supported Events | Example Notification |
|---|---|---|
| **GitHub** (`github-adapter.js`) | Stars, Issues, Releases, Pushes, CI Failures | `⭐ New Star on user/repo by @alex` |
| **Stripe** (`stripe-adapter.js`) | `payment_intent.succeeded`, `invoice.payment_failed`, etc. | `💳 Payment Received: $149.00 from Priya` |
| **Razorpay** (`razorpay-adapter.js`) | `payment.captured`, `payment.failed` (UPI/Cards) | `💳 Payment Received: ₹4,999 via UPI` |
| **Shopify** (`shopify-adapter.js`) | `orders/create`, `orders/paid`, `orders/fulfilled` | `🛍️ New Order #1042: $249.00` |

---

## ⚡ 1-Minute Cloudflare Worker Deployment (100% Free Forever)

Deploy `cloudflare-worker.js` on Cloudflare Workers (free tier includes 100,000 requests/day):

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > **Workers & Pages** > **Create Application**.
2. Paste the contents of `cloudflare-worker.js`.
3. Set your webhook URL in GitHub / Stripe / Razorpay settings:
   ```text
   https://your-worker.workers.dev/github/my-secret-topic-9921
   https://your-worker.workers.dev/stripe/my-secret-topic-9921
   https://your-worker.workers.dev/razorpay/my-secret-topic-9921
   https://your-worker.workers.dev/shopify/my-secret-topic-9921
   ```

Every event will instantly turn into high-priority notifications on your Android device and Windows desktop!

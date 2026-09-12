# notifypush-client (TypeScript / JavaScript)

> Production-grade, zero-dependency push notification client for Next.js, React, Node.js, Express, and Cloudflare Workers.

## Features
- **Zero Heavy Dependencies** (built with standard native `fetch`)
- **Resilient & Fail-Safe** (safe timeouts, non-crashing promise returns)
- **Rich Action Buttons** (one-tap URLs, webhooks, broadcast triggers)
- **HMAC Topic Obfuscation & E2EE Support**

## Installation

```bash
npm install notifypush-client
# or
pnpm add notifypush-client
# or
yarn add notifypush-client
```

## Quick Start

### 1. Environment Variables
```env
NOTIFY_SERVER=https://ntfy.sh
NOTIFY_TOPIC=my-private-topic-9921
NOTIFY_TOKEN=tk_optional_auth_token
```

### 2. Basic Dispatch (Next.js / Node.js)
```typescript
import { notify } from 'notifypush-client';

await notify.send({
  title: "💳 Payment Received",
  message: "Order #8491 was successfully paid ($149.00)",
  priority: "high",
  tags: ["moneybag", "white_check_mark"],
  clickUrl: "https://admin.yourdomain.com/orders/8491",
  actions: [
    { action: "view", label: "View Invoice", url: "https://stripe.com/receipt/8491" }
  ]
});
```

### 3. Custom Client Instance
```typescript
import { NotifyPushClient } from 'notifypush-client';

const client = new NotifyPushClient({
  serverUrl: 'https://ntfy.private-domain.com',
  defaultTopic: 'ops-alerts',
  token: 'secret-bearer-token',
  timeoutMs: 3000
});

const result = await client.send({
  title: "Server High Load",
  message: "CPU utilization at 91%",
  priority: "urgent",
  tags: ["warning", "fire"]
});

if (!result.success) {
  console.error("Alert failed:", result.error);
}
```

---

## 💡 Practical Real-World Blueprints

### Blueprint 1: Next.js App Router Contact Form / Lead Generation
```typescript
// app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { notify } from 'notifypush-client';

export async function POST(req: Request) {
  const { name, email, message, budget } = await req.json();

  // Save to DB...

  // Dispatch instant phone & desktop heads-up notification:
  await notify.send({
    topic: process.env.NOTIFY_LEADS_TOPIC || 'agency-leads-8812',
    title: `✉️ New Lead: ${name}`,
    message: `Budget: ${budget || 'Not specified'}\nEmail: ${email}\nMessage: ${message.slice(0, 100)}`,
    priority: 'high',
    tags: ['briefcase', 'moneybag'],
    clickUrl: `mailto:${email}`,
    actions: [
      { action: 'view', label: 'Reply via Email', url: `mailto:${email}` }
    ]
  });

  return NextResponse.json({ success: true });
}
```

### Blueprint 2: Stripe Webhook Payment Confirmation
```typescript
// app/api/webhooks/stripe/route.ts
import { notify } from 'notifypush-client';

export async function handlePaymentSuccess(session: any) {
  const amount = (session.amount_total / 100).toFixed(2);
  const customerEmail = session.customer_details?.email;

  await notify.send({
    topic: 'store-sales-9921',
    title: `💳 Payment Received: $${amount}`,
    message: `Customer: ${customerEmail}\nOrder ID: ${session.id.slice(-8)}`,
    priority: 'high',
    tags: ['dollar', 'white_check_mark'],
    clickUrl: `https://dashboard.stripe.com/payments/${session.payment_intent}`,
    actions: [
      { action: 'view', label: 'View in Stripe', url: `https://dashboard.stripe.com/payments/${session.payment_intent}` }
    ]
  });
}
```

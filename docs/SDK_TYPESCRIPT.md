# notifypush-client (TypeScript & JavaScript)

Production-grade, zero-heavy-dependency push notification client for Next.js, Node.js, Express, Fastify, and Cloudflare Workers.

---

## Installation

```bash
npm install notifypush-client
# or
pnpm add notifypush-client
# or
yarn add notifypush-client
```

---

## Configuration via Environment Variables

NotifyPush automatically detects standard environment variables if no explicit options are passed:

```env
# .env.local or .env
NOTIFY_SERVER=https://ntfy.sh
NOTIFY_TOPIC=my-private-channel-9921
NOTIFY_TOKEN=tk_optional_bearer_token
```

---

## 1. Next.js App Router (Route Handler)

```typescript
// app/api/alerts/route.ts
import { notify } from '@notifypush/sdk';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { orderId, amount, customerEmail } = await req.json();

    const result = await notify.send({
      title: "💳 New Order Placed",
      message: `Order #${orderId} paid ($${amount}) by ${customerEmail}`,
      priority: "high",
      tags: ["moneybag", "white_check_mark"],
      clickUrl: `https://dashboard.example.com/orders/${orderId}`,
      actions: [
        {
          action: "view",
          label: "View in Stripe",
          url: `https://dashboard.stripe.com/payments/${orderId}`
        }
      ]
    });

    return NextResponse.json({ success: result.success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## 2. Next.js Server Action

```typescript
// app/actions.ts
'use server';

import { notify } from '@notifypush/sdk';

export async function reportFeedback(userMessage: string) {
  await notify.send({
    title: "💬 User Feedback Received",
    message: userMessage,
    priority: "default",
    tags: ["speech_balloon"]
  });
}
```

---

## 3. Custom Client Instance (Multiple Channels)

If your app reports to multiple distinct channels (e.g., Billing vs. DevOps vs. Security):

```typescript
import { NotifyPushClient } from '@notifypush/sdk';

const opsClient = new NotifyPushClient({
  serverUrl: 'https://notify.internal.company.com',
  defaultTopic: 'ops-alerts',
  token: process.env.OPS_TOKEN,
  timeoutMs: 3000
});

const billingClient = new NotifyPushClient({
  serverUrl: 'https://notify.internal.company.com',
  defaultTopic: 'billing-events',
  token: process.env.BILLING_TOKEN
});

// Dispatch:
await opsClient.send({
  title: "Pod Eviction Warning",
  message: "Kubernetes pod app-frontend-2 evicted due to memory pressure",
  priority: "urgent",
  tags: ["warning", "fire"]
});
```

---

## 4. Cryptographic Topic Obfuscation (HMAC)

To prevent anyone from guessing your topic on public servers, derive an unpredictable topic from your app's master secret:

```typescript
import { deriveSecureTopic, notify } from '@notifypush/sdk';

const APP_SECRET = process.env.APP_SECRET_KEY!;
const secureTopic = deriveSecureTopic(APP_SECRET, 'user_account_9012');
// Produces: "vcl-4f8a2910cbe8410..."

await notify.send({
  topic: secureTopic,
  title: "Security Login",
  message: "New login detected from IP 192.168.1.1"
});
```

---

## 5. End-to-End Encryption (E2EE) Helper

Encrypt message bodies before sending them across the wire. Only devices configured with the matching AES key can decrypt them:

```typescript
import { encryptPayload } from '@notifypush/sdk';

const base64Key = process.env.NOTIFICATION_AES_KEY!; // 256-bit base64
const { ciphertext, iv, tag } = encryptPayload("Secret customer details", base64Key);

await notify.send({
  title: "Encrypted Message",
  message: JSON.stringify({ ciphertext, iv, tag }),
  tags: ["lock"]
});
```

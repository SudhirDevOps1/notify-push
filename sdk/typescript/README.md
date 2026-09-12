# @notifypush/sdk (TypeScript / JavaScript)

> Production-grade, zero-dependency push notification client for Next.js, React, Node.js, Express, and Cloudflare Workers.

## Features
- **Zero Heavy Dependencies** (built with standard native `fetch`)
- **Resilient & Fail-Safe** (safe timeouts, non-crashing promise returns)
- **Rich Action Buttons** (one-tap URLs, webhooks, broadcast triggers)
- **HMAC Topic Obfuscation & E2EE Support**

## Installation

```bash
npm install @notifypush/sdk
# or
pnpm add @notifypush/sdk
# or
yarn add @notifypush/sdk
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
import { notify } from '@notifypush/sdk';

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
import { NotifyPushClient } from '@notifypush/sdk';

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

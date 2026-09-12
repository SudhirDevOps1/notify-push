# 🔔 NotifyPush

<p align="center">
  <img src="public/hero_banner.png" alt="NotifyPush Hero" width="720" style="border-radius: 12px;"/>
</p>

<p align="center">
  <b>The Lightweight, Privacy-First, Zero-Telemetry Push Notification Dispatcher & Mobile Receiver</b>
</p>

<p align="center">
  <a href="https://github.com/SudhirDevOps1/notify-push/actions"><img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="Build Status"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"/></a>
  <a href="https://developer.android.com/"><img src="https://img.shields.io/badge/platform-Android%208.0%2B-green?style=flat-square" alt="Platform"/></a>
  <a href="#-sdk-toolkit"><img src="https://img.shields.io/badge/SDKs-Node%20%7C%20Python%20%7C%20PHP%20%7C%20Go%20%7C%20Bash-orange?style=flat-square" alt="SDKs"/></a>
  <a href="#-security--privacy-architecture"><img src="https://img.shields.io/badge/telemetry-ZERO-red?style=flat-square" alt="Zero Telemetry"/></a>
</p>

---

## 🌟 Overview

**NotifyPush** turns any website, serverless function, backend API, database trigger, or DevOps script into instant, real-time Heads-Up Push Notifications on your Android device — **with zero third-party dependencies, no Firebase/FCM lock-in, and 100% privacy.**

Unlike proprietary push services that monetize your notification payloads and metadata, **NotifyPush** connects directly over TLS SSE (Server-Sent Events) or WebSockets to [ntfy.sh](https://ntfy.sh) or your own self-hosted private Docker gateway.

---

## 🚀 Key Features

- ⚡ **Instant Webhook to Phone**: Fire a simple HTTP POST request from any language/framework and receive a native heads-up notification in `< 500ms`.
- 🛡️ **Zero Telemetry & 100% Local-First**: No analytics, no ad SDKs, no trackers. Logs are stored exclusively in an on-device local Room SQLite database.
- 🔄 **24/7 Resilient Daemon Service**: Runs as a persistent Android foreground service with automatic exponential reconnection on network drops.
- ⚡ **Boot Auto-Start**: Automatically re-establishes SSE listener streams after phone restart (`RECEIVE_BOOT_COMPLETED`).
- 📷 **Instant QR Code Scanner**: Scan camera QR codes from web consoles to configure topic, server URL, and auth tokens in 1 second.
- 🔍 **Real-Time Log Search & Filter**: Substring search by keyword, filter for urgent alerts (`Priority 4+`), or filter for links.
- 📋 **One-Tap Actions**: Copy notification text, share via system chooser, or open attached deep-links.
- 📦 **Universal Multi-Language SDKs**: Native, zero-heavy-dependency SDKs for TypeScript, Python, PHP, Go, and Shell/cURL.

---

## 📁 Repository Structure

```
notify-push/
├── app/                          # Native Android Jetpack Compose Application
│   ├── src/main/java/com/example
│   │   ├── service/              # 24/7 Foreground SSE Listener Daemon
│   │   ├── network/              # SSE Stream Parser & OkHttp Engine
│   │   ├── ui/                   # Jetpack Compose M3 Views & ViewModels
│   │   ├── data/                 # Local Room SQLite Database (Zero-telemetry)
│   │   └── qr/                   # CameraX QR Code Scanner
├── sdk/                          # Universal Multi-Platform Client Libraries
│   ├── typescript/               # Next.js, React, Node.js, Express (@notifypush/sdk)
│   ├── python/                   # Python package (FastAPI, Django, Flask)
│   ├── php/                      # PHP Composer package (Laravel, WordPress)
│   ├── go/                       # Golang microservice client
│   └── cli/                      # Bash script & GitHub Action workflow
├── ENTERPRISE_ARCHITECTURE.md    # Production E2EE & Outbox Schema Blueprint
├── LICENSE                       # MIT License
└── README.md
```

---

## 📦 SDK Toolkit

### 1. TypeScript / JavaScript (Next.js, Node.js, React)

```bash
cd sdk/typescript
npm install
npm run build
```

```typescript
import { notify } from '@notifypush/sdk';

await notify.send({
  title: "💳 Payment Received",
  message: "Order #8491 paid $149.00 via Stripe",
  priority: "high",
  tags: ["moneybag", "white_check_mark"],
  clickUrl: "https://yourdashboard.com/orders/8491",
  actions: [
    { action: "view", label: "View Invoice", url: "https://stripe.com/receipt/8491" }
  ]
});
```

---

### 2. Python (FastAPI, Django, Flask, Scripts)

```python
from notifypush import notify

notify.send(
    title="🚀 Deployment Completed",
    message="Vercel production build deployed in 32s",
    priority="high",
    tags=["rocket", "tada"]
)
```

---

### 3. PHP (Laravel, Core PHP, WordPress)

```php
use NotifyPush\NotifyPush;

$notify = new NotifyPush(topic: 'my-secret-topic');
$notify->send(
    title: 'New User Signup',
    message: 'user@example.com registered for Pro Plan',
    priority: 'high',
    tags: ['star', 'bust_in_silhouette']
);
```

---

### 4. Go (Golang Services)

```go
package main

import (
    "context"
    notifypush "github.com/SudhirDevOps1/notify-push/sdk/go"
)

func main() {
    client := notifypush.NewClient("https://ntfy.sh", "my-topic", "")
    client.Send(context.Background(), "Server Alert", "Disk usage at 91%", "urgent", []string{"warning"}, nil)
}
```

---

### 5. cURL / Terminal / GitHub Actions

```bash
curl -X POST "https://ntfy.sh/my-secret-topic" \
  -H "Title: Pipeline Succeeded" \
  -H "Priority: high" \
  -H "Tags: white_check_mark" \
  -d "All 42 integration tests passed on main branch."
```

Or in your `.github/workflows/deploy.yml`:
```yaml
- name: Notify Phone
  uses: SudhirDevOps1/notify-push/sdk/cli@main
  with:
    topic: ${{ secrets.NOTIFY_TOPIC }}
    title: 'Deploy Successful'
    message: 'Release v1.0 deployed to production.'
```

---

## 🔒 Security & Privacy Architecture

1. **Zero Central Database**: The Android app does not send your data to any centralized database or telemetry service.
2. **Cryptographic Topic Obfuscation**: Use HMAC-SHA256 derived topics so no crawler can guess your public channel.
3. **End-to-End Encryption (E2EE)**: Payloads can be encrypted client-side using `AES-256-GCM` before dispatching. Only your physical Android device holding the key can decrypt it.
4. **Self-Hosted Freedom**: Full support for your own self-hosted private ntfy Docker container on your own domain.

---

## 🛠️ Build & Development

### Requirements
- JDK 17+
- Android Studio Jellyfish / Koala or newer
- Android SDK 34 / Android 8.0+ (API 26+)

### Running Locally
```bash
# Clone the repository
git clone https://github.com/SudhirDevOps1/notify-push.git
cd notify-push

# Build the Android APK
./gradlew assembleDebug

# Run Unit Tests
./gradlew testDebugUnitTest
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Created and maintained with ❤️ by [SudhirDevOps1](https://github.com/SudhirDevOps1).

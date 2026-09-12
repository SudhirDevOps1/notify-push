# <img src="public/app_icon.svg" width="36" height="36" alt="NotifyPush Icon" valign="middle" /> NotifyPush

<p align="center">
  <img src="public/hero_banner.svg" alt="NotifyPush Hero Banner" width="100%" />
</p>

<p align="center">
  <b>The Lightweight, Privacy-First, Zero-Telemetry Push Notification Dispatcher &amp; Mobile Receiver</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/notifypush-client"><img src="https://img.shields.io/npm/v/notifypush-client?style=for-the-badge&logo=npm&logoColor=white&color=CB3837" alt="NPM Version"/></a>
  <a href="https://github.com/SudhirDevOps1/notify-push/releases"><img src="https://img.shields.io/github/v/release/SudhirDevOps1/notify-push?style=for-the-badge&logo=github&color=7C3AED" alt="GitHub Release"/></a>
  <a href="https://github.com/SudhirDevOps1/notify-push/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/SudhirDevOps1/notify-push/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI%20Build" alt="CI Status"/></a>
  <a href="https://developer.android.com/"><img src="https://img.shields.io/badge/Android-8.0%2B-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-3B82F6?style=for-the-badge" alt="License"/></a>
  <a href="docs/README.hinglish.md"><img src="https://img.shields.io/badge/Language-%F0%9F%87%AE%F0%9F%87%B3%20Hinglish%20Guide-EF4444?style=for-the-badge" alt="Hinglish Guide"/></a>
</p>

---

## 🌐 Language Guides / भाषा चुनें

- 🇬🇧 **[English Documentation (Default)](#-table-of-contents)**
- 🇮🇳 **[Hinglish संपूर्ण गाइड (हिंदी / English)](docs/README.hinglish.md)** — *Step-by-step saral bhasha me setup aur implementation guide.*

---

## 📑 Table of Contents

1. [Overview & Motivation](#-overview--motivation)
2. [Why NotifyPush vs. Firebase/FCM?](#-why-notifypush-vs-firebasefcm)
3. [Quick Start in 60 Seconds](#-quick-start-in-60-seconds)
4. [Universal SDK Toolkit](#-universal-sdk-toolkit)
   - [TypeScript / Node.js / Next.js](#1-typescript--nodejs--nextjs)
   - [Python (FastAPI, Django, Flask)](#2-python-fastapi-django-flask)
   - [PHP (Laravel, Core PHP)](#3-php-laravel-core-php)
   - [Go (Golang Microservices)](#4-go-golang-microservices)
   - [CLI & GitHub Actions](#5-cli--github-actions-workflow)
5. [Android Mobile App](#-android-mobile-app)
   - [Camera QR Code Scanner](#instant-qr-code-scanner)
   - [24/7 Resilient Daemon Service](#247-resilient-background-daemon)
   - [Battery Optimization Setup](#battery-optimization-setup)
6. [Self-Hosting with Docker](#-self-hosting-with-docker)
7. [Security & End-to-End Encryption](#-security--end-to-end-encryption)
8. [Documentation Index](#-documentation-index)
9. [Contributing & License](#-contributing--license)

---

## 🌟 Overview & Motivation

**NotifyPush** turns any website, backend API, serverless function, database trigger, or DevOps script into instant, real-time Heads-Up Push Notifications on your Android device — **in less than 500ms, with zero third-party dependencies, no Firebase/FCM lock-in, and 100% privacy.**

Most modern push notification providers require:
- Complex Google Cloud Console / Firebase projects and credentials (`google-services.json`).
- Heavy proprietary client libraries that monitor user behavior and collect device telemetry.
- Expensive monthly pricing tiers once notification volume scales.

**NotifyPush completely changes this paradigm:**
It establishes a lightweight, direct TLS Server-Sent Events (SSE) or WebSocket connection between your Android phone and your chosen gateway (either the free public [ntfy.sh](https://ntfy.sh) instance or your own self-hosted private Docker container).

---

## ⚡ Why NotifyPush vs. Firebase/FCM?

| Capability | NotifyPush | Firebase Cloud Messaging (FCM) | OneSignal / Pusher |
|---|---|---|---|
| **Account Requirement** | ❌ None (zero signup needed) | ✔️ Google Cloud account mandatory | ✔️ Paid registration required |
| **Setup Time** | ⚡ **1 minute** | ⏱️ 30+ minutes | ⏱️ 20+ minutes |
| **Privacy & Telemetry** | 🛡️ **Zero Telemetry** (100% on-device) | ⚠️ Google server logging & analytics | ⚠️ Third-party tracking SDKs |
| **Self-Hosting** | ✔️ **Full Docker support** | ❌ Cloud-locked | ❌ Cloud-locked |
| **Delivery Latency** | ⚡ **< 500ms** (direct SSE stream) | ⏱️ 2s – 30s queue delays | ⏱️ 1s – 10s |
| **Cost** | 🆓 **100% Free & Open Source** | ⚠️ Billed at high scale | ⚠️ Steep monthly subscriptions |

---

## 🚀 Quick Start in 60 Seconds

### Step 1: Open the Android App
Set your private topic name in the app (for example: `my-private-alerts-9901`) and tap **"Save & Connect"**. The status bar turns green: **"Listening (Active)"**.

### Step 2: Fire an Alert from Terminal
Open your terminal and run this single command:

```bash
curl -X POST "https://ntfy.sh/my-private-alerts-9901" \
  -H "Title: 🚀 Alert Delivered" \
  -H "Priority: high" \
  -H "Tags: bell,white_check_mark" \
  -d "NotifyPush is working! Zero config, pure speed."
```

**Result:** Within 250ms, your Android phone rings, vibrates, and displays a native heads-up card!

---

## 📦 Universal SDK Toolkit

All SDKs live directly in the `/sdk` directory and are designed with **zero heavy dependencies** and fail-safe, non-crashing execution.

### 1. TypeScript / Node.js / Next.js
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/notifypush-client?style=flat-square&logo=npm&color=CB3837)](https://www.npmjs.com/package/notifypush-client)
[![npm downloads](https://img.shields.io/npm/dm/notifypush-client?style=flat-square&color=blue)](https://www.npmjs.com/package/notifypush-client)

*Deep Dive:* **[TypeScript SDK Documentation](docs/SDK_TYPESCRIPT.md)**

```bash
npm install notifypush-client
```

```typescript
import { notify } from 'notifypush-client';

// Fire alert from any API route, Server Action, or webhook:
await notify.send({
  topic: "my-private-alerts-9901",
  title: "💳 Payment Received",
  message: "Order #8491 paid $149.00 via Stripe",
  priority: "high",
  tags: ["moneybag", "white_check_mark"],
  clickUrl: "https://admin.yourdomain.com/orders/8491",
  actions: [
    { action: "view", label: "View Invoice", url: "https://stripe.com/receipt/8491" }
  ]
});
```

---

### 2. Python (FastAPI, Django, Flask)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Django](https://img.shields.io/badge/Django-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Zero Dependency](https://img.shields.io/badge/Dependencies-Zero-10B981?style=flat-square)](#)

*Deep Dive:* **[Python SDK Documentation](docs/SDK_PYTHON.md)**

```bash
pip install notifypush
```

```python
from notifypush import notify

notify.send(
    topic="my-private-alerts-9901",
    title="🔥 CPU Load Warning",
    message="Server utilization reached 92.4%",
    priority="urgent",
    tags=["warning", "fire"],
    click_url="https://grafana.internal.net"
)
```

---

### 3. PHP (Laravel, Core PHP)
[![PHP](https://img.shields.io/badge/PHP-777BB4?style=flat-square&logo=php&logoColor=white)](https://www.php.net/)
[![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=flat-square&logo=laravel&logoColor=white)](https://laravel.com/)
[![Composer](https://img.shields.io/badge/Composer-885630?style=flat-square&logo=composer&logoColor=white)](https://getcomposer.org/)

*Deep Dive:* **[PHP SDK Documentation](docs/SDK_PHP.md)**

```bash
composer require notifypush/client
```

```php
use NotifyPush\NotifyPush;

$notify = new NotifyPush(topic: 'my-private-alerts-9901');
$notify->send(
    title: '📦 Order Dispatched',
    message: 'Shipment #TRK-8812 has departed warehouse',
    priority: 'high',
    tags: ['truck', 'package']
);
```

---

### 4. Go (Golang Microservices)
[![Go](https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white)](https://go.dev/)
[![Microservices](https://img.shields.io/badge/Context-Aware-7C3AED?style=flat-square)](#)

*Deep Dive:* **[Go SDK Documentation](docs/SDK_GO.md)**

```bash
go get github.com/SudhirDevOps1/notify-push/sdk/go
```

```go
package main

import (
    "context"
    notifypush "github.com/SudhirDevOps1/notify-push/sdk/go"
)

func main() {
    client := notifypush.NewClient("https://ntfy.sh", "my-private-alerts-9901", "")
    _ = client.Send(context.Background(), "Backup Finished", "PostgreSQL database dump uploaded to S3", "default", []string{"floppy_disk"}, nil)
}
```

---

### 5. CLI & GitHub Actions Workflow
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![Bash](https://img.shields.io/badge/Bash-4EAA25?style=flat-square&logo=gnubash&logoColor=white)](https://www.gnu.org/software/bash/)

In your `.github/workflows/deploy.yml`:

```yaml
- name: Notify Phone on Build Failure
  if: failure()
  uses: SudhirDevOps1/notify-push/sdk/cli@main
  with:
    topic: ${{ secrets.NOTIFY_TOPIC }}
    title: '❌ CI Pipeline Failed'
    message: 'Commit ${{ github.sha }} failed tests on branch ${{ github.ref_name }}'
    priority: 'urgent'
    tags: 'rotating_light,x'
```

---

## 📱 Android Mobile App
[![Android Platform](https://img.shields.io/badge/Android-8.0%2B-3DDC84?style=flat-square&logo=android&logoColor=white)](https://developer.android.com/)
[![Kotlin](https://img.shields.io/badge/Kotlin-2.0-7F52FF?style=flat-square&logo=kotlin&logoColor=white)](https://kotlinlang.org/)
[![Jetpack Compose](https://img.shields.io/badge/Jetpack%20Compose-Material%203-4285F4?style=flat-square&logo=jetpackcompose&logoColor=white)](https://developer.android.com/jetpack/compose)
[![Room DB](https://img.shields.io/badge/Room%20DB-SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://developer.android.com/training/data-storage/room)

<p align="center">
  <img src="public/app_icon.svg" alt="NotifyPush Official Android App Icon" width="96" height="96" />
  <br />
  <sub><b>Official NotifyPush Android App Icon</b></sub>
</p>

The Android client is built with modern **Jetpack Compose (Material 3)**, **Room Database**, and **Kotlin Coroutines**:

### Instant QR Code Scanner
Scan any camera QR code formatted with JSON or URL schemas (`ntfy://host/topic?token=...`) to auto-configure topic name, custom gateway server, and auth credentials in 1 second.

### 24/7 Resilient Background Daemon
The app operates an official Android Foreground Service (`NotificationListenerService`) that maintains an uninterrupted TLS SSE connection with automatic exponential backoff reconnection.

### Battery Optimization Setup
To prevent aggressive OEM battery managers (MIUI, OneUI, ColorOS) from sleeping the background stream:
1. Tap the **"Enable 24/7 Background Delivery"** card inside the app.
2. Select **"Unrestricted / No Restrictions"** in Android Battery Settings.

---

## 🐳 Self-Hosting with Docker
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Caddy](https://img.shields.io/badge/Caddy%20SSL-1F88C0?style=flat-square&logo=caddy&logoColor=white)](https://caddyserver.com/)

*Deep Dive:* **[Self-Hosting Guide](docs/SELF_HOSTING.md)**

Run your own private notification gateway on a VPS in 30 seconds:

```bash
docker run -d \
  --name notifypush-server \
  --restart unless-stopped \
  -p 8080:80 \
  -v /var/cache/ntfy:/var/cache/ntfy \
  -e NTFY_BASE_URL="https://push.yourdomain.com" \
  binwiederhier/ntfy serve
```

In the Android App, set the **Server URL** to `https://push.yourdomain.com`.

---

## 🔒 Security & End-to-End Encryption
*Deep Dive:* **[Enterprise Architecture](docs/ARCHITECTURE.md)**

1. **HMAC Topic Obfuscation**: Use HMAC-SHA256 derived topics so no external crawler can guess your notification channel.
2. **AES-256-GCM Zero-Knowledge Encryption**: Encrypt sensitive payloads client-side prior to dispatching. Only your physical Android device holding the matching key can decrypt the message.
3. **Android Keystore**: Security preferences and decryption keys are secured by Android hardware-backed Keystore.

---

## 📚 Documentation Index

All specialized implementation guides are located in the [`docs/`](docs/) directory:

| Document | Description |
|---|---|
| 🇮🇳 **[`docs/README.hinglish.md`](docs/README.hinglish.md)** | **Complete step-by-step Hindi/Hinglish user guide** |
| 📘 **[`docs/SDK_TYPESCRIPT.md`](docs/SDK_TYPESCRIPT.md)** | TypeScript SDK guide (Next.js, Express, HMAC, E2EE) |
| 🐍 **[`docs/SDK_PYTHON.md`](docs/SDK_PYTHON.md)** | Python SDK guide (FastAPI, Django, Celery, scripts) |
| 🐘 **[`docs/SDK_PHP.md`](docs/SDK_PHP.md)** | PHP & Laravel notification channel guide |
| 🐹 **[`docs/SDK_GO.md`](docs/SDK_GO.md)** | Golang microservice client guide |
| 🐳 **[`docs/SELF_HOSTING.md`](docs/SELF_HOSTING.md)** | Docker Compose & Nginx/Caddy SSL setup |
| 📡 **[`docs/API_REFERENCE.md`](docs/API_REFERENCE.md)** | Complete HTTP API headers & payload specification |
| 🏛️ **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** | Enterprise security & outbox design blueprint |

---

## 🤝 Contributing & License

Contributions, bug reports, and PRs are warmly welcome! Please review:
- [Contributing Guidelines](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

**License:** This project is licensed under the [MIT License](LICENSE).  
Created and maintained with ❤️ by **[SudhirDevOps1](https://github.com/SudhirDevOps1)** (`singhjgh30@gmail.com`).

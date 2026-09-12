# <img src="../public/app_icon.svg" width="36" height="36" alt="NotifyPush Icon" valign="middle" /> NotifyPush - Hinglish संपूर्ण गाइड (हिंदी / English)

<p align="center">
  <img src="../public/hero_banner.svg" alt="NotifyPush Hero Banner" width="100%" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/notifypush-client"><img src="https://img.shields.io/npm/v/notifypush-client?style=for-the-badge&logo=npm&logoColor=white&color=CB3837" alt="NPM Version"/></a>
  <a href="https://github.com/SudhirDevOps1/notify-push/releases"><img src="https://img.shields.io/github/v/release/SudhirDevOps1/notify-push?style=for-the-badge&logo=github&color=7C3AED" alt="GitHub Release"/></a>
  <a href="https://developer.android.com/"><img src="https://img.shields.io/badge/Android-8.0%2B-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android"/></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-MIT-3B82F6?style=for-the-badge" alt="License"/></a>
  <a href="../README.md"><img src="https://img.shields.io/badge/Language-%F0%9F%87%AC%F0%9F%87%A7%20English%20Docs-blue?style=for-the-badge" alt="English Documentation"/></a>
</p>
# <img src="../public/app_icon.svg" width="36" height="36" alt="NotifyPush Icon" valign="middle" /> NotifyPush - Hinglish संपूर्ण गाइड (हिंदी / English)

<p align="center">
  <img src="../public/hero_banner.svg" alt="NotifyPush Hero Banner" width="100%" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/notifypush-client"><img src="https://img.shields.io/npm/v/notifypush-client?style=for-the-badge&logo=npm&logoColor=white&color=CB3837" alt="NPM Version"/></a>
  <a href="https://github.com/SudhirDevOps1/notify-push/releases"><img src="https://img.shields.io/github/v/release/SudhirDevOps1/notify-push?style=for-the-badge&logo=github&color=7C3AED" alt="GitHub Release"/></a>
  <a href="https://developer.android.com/"><img src="https://img.shields.io/badge/Android-8.0%2B-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android"/></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-MIT-3B82F6?style=for-the-badge" alt="License"/></a>
  <a href="../README.md"><img src="https://img.shields.io/badge/Language-%F0%9F%87%AC%F0%9F%87%A7%20English%20Docs-blue?style=for-the-badge" alt="English Documentation"/></a>
</p>

> **NotifyPush** ek lightweight, privacy-first, zero-telemetry push notification system hai. Iski madad se aap apni kisi bhi website, backend API, serverless function (Next.js, Python, PHP, Go), ya DevOps script se apne Android mobile par **direct real-time Heads-Up notification (< 500ms)** bhej sakte hain.
> Isme koi **Firebase (FCM)** ka jhanjhat nahi hai, koi paid third-party subscription nahi hai, aur aapka data 100% private rehta hai.

---

## 📑 Index (Table of Contents)

1. [NotifyPush: Kyu, Kaha, Kab aur Kis Project Me Use Karein?](#-notifypush-kyu-kaha-kab-aur-kis-project-me-use-karein)
   - [Kyu (Why) Use Karein?](#1-kyu-why-use-karein-notifypush)
   - [Kaha (Where) Integrate Kar Sakte Hain?](#2-kaha-where-integrate-kar-sakte-hain)
   - [Kab (When) Notification Bhejein?](#3-kab-when-notification-bhejein-trigger-events)
   - [Kis Types Ke Projects Me Use Karein?](#4-kis-types-ke-projects-me-use-karein)
   - [Multi-App Channels Manager Ka Istemal](#5-️-multi-app-channels-manager-ka-istemal-mobile--desktop)
2. [NotifyPush Kya Hai aur Yeh Kaise Kaam Karta Hai?](#1-notifypush-kya-hai-aur-yeh-kaise-kaam-karta-hai)
3. [Firebase/OneSignal Se Behtar Kyun Hai?](#2-firebaseonesignal-se-behtar-kyun-hai)
4. [Android App Setup (Step-by-Step)](#3-android-app-setup-step-by-step)
5. [Windows Desktop App (.exe Setup)](#4-windows-desktop-app-exe-setup)
6. [60 Seconds Quickstart (Sabse Aasan Tareeqa)](#5-60-seconds-quickstart-sabse-aasan-tareeqa)
7. [Code Implementation (Apne Project Mein Kaise Lagayein)](#6-code-implementation-apne-project-mein-kaise-lagayein)
   - [Next.js / Node.js / TypeScript](#a-nextjs--nodejs--typescript)
   - [Python (FastAPI, Django, Flask, Automation)](#b-python-fastapi-django-flask)
   - [PHP (Laravel, Core PHP, WordPress)](#c-php-laravel-core-php)
   - [Go (Microservices)](#d-go-golang)
   - [cURL / Bash / Terminal Scripts](#e-curl--bash--terminal-scripts)
   - [GitHub Actions (CI/CD Alerts)](#f-github-actions-cicd-alerts)
8. [Security: Topic Ko Secret & Private Kaise Banayein?](#7-security-topic-ko-secret--private-kaise-banayein)
9. [Self-Hosting (Apna Private Docker Server)](#8-self-hosting-apna-private-docker-server)
10. [24/7 Background Notification Delivery (Battery Settings)](#9-247-background-notification-delivery-battery-settings)
11. [Aksar Pooche Jaane Wale Sawal (FAQs)](#10-aksar-pooche-jaane-wale-sawal-faqs)

---


---

## 💡 NotifyPush: Kyu, Kaha, Kab aur Kis Project Me Use Karein?

### 1. Kyu (Why) Use Karein NotifyPush?

| Traditional Push Ki Samasya | NotifyPush Ka Solution |
|---|---|
| **Data Leak & Privacy Ka Khatra**: Firebase aur OneSignal aapke users ka data, IP aur telemetry collect karte hain. | 🛡️ **100% Zero-Telemetry**: Koi tracking nahi, koi database logging nahi. Direct encrypted TLS connection aapke phone tak. |
| **Firebase/FCM Ka Jhanjhat**: Google Cloud Console par project banao, `google-services.json` lagao, SHA key generate karo — 1 ghanta lagta hai. | ⚡ **Sirf 60 Seconds Setup**: Koi account nahi chahiye. Bas ek secret topic name likho aur turant notifications receive karo. |
| **Mahine Ka Bhaari Kharcha**: Twilio SMS, Pusher ya PagerDuty mahine ke ₹3,000 se ₹15,000 tak charge karte hain. | 🆓 **100% Free & Open Source**: Jeevan bhar free. Public server use karein ya apna private Docker container chalayein. |
| **Notification Late Aana**: Android battery optimization ke chakkar me Firebase notifications 2 se 10 minute late aate hain. | 🚀 **Under 300ms Delivery**: Direct Server-Sent Events (SSE) stream se notification turant phone par ring/vibrate karta hai. |
| **Multiple Projects Ka Mix Ho Jana**: Agar 5 alag websites hain toh pata nahi chalta kaunsa alert kis site ka hai. | 🗂️ **Multi-App Channels Manager**: Ek hi phone aur desktop app me multiple projects (e.g. *Shopify Store*, *Client Leads*, *Server Alert*) alag-alag manage karein. |

---

### 2. Kaha (Where) Integrate Kar Sakte Hain?

NotifyPush wahan har jagah kaam karta hai jahan se ek simple `HTTP POST` request ja sakti hai:

- 🌐 **Websites & Frontend:** Next.js, React, Vue, HTML/JS Contact Forms, Landing Pages, WordPress/WooCommerce.
- ⚙️ **Backend APIs & Microservices:** Node.js (Express/Nest), Python (FastAPI/Django/Flask), PHP (Laravel/Core PHP), Go (Golang).
- ⚡ **Serverless & Edge Functions:** Vercel Edge, Cloudflare Workers, AWS Lambda, Supabase Functions.
- 💳 **Payment & Webhook Processors:** Stripe Webhooks, Razorpay Webhooks, PayPal IPN, GitHub Webhooks, Shopify Webhooks.
- 🚀 **DevOps & CI/CD:** GitHub Actions workflows, GitLab CI, Docker container monitors.
- 🖥️ **Linux Servers & Homelab:** Daily cron jobs, Server RAM/CPU alerts, Fail2ban SSH security, Raspberry Pi.

---

### 3. Kab (When) Notification Bhejein? (Trigger Events)

NotifyPush ko un events par trigger karein jahan turant human action ya update chahiye:

| Category | Kab Trigger Karein? (Event) | Priority | Example Notification |
|---|---|---|---|
| 🛒 **E-Commerce** | Naya Order / Payment Success | `high` (4) | `[Shopify Store] Naya order #1042: ₹4,999 from Rahul S.` |
| ✉️ **Leads** | Contact Form Bharne Par | `high` (4) | `[Portfolio Leads] Naya inquiry form: "Website banwani hai"` |
| 🚨 **Server Alert** | CPU / RAM 90% Se Upar Gaya | `urgent` (5) | `[Prod Server] CPU utilization 94%! Site slow ho sakti hai.` |
| 🛑 **Backend Crash** | API Par 500 Error Aane Par | `urgent` (5) | `[API Gateway] 500 Internal Error burst detect hua.` |
| 🛡️ **Security Alert** | Kisi Ne Galat SSH Password Dala | `urgent` (5) | `[Linux VPS] Unauthorized root login attempt from IP 185.x.x.x` |
| 💾 **Backup** | Database Backup Complete Hua | `default` (3) | `[Postgres Backup] 2.5 GB database dump safely uploaded.` |
| 🛠️ **CI/CD** | GitHub Actions Build Fail Hua | `high` (4) | `[GitHub CI] Main branch build failed on commit #a81c2f.` |
| 🤖 **AI / Script** | Long-running Python Script Khatam | `default` (3) | `[ML Model] Training complete. Accuracy 98.4%.` |

---

### 4. Kis Types Ke Projects Me Use Karein?

#### 1. Freelancers & Agency Websites
- **Kyun:** Client ke contact form par koi lead aate hi turant aapke phone aur laptop par ghanti baje, bina Twilio SMS ya SendGrid paid API ke.
- **Setup:** Next.js Server Action ya PHP mailer script me 3 line ka NotifyPush code dalein.

#### 2. E-Commerce & Online Stores (Shopify, WooCommerce, Custom Next.js)
- **Kyun:** Har nayi sale ka instant alert pane ke liye. Notification par click karke direct customer invoice khol sakte hain.
- **Setup:** Stripe/Razorpay payment webhook me `notify.send()` call karein.

#### 3. SaaS & Startup Products
- **Kyun:** New user signup, paid plan upgrade, ya billing failure ko real-time track karne ke liye.
- **Setup:** Apne backend authentication ya billing service me hook karein.

#### 4. DevOps, SysAdmin & Cloud Servers
- **Kyun:** PagerDuty ka costly subscription bachayein. Server crash, high disk usage ya Docker container down hone par emergency phone alert payein.
- **Setup:** Linux cron job ya bash monitoring script me simple `curl` command add karein.

#### 5. Data Science, Scraping & Automation Scripts
- **Kyun:** Jab aap koi 2 ghante ka web scraper ya deep learning training chhod kar jaate hain, toh kaam khatam hote hi phone par ping aa jaye.
- **Setup:** Python script ke aakhri line me `notify.send()` laga dein.

---

### 5. 🗂️ Multi-App Channels Manager Ka Istemal (Mobile & Desktop)

NotifyPush Mobile App aur Desktop App dono me **Multi-App Channels** feature diya gaya hai:

1. **Naya App Add Karein:** App me **"+ Add App"** button dabayein.
2. **App Ka Naam Likhein:** Jaise: `Store Leads`, `Server Prod`, `Personal Blog`.
3. **Dedicated Topic Chunein:** 🎲 button dabakar unguessable topic generate karein (Jaise `store-leads-7821`).
4. **Automatic Sender Tagging:** Jab bhi alert aayega, notification ke title me us app ka naam apne aap lag kar aayega:
   - `[Store Leads] Naya Customer Order`
   - `[Server Prod] CPU High Usage`
5. **🌐 1-Click Code Snippet:** Har channel card par **Code Snippet** button dabakar Next.js, Python, PHP, Go aur cURL ka ready-made code copy karein aur apni website me paste karein!

## 1. NotifyPush Kya Hai aur Yeh Kaise Kaam Karta Hai?

NotifyPush ke do main hisse hain:
1. **Android App (Receiver)**: Yeh aapke mobile me chalta hai. Yeh ek lightweight foreground daemon service use karta hai jo Server-Sent Events (SSE) stream se connect rehti hai. Jab bhi koi message aata hai, phone par turant ring/vibrate ke sath native alert pop ho jata hai.
2. **Sender (Aapka Code / Server)**: Aapki website, Stripe webhook, database, ya GitHub script jo ek simple `HTTP POST` request bhejti hai.

```
[ Aapki Website / Script ]
           │
           │  HTTP POST (JSON / Plaintext)
           ▼
[ ntfy.sh Gateway ya Apna Docker ]
           │
           │  TLS Encrypted SSE Stream (< 500ms)
           ▼
[ NotifyPush Android App ] ──► 🔔 Heads-Up Phone Notification!
```

---

## 2. Firebase/OneSignal Se Behtar Kyun Hai?

| Feature | NotifyPush | Firebase (FCM) | OneSignal / Pusher |
|---|---|---|---|
| **Account / Sign-up** | ❌ Koi account nahi chahiye | ✔️ Google Cloud account zaroori | ✔️ Paid tier / account zaroori |
| **API Keys / Setup** | ⚡ Instant (sirf topic name) | ⏱️ 30+ min (google-services.json) | ⏱️ SDK registration zaroori |
| **Data Privacy** | 🛡️ 100% Zero-Telemetry | ⚠️ Google ke servers par log | ⚠️ Third-party tracking |
| **Self-Hosting** | ✔️ Apne server par Docker chalayein | ❌ Impossible | ❌ Impossible |
| **Latency** | ⚡ < 500ms direct stream | ⏱️ 2s - 30s queue | ⏱️ 1s - 10s |
| **Price** | 🆓 100% Free & Open Source | ⚠️ Free limit ke baad pay | ⚠️ Monthly billing |

---

## 3. Android App Setup (Step-by-Step)

<p align="center">
  <img src="../public/app_icon.svg" alt="NotifyPush Android App Icon" width="96" height="96" />
  <br />
  <sub><b>Official NotifyPush Android App Icon</b></sub>
</p>

### Step 1: App Ko Open Karein
App kholte hi aapko clean modern dashboard dikhega. Agar notification permission maange toh **"Allow Notifications"** par tap karein.

### Step 2: Apna Topic Name Set Karein
1. Configuration card me **Topic Name** field me koi unique naam likhein (Jaise: `sudhir-alerts-9821`).
2. *Tip: Aisa naam chunein jise koi guess na kar sake.*
3. **"Save & Connect"** button par tap karein. Status bar green ho jayega: **"Listening (Active)"**.

### Step 3: QR Code Se 1-Second Setup (Optional)
Agar aap bar-bar type nahi karna chahte:
- App me camera icon par tap karein.
- Apni web console ya screen par generated QR code scan karein — Topic, Server aur Token sab 1 second me auto-fill ho jayenge!

---

## 4. Windows Desktop App (.exe Setup)

<p align="center">
  <img src="../desktop/assets/icon.png" alt="NotifyPush Desktop App Icon" width="80" height="80" />
</p>

NotifyPush ka ek lightweight **Windows Desktop App (.exe)** bhi tayyar hai jo bina kisi installation ke seedha chalta hai:

### Features:
- 🔔 **Native Windows 10/11 Toasts**: Jab bhi alert aayega, screen ke bottom-right me native toast aayegi sound aur direct link ke sath.
- 🔕 **System Tray Background Daemon**: Window close (`✕`) karne par app band nahi hota, balki taskbar ke system tray me chala jata hai aur background me 24/7 listen karta rehta hai.
- 📜 **Local Search & History**: Saare aane wale alerts PC par locally save hote hain, jise aap search ya JSON me export kar sakte hain.

### Kaise Run Karein:
Direct standalone executable run karein:
```text
desktop/dist/NotifyPush-Windows-1.0.1.exe
```
Bus double-click karein, topic name daalein aur **"Connect"** dabayein!

---

## 5. 60 Seconds Quickstart (Sabse Aasan Tareeqa)

Apne computer ka Terminal kholein aur yeh command run karein (yahan `sudhir-alerts-9821` ki jagah apna topic daalein):

```bash
curl -X POST "https://ntfy.sh/sudhir-alerts-9821" \
  -H "Title: Test Alert 🚀" \
  -H "Priority: high" \
  -H "Tags: white_check_mark,bell" \
  -d "NotifyPush setup successfully ho gaya hai!"
```

**Result:** 1 second se bhi kam samay me aapke phone aur Windows desktop dono par notification pop ho jayega!

---

## 6. Code Implementation (Apne Project Mein Kaise Lagayein)

### A. Next.js / Node.js / TypeScript

Humara official `notifypush-client` zero-dependency native fetch use karta hai:

#### Installation:
```bash
# Terminal me run karein:
npm install notifypush-client
# ya
pnpm add notifypush-client
```

#### Code (Next.js App Router: `app/api/checkout/route.ts`):
```typescript
import { notify } from 'notifypush-client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const order = await req.json();

  // Mobile par instant alert bhejein:
  await notify.send({
    topic: "sudhir-alerts-9821", // Aapka topic
    title: "💳 Naya Payment Received!",
    message: `Customer ne Rs. ${order.amount} ka order place kiya.`,
    priority: "high",
    tags: ["moneybag", "tada"],
    clickUrl: `https://myadmin.com/orders/${order.id}`, // Tap karne par link open hoga
    actions: [
      { action: "view", label: "Invoice Dekhein", url: `https://stripe.com/receipt/${order.id}` }
    ]
  });

  return NextResponse.json({ success: true });
}
```

---

### B. Python (FastAPI, Django, Flask)

Python ke liye `notifypush` standard library par bana hai (koi `requests` install karne ki bhi zaroorat nahi):

#### Code (`alert.py`):
```python
from notifypush import notify

# Notification bhejein:
notify.send(
    topic="sudhir-alerts-9821",
    title="🔥 Server CPU High Alert",
    message="Server CPU usage 92% cross kar chuka hai.",
    priority="urgent", # 'min', 'low', 'default', 'high', 'urgent'
    tags=["warning", "fire"],
    click_url="https://grafana.mycompany.com"
)
```

---

### C. PHP (Laravel, Core PHP)

Laravel controller ya Core PHP script me:

```php
use NotifyPush\NotifyPush;

$notify = new NotifyPush(
    serverUrl: 'https://ntfy.sh',
    topic: 'sudhir-alerts-9821'
);

$notify->send(
    title: '📦 Order Shipped',
    message: 'Tracking #DTDC9912 dispatched ho gaya hai.',
    priority: 'high',
    tags: ['truck', 'package']
);
```

---

### D. Go (Golang)

High-performance microservices ke liye:

```go
package main

import (
    "context"
    notifypush "github.com/SudhirDevOps1/notify-push/sdk/go"
)

func main() {
    client := notifypush.NewClient("https://ntfy.sh", "sudhir-alerts-9821", "")
    
    _ = client.Send(
        context.Background(),
        "Microservice Warning",
        "Redis memory buffer 85% full",
        "high",
        []string{"zap"},
        nil,
    )
}
```

---

### E. cURL / Bash / Terminal Scripts

Long-running commands ya backup scripts ke complete hone par alert:

```bash
# Backup script me lagayein:
pg_dump mydb > backup.sql && curl -s -X POST "https://ntfy.sh/sudhir-alerts-9821" \
  -H "Title: Database Backup Completed" \
  -H "Priority: default" \
  -H "Tags: floppy_disk" \
  -d "Postgres backup 1.8GB safely created."
```

---

### F. GitHub Actions (CI/CD Alerts)

Apne `.github/workflows/deploy.yml` me add karein:

```yaml
- name: Send Alert to Phone
  if: failure()
  run: |
    curl -s -X POST "https://ntfy.sh/sudhir-alerts-9821" \
      -H "Title: ❌ CI Build Failed!" \
      -H "Priority: urgent" \
      -H "Tags: x,rotating_light" \
      -d "Branch ${{ github.ref_name }} par build fail ho gaya."
```

---

## 7. Security: Topic Ko Secret & Private Kaise Banayein?

Agar aap public `ntfy.sh` server use kar rahe hain, toh koi bhi aam naam (jaise `test` ya `alerts`) na rakhein kyunki koi bhi usse sun sakta hai.

### Best Practice (Secure Topic Name):
1. **UUID ya Hash use karein**: Jaise `alert-8f92a4e1-2c09-482a`
2. **Access Token lagayein**: ntfy par account banakar token generate karein aur app me `Auth Token` field me daal dein. Fir bina token ke koi message nahi padh sakega.
3. **End-to-End Encryption (E2EE)**: TypeScript SDK me built-in `encryptPayload()` function hai jo AES-256-GCM se data encrypt karta hai.

---

## 8. Self-Hosting (Apna Private Docker Server)

Agar aap kisi third party server par bharosa nahi karna chahte, toh apne VPS par 2 minute me Docker run karein:

```bash
docker run -d \
  --name my-notify-server \
  -p 8080:80 \
  -v /var/cache/ntfy:/var/cache/ntfy \
  -e NTFY_BASE_URL="https://notify.yourdomain.com" \
  binwiederhier/ntfy serve
```

Aur mobile app me **Server URL** me `https://notify.yourdomain.com` set kar dein!

---

## 9. 24/7 Background Notification Delivery (Battery Settings)

Kuch Android brands (Xiaomi, Samsung, OnePlus, Vivo) background apps ko kill kar dete hain battery bachane ke liye.

**NotifyPush ko 24/7 live rakhne ke liye:**
1. App me screen par diye gaye **"Enable 24/7 Background Delivery"** card par tap karein.
2. Battery Optimization me jakar NotifyPush ko **"Unrestricted"** (No restrictions) select karein.
3. Ab phone lock hone par bhi notification bina kisi delay ke aayegi!

---

## 10. Aksar Pooche Jaane Wale Sawal (FAQs)

#### Q1: Kya yeh service hamesha free rahegi?
**Haan!** NotifyPush 100% open-source MIT licensed hai. Public ntfy instance bhi free hai, aur aap apna server bhi bina kisi charge ke chala sakte hain.

#### Q2: Notification aane me kitna time lagta hai?
Lagbhag **150ms se 500ms** (aadhe second se bhi kam), kyunki yeh real-time persistent TLS connection use karta hai.

#### Q3: Kya mera phone restart hone par connection band ho jayega?
**Nahi.** App me `BOOT_COMPLETED` receiver laga hai, phone restart hote hi listener service background me apne aap shuru ho jati hai.

#### Q4: Kya main purani notifications ka backup le sakta hoon?
**Haan.** Top bar me **Export JSON** icon par tap karein, saara history data aapke clipboard me format hokar copy ho jayega.

---

## 🤝 Contribution & License

- **License**: MIT License
- **Author**: [SudhirDevOps1](https://github.com/SudhirDevOps1)
- **Repository**: [https://github.com/SudhirDevOps1/notify-push](https://github.com/SudhirDevOps1/notify-push)

# NotifyPush HTTP API Reference

NotifyPush utilizes standard HTTP POST requests. You do not need any specific library to dispatch messages—any tool capable of making an HTTP call (cURL, fetch, requests, Postman) works instantly.

---

## Endpoint Specification

```http
POST /{topic}
Host: ntfy.sh (or your custom server)
Content-Type: text/plain; charset=utf-8
```

---

## Supported HTTP Headers

| Header | Type | Description | Example |
|---|---|---|---|
| `Title` | String | Bold header line shown on Android heads-up card | `Title: 💳 Payment Succeeded` |
| `Priority` | String / Integer | Urgency level: `1` (`min`), `2` (`low`), `3` (`default`), `4` (`high`), `5` (`urgent`) | `Priority: 4` or `Priority: high` |
| `Tags` | String | Comma-separated emoji names and category tags | `Tags: white_check_mark,moneybag,billing` |
| `Click` | URL | URL that opens when the notification card is tapped | `Click: https://myapp.com/orders/42` |
| `Actions` | String | Interactive action buttons shown beneath the message | `action=view, label=Receipt, url=https://...` |
| `Delay` | Duration | Delay notification delivery | `Delay: 30m` or `Delay: 2h` |
| `Authorization` | String | Bearer token for password-protected topics | `Authorization: Bearer tk_secret123` |

---

## Action Button Syntax

Multiple buttons can be separated by semicolons (`;`):

```http
Actions: action=view, label=View Dashboard, url=https://myapp.com/dash; action=http, label=Acknowledge, url=https://api.myapp.com/ack, method=POST
```

### Supported Action Types:
- `action=view`: Opens a browser or deep-link.
- `action=http`: Sends a background webhook request (GET/POST/PUT) directly from Android without opening the browser.
- `action=broadcast`: Dispatches a local Android `Intent` broadcast to other apps on the device.

---

## Raw HTTP Example

```http
POST /my-server-alerts HTTP/1.1
Host: ntfy.sh
Title: High Memory Consumption
Priority: urgent
Tags: warning,fire
Click: https://grafana.internal/node-1
Content-Type: text/plain; charset=utf-8

Server node-1 RAM reached 94.2% usage. Immediate attention required.
```

---

## 📋 Real-World Payload Recipes (By Project Type)

### 1. E-Commerce: New Order Received
```http
POST /my-store-orders-9921 HTTP/1.1
Host: ntfy.sh
Title: 💳 New Order #8491 Paid ($149.00)
Priority: high
Tags: shopping_bags,credit_card,white_check_mark
Click: https://admin.yourstore.com/orders/8491
Actions: action=view, label=View Order, url=https://admin.yourstore.com/orders/8491; action=view, label=Print Shipping Label, url=https://admin.yourstore.com/orders/8491/label
Content-Type: text/plain; charset=utf-8

Customer: Priya Sharma (Mumbai, IN)
Items: 1x Ultra Wireless ANC Headphones
Payment: Razorpay / UPI (Success)
```

### 2. Agency / Freelancer: Contact Form Lead
```http
POST /agency-leads-4412 HTTP/1.1
Host: ntfy.sh
Title: ✉️ New Project Inquiry
Priority: high
Tags: briefcase,envelope
Click: mailto:rahul@techfirm.io
Actions: action=view, label=Reply via Email, url=mailto:rahul@techfirm.io; action=view, label=Open CRM, url=https://crm.agency.com/leads
Content-Type: text/plain; charset=utf-8

Name: Rahul Verma (CTO, TechFirm)
Budget: $5,000 - $10,000
Message: Need full-stack MVP built in Next.js & Supabase within 6 weeks.
```

### 3. DevOps / SRE: Server Health & Resource Spike
```http
POST /prod-vps-alerts-7712 HTTP/1.1
Host: ntfy.sh
Title: 🔥 High Memory & CPU Warning
Priority: urgent
Tags: warning,fire,rotating_light
Click: https://grafana.internal.infra/d/node-exporter
Actions: action=view, label=Grafana Dashboard, url=https://grafana.internal.infra; action=http, label=Restart API Pod, url=https://ops.internal.infra/restart-api, method=POST
Content-Type: text/plain; charset=utf-8

Node: prod-api-cluster-02
Memory: 94.6% (15.1 GB / 16 GB)
CPU Load: 92.1% across 8 cores
Status: Autoscale limit reached
```

### 4. Security & Audit: Unauthorized SSH Login Attempt
```http
POST /sec-tripwire-1102 HTTP/1.1
Host: ntfy.sh
Title: 🚨 Bastion Host SSH Alert
Priority: urgent
Tags: lock,rotating_light
Click: https://security.internal.infra/ip/185.220.101.4
Content-Type: text/plain; charset=utf-8

Unauthorized root login attempt blocked by Fail2ban.
IP: 185.220.101.4 (Tor Exit Node)
Port: 22 (SSH)
Action: IP banned for 24 hours.
```

### 5. Nightly Cron Job / Database Backup
```http
POST /ops-backups-8821 HTTP/1.1
Host: ntfy.sh
Title: 💾 PostgreSQL Backup Complete
Priority: default
Tags: floppy_disk,white_check_mark
Click: https://dash.cloudflare.com/r2/backups
Content-Type: text/plain; charset=utf-8

Database: production_core
Size: 3.84 GB (Compressed)
Duration: 4m 12s
Destination: Cloudflare R2 (ap-south-1)
Status: Verification checksum matched.
```

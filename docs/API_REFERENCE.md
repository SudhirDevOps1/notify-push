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

---

## 🔒 Zero-Knowledge End-to-End Encryption (E2EE) Specification

NotifyPush supports client-side authenticated encryption using **AES-256-GCM**. When a channel has an E2EE password configured, the sender encrypts the payload before transmission so that the public relay server never accesses plaintext.

### 1. Wire Format Specification
```json
{
  "_e2e": 1,
  "iv": "<Base64 encoded 12-byte random IV>",
  "data": "<Base64 encoded (Ciphertext + 16-byte Authentication Tag)>"
}
```

- **Algorithm**: `AES/GCM/NoPadding` (256-bit key)
- **Key Derivation**: `SHA-256(passphrase)` (produces exact 32 bytes)
- **Initialization Vector (IV)**: 12 bytes cryptographically secure random bytes
- **Authentication Tag**: 16 bytes (128-bit) appended directly to the ciphertext

### 2. HTTP Request Envelope
When sending an encrypted alert:
- **Title Header**: `Title: 🔒 Encrypted Alert`
- **Tags Header**: `Tags: lock`
- **Body**: The JSON envelope string above.

### 3. Sender Code Recipes

#### A. JavaScript / Web Client SDK (`web/notifypush.js`)
```javascript
// Native Web Crypto API (Browser & Node.js 18+)
const notify = new NotifyPush({
  serverUrl: 'https://ntfy.sh',
  topic: 'my-private-topic',
  password: 'my-e2ee-secret-passphrase'
});

await notify.send({
  title: 'Order Confirmed 💳',
  message: 'Order #9021 paid by customer.',
  tags: ['cart', 'moneybag']
});
```

#### B. Python (`cryptography` library)
```python
import base64, json, os, hashlib, requests
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def send_encrypted_alert(topic: str, password: str, title: str, message: str):
    # 1. Derive 256-bit key via SHA-256
    key = hashlib.sha256(password.encode('utf-8')).digest()
    
    # 2. 12-byte random IV
    iv = os.urandom(12)
    
    # 3. Plaintext JSON
    payload = json.dumps({"title": title, "message": message}).encode('utf-8')
    
    # 4. AES-256-GCM encrypt (appends 16-byte tag)
    aesgcm = AESGCM(key)
    ciphertext_and_tag = aesgcm.encrypt(iv, payload, None)
    
    # 5. Envelope
    envelope = json.dumps({
        "_e2e": 1,
        "iv": base64.b64encode(iv).decode('utf-8'),
        "data": base64.b64encode(ciphertext_and_tag).decode('utf-8')
    })
    
    # 6. Dispatch
    requests.post(
        f"https://ntfy.sh/{topic}",
        data=envelope,
        headers={"Title": "🔒 Encrypted Alert", "Tags": "lock"}
    )
```

#### C. Node.js Native (`crypto` module)
```javascript
const crypto = require('crypto');
const https = require('https');

function sendEncryptedAlert(topic, password, title, message) {
  const key = crypto.createHash('sha256').update(password, 'utf8').digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const payload = JSON.stringify({ title, message });
  const ciphertext = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const fullData = Buffer.concat([ciphertext, authTag]);

  const envelope = JSON.stringify({
    _e2e: 1,
    iv: iv.toString('base64'),
    data: fullData.toString('base64')
  });

  const req = https.request(`https://ntfy.sh/${topic}`, {
    method: 'POST',
    headers: {
      'Title': '🔒 Encrypted Alert',
      'Tags': 'lock',
      'Content-Length': Buffer.byteLength(envelope)
    }
  });
  req.write(envelope);
  req.end();
}
```

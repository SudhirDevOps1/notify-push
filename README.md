# 🔔 NotifyPush - Real-Time Push Notification Receiver

**NotifyPush** ek lightweight aur powerful Native Android app hai jisse aap apni **website, backend server, bash script, e-commerce store, ya kisi bhi webhook** se seedhe apne Android phone par instant Push Notifications pa sakte hain — bina kisi paid service ya complex Firebase/FCM setup ke!

---

## 🚀 Ye App Kya-Kya Karega? (Features)

1. **Instant Webhook to Mobile Alert**: Apni website par sirf ek HTTP POST request (cURL, fetch, ya axios) fire karo aur phone ki screen par turant heads-up notification pop ho jayega.
2. **24x7 Background Listener Service**: App band ho ya swipe-kill ho jaye, iski background service hamesha live stream (SSE) se judi rehti hai.
3. **Phone Restart Pe Auto-Start**: Phone restart hone par service automatic restart ho jati hai (`RECEIVE_BOOT_COMPLETED`).
4. **Clickable Links**: Notification me website link (URL) attach kar sakte hain, notification pe tap karte hi user seedhe us page par pahuch jayega.
5. **Priority & Sound Levels**: High/Urgent priority alerts sound aur vibration ke sath screen par popup hote hain.
6. **Complete History Log**: Saare aaye hue alerts local Room Database me save hote hain, jise aap offline bhi read ya clear kar sakte hain.
7. **Free ntfy.sh ya Apna Self-Hosted Server**: Default `https://ntfy.sh` bilkul free hai, ya phir aap apna 100% private self-hosted server bhi link kar sakte hain.

---

## 📱 Kaise Use Karna Hai? (Quick 3-Step Setup)

### Step 1: App Me Secret Topic Set Karo
1. App open karo.
2. **Secret Topic Name** dalein (Jaise: `my-site-orders-9941`).
   > 💡 *Tip: Hamesha unique ya random topic name choose karein (refresh icon dabakar), taaki koi aur aapke alerts na dekh sake.*
3. Agar server default use karna hai toh `https://ntfy.sh` rehne dein.

### Step 2: "Save & Connect" Pe Tap Karo
- Green status bar show karega: **"Connected & Listening"**.
- Notification permission mangne par **Allow / Grant** kar dein taaki screen par alerts dikhein.

### Step 3: Test Karo
- App me hi **"Send Test"** button dabao.
- Ek second ke andar aapke phone ke top bar me notification pop ho jayega!

---

## 🖥️ Server Kaise Host Karein? (Hosting Options)

### Option 1: Zero Setup - Free Public Server (Default)
Aapko kuch bhi host karne ki zarurat nahi hai!
- Server URL: `https://ntfy.sh`
- Ye bilkul free hai aur unlimited messages support karta hai. Bas apna unique topic name rakhein.

---

### Option 2: Apna Private Server Host Karna (Self-Hosted)
Agar aap apna private data kisi public server par nahi bhejna chahte, toh apna khud ka server sirf 2 minute me Docker se host kar sakte hain:

#### VPS (Ubuntu / Debian / DigitalOcean / AWS EC2) par:
```bash
docker run -d \
  --name ntfy \
  --restart unless-stopped \
  -p 80:80 -p 443:443 \
  -v /var/cache/ntfy:/var/cache/ntfy \
  -v /etc/ntfy:/etc/ntfy \
  binwiederhier/ntfy serve \
  --cache-file /var/cache/ntfy/cache.db
```

Host hone ke baad App ke **Server URL** me apna domain daal dein:  
`https://ntfy.yourdomain.com`

---

## 💡 Real-Life Examples (Apni Website / App Se Alert Kaise Bhejein)

Aapko bas ek simple HTTP POST request bhejni hai. Yahan sabse common scenarios ke ready-to-use code snippets diye gaye hain:

---

### Example 1: Website Contact Form / Lead Generation (JavaScript / Frontend)
Jab bhi koi user aapki website par contact form bhare, turant phone par alert paayein:

```javascript
async function sendLeadNotification(name, phone, message) {
  const topic = "my-site-orders-9941"; // Aapka secret topic
  
  await fetch(`https://ntfy.sh/${topic}`, {
    method: "POST",
    headers: {
      "Title": `Naya Lead Aaya: ${name}`,
      "Priority": "high", // urgent, high, default, low
      "Tags": "incoming_envelope,star",
      "Click": "https://mywebsite.com/admin/leads" // Tap karne par ye link khulega
    },
    body: `Phone: ${phone}\nRequirement: ${message}`
  });
}
```

---

### Example 2: E-Commerce Store New Order Alert (Node.js / Express)
Jab bhi koi naya order place kare:

```javascript
const axios = require('axios');

async function notifyNewOrder(order) {
  const topic = "my-site-orders-9941";

  await axios.post(`https://ntfy.sh/${topic}`, 
    `Customer: ${order.customerName}\nAmount: ₹${order.totalAmount}\nItems: ${order.itemCount}`, 
    {
      headers: {
        'Title': `💰 Naya Order Received (#${order.id})`,
        'Priority': 'urgent',
        'Tags': 'tada,moneybag',
        'Click': `https://mywebsite.com/orders/${order.id}`
      }
    }
  );
}
```

---

### Example 3: Server Down / Website Monitoring Alert (Python Script)
Agar aapki website down ho jaye, toh script automatic phone par warning bhejegi:

```python
import requests

def check_website(url):
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            send_alert(f"Website error code: {response.status_code}")
    except Exception as e:
        send_alert(f"Website unreachable! Error: {str(e)}")

def send_alert(error_msg):
    topic = "my-site-orders-9941"
    requests.post(
        f"https://ntfy.sh/{topic}",
        data=f"Immediate action needed!\n{error_msg}".encode("utf-8"),
        headers={
            "Title": "🚨 Server Alert: Website Down!",
            "Priority": "urgent",
            "Tags": "warning,rotating_light",
            "Click": "https://status.mywebsite.com"
        }
    )

# Run every 5 minutes via cron
check_website("https://mywebsite.com")
```

---

### Example 4: Terminal / Bash Script / cURL (Quick Testing)
Terminal se test karne ke liye:

```bash
curl -H "Title: Hello from Terminal" \
     -H "Priority: high" \
     -H "Tags: rocket" \
     -H "Click: https://google.com" \
     -d "Deployment finished successfully in 45 seconds!" \
     https://ntfy.sh/my-site-orders-9941
```

---

### Example 5: WordPress / PHP Form Submission
Apne `functions.php` ya custom PHP form handler me:

```php
<?php
function send_ntfy_alert($name, $email, $msg) {
    $topic = "my-site-orders-9941";
    $url = "https://ntfy.sh/" . $topic;

    $options = [
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: text/plain\r\n" .
                         "Title: Naya Enquiry Form\r\n" .
                         "Priority: high\r\n" .
                         "Tags: speech_balloon\r\n",
            'content' => "Name: $name\nEmail: $email\nMsg: $msg"
        ]
    ];

    $context  = stream_context_create($options);
    file_get_contents($url, false, $context);
}
?>
```

---

### Example 6: GitHub Actions / CI-CD Build Alert
Aapke repo me push ya build pass/fail hone par:

```yaml
- name: Send Notification on Build Failure
  if: failure()
  run: |
    curl -H "Title: ❌ Build Failed on ${{ github.repository }}" \
         -H "Priority: urgent" \
         -H "Tags: x,fire" \
         -H "Click: ${{ github.server_url }}/${{ github.repository }}/actions" \
         -d "Commit by ${{ github.actor }}: ${{ github.event.head_commit.message }}" \
         https://ntfy.sh/my-site-orders-9941
```

---

## 📷 QR Code Scanner se 1-Second Setup

Aapko Topic ya Server URL bar-bar manually type karne ki koi zarurat nahi hai:
1. App me **QR Code icon** par tap karein.
2. Apne computer screen ya web dashboard par QR Code ko scan karein.
3. App automatic:
   - Server URL detect kar lega (agar custom/self-hosted ho).
   - Secret Topic set kar dega.
   - Access Token (agar protected ho) auto-fill kar dega.
   - Aur automatic **Connect & Listen** start kar dega!

---

## 🔒 Next.js / React Apps (Vercel Par Deployed) Se Direct Notification & Privacy

### "Kya meri multiple Next.js / React web apps jo Vercel par hosted hain, unse direct mere app me notification aa sakta hai? Privacy ka kya?"

**Jawab: HAAN, 100% Direct & Private Notification aayega!**

Aapko kisi 3rd party Firebase FCM ya paid service ki zarurat nahi hai. Chahe aapki **5 ya 10 alag-alag web apps** Vercel par hosted hon, sabhi seedhe aapke is NotifyPush Android app par real-time alert bhej sakti hain.

### 🛡️ Privacy Kaise Safe Rehti Hai?
1. **Zero Client Exposure**: Topic name ya tokens ko React frontend me expose karne ke bajaye **Next.js Backend (Server Action ya API Route)** se call kiya jata hai.
2. **Vercel Environment Variables**: Apna secret topic name (e.g. `vcl-admin-8f92a4e1`) Vercel ke `.env` me store karein. Website ke visitors ya browser inspect element me ye kabhi nahi dikhega.
3. **End-to-End Control**: Notification request Vercel Serverless container se ntfy server -> aapke Android phone par aati hai.

---

### 💻 Next.js (App Router) Code Example

#### 1. Vercel me `.env.local` / Environment Variables set karein:
```env
NTFY_SERVER="https://ntfy.sh"
NTFY_TOPIC="my-private-vercel-alerts-9941"
NTFY_TOKEN="" # Optional: agar private token use kar rahe hain
```

#### 2. `app/api/notify/route.ts` (Next.js API Route):
```typescript
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { title, message, clickUrl, appName } = await req.json();

    const server = process.env.NTFY_SERVER || 'https://ntfy.sh';
    const topic = process.env.NTFY_TOPIC;

    if (!topic) {
      return NextResponse.json({ error: 'Topic not configured' }, { status: 500 });
    }

    // Direct HTTP POST to ntfy -> delivers immediately to NotifyPush app
    const res = await fetch(`${server}/${topic}`, {
      method: 'POST',
      headers: {
        'Title': title || `Alert from ${appName || 'Next.js App'}`,
        'Priority': 'high',
        'Tags': 'zap,rocket',
        ...(clickUrl ? { 'Click': clickUrl } : {}),
        ...(process.env.NTFY_TOKEN ? { 'Authorization': `Bearer ${process.env.NTFY_TOKEN}` } : {})
      },
      body: message || 'Naya event trigger hua!'
    });

    return NextResponse.json({ success: res.ok });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### 3. Multiple Web Apps se identify kaise karein?
Aap alag-alag apps se request bhejte waqt header me `Title` ya `Tags` me app ka naam de sakte hain:
- App 1 (e.g. Portfolio): `Title: [Portfolio] New Contact Form Query`
- App 2 (e.g. E-Commerce): `Title: [Store] New Order Received #42`
- App 3 (e.g. SaaS / Auth): `Title: [SaaS] New User Signed Up`

Aapke Android phone par notifications alag-alag titles aur tags ke sath saaf-saaf dikhenge, aur history me bhi time ke sath store rahenge!

---

## 🎛️ Headers Reference Table

Aap HTTP Request ke headers me ye cheezein customize kar sakte hain:

| Header | Example Value | Description |
|---|---|---|
| `Title` | `Naya Order #104` | Notification ka main bold title |
| `Priority` | `urgent` / `5` ya `high` / `4` | Popup/Sound behaviour (`1` = min, `3` = normal, `5` = urgent/heads-up) |
| `Tags` | `warning,bell,package` | Emojis & label tags |
| `Click` | `https://yourwebsite.com/page` | Tap karne par browser me khulne wala URL |
| `Authorization` | `Bearer tk_abc123...` | Optional: Agar private server par token authentication lagaya ho |

---

## 🔋 Android Battery Optimization Setting (Important)

Kayi phones (jaise Xiaomi/MIUI, Realme, OnePlus, Samsung) background apps ko battery bachane ke liye sleep me daal dete hain.

Taaki notifications 1 second me bina delay ke hamesha aate rahein:
1. Phone **Settings** > **Apps** > **NotifyPush** par jayein.
2. **Battery Saver / Background usage** ko **"Unrestricted" / "No Restrictions"** par set karein.
3. Agar phone me **"Auto-start"** permission hai (Xiaomi/Oppo/Vivo), use **Allow** kar dein.

---

## 🛠️ Summary
Aapko kisi bhi 3rd party paid SDK ya play-services ke complex setup ki zarurat nahi hai. Bas ek simple POST request fire karo aur NotifyPush turant real-time notification aapke phone tak deliver kar dega!

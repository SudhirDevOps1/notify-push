# notifypush (Python SDK)

Universal, zero-dependency push notification client for Django, FastAPI, Flask, Celery, and DevOps automation scripts.

---

## Installation

```bash
pip install notifypush
```

---

## 1. Quick Example

```python
from notifypush import notify

notify.send(
    topic="my-alerts-topic",
    title="🚀 Deploy Succeeded",
    message="Production release v2.4.0 active on AWS ECS",
    priority="high",
    tags=["rocket", "white_check_mark"],
    click_url="https://github.com/SudhirDevOps1/notify-push"
)
```

---

## 2. FastAPI Example

```python
from fastapi import FastAPI, BackgroundTasks
from notifypush import notify

app = FastAPI()

def send_alert(email: str):
    notify.send(
        topic="user-registrations",
        title="👤 New User Signed Up",
        message=f"User {email} created an account",
        priority="default",
        tags=["bust_in_silhouette"]
    )

@app.post("/register")
async def register(email: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_alert, email)
    return {"status": "ok"}
```

---

## 3. Celery / Django Background Task Failure Alert

```python
from celery import Celery
from notifypush import notify

app = Celery('tasks', broker='redis://localhost:6379/0')

@app.task(bind=True)
def process_data(self, record_id):
    try:
        # Processing logic...
        pass
    except Exception as exc:
        notify.send(
            topic="celery-failures",
            title="💥 Celery Task Failed",
            message=f"Task {self.request.id} failed: {exc}",
            priority="urgent",
            tags=["boom", "rotating_light"]
        )
        raise exc
```

---

## 4. Priority Levels

| Priority String | Bell Sound / Vibration Behavior on Android |
|---|---|
| `min` | Silent, notification drawer only, no sound |
| `low` | Quiet sound, no pop-up |
| `default` | Standard notification sound + vibration |
| `high` | Heads-up banner, sound, vibration |
| `urgent` | Critical heads-up banner, high priority vibration, bypasses DND if configured |

---

## 5. Zero-Knowledge E2EE (AES-256-GCM) with Python

When your NotifyPush channel has an E2EE password configured, encrypt the payload before dispatching:

```python
import base64, json, os, hashlib, requests
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def send_encrypted(topic: str, password: str, title: str, message: str):
    key = hashlib.sha256(password.encode('utf-8')).digest()
    iv = os.urandom(12)
    payload = json.dumps({"title": title, "message": message}).encode('utf-8')
    ciphertext_and_tag = AESGCM(key).encrypt(iv, payload, None)
    
    envelope = json.dumps({
        "_e2e": 1,
        "iv": base64.b64encode(iv).decode('utf-8'),
        "data": base64.b64encode(ciphertext_and_tag).decode('utf-8')
    })
    
    requests.post(
        f"https://ntfy.sh/{topic}",
        data=envelope,
        headers={"Title": "🔒 Encrypted Alert", "Tags": "lock"}
    )
```

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

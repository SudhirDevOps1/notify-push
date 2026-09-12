# notifypush (Python SDK)

> Universal, zero-dependency push notification client for Django, FastAPI, Flask, Celery, and DevOps automation scripts.

## Installation

```bash
pip install notifypush
```

## Quick Start

### 1. Basic Usage
```python
from notifypush import notify

notify.send(
    title="🚀 Deploy Completed",
    message="Build #1402 finished in 28s with 0 errors",
    priority="high",
    tags=["rocket", "white_check_mark"],
    click_url="https://github.com/SudhirDevOps1/notify-push"
)
```

### 2. Custom Client Instance
```python
from notifypush import NotifyPush

client = NotifyPush(
    server_url="https://ntfy.sh",
    topic="my-secret-topic-9921",
    token="optional_bearer_token"
)

client.send(
    title="Database Backup",
    message="PostgreSQL dump uploaded to S3 (2.4 GB)",
    priority="default",
    tags=["floppy_disk"]
)
```

---

## 💡 Practical Real-World Blueprints

### Blueprint 1: FastAPI Global Exception Handler
```python
from fastapi import FastAPI, Request
from notifypush import notify

app = FastAPI()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    notify.send(
        topic="backend-errors-9901",
        title="🚨 Production 500 Error",
        message=f"Endpoint {request.method} {request.url.path} failed: {str(exc)[:120]}",
        priority="urgent",
        tags=["fire", "warning"],
        click_url="https://sentry.internal.infra"
    )
    return {"error": "Internal Server Error"}
```

### Blueprint 2: ML Model Training Completion Notification
```python
from notifypush import notify
import time

def train_model():
    print("Training neural network...")
    time.sleep(10) # Simulate training
    val_accuracy = 0.984

    # Notify phone & desktop workstation immediately
    notify.send(
        topic="ml-training-alerts-4412",
        title="🤖 Model Training Complete",
        message=f"PyTorch Epoch 100/100 finished.\nValidation Accuracy: {val_accuracy * 100:.2f}%",
        priority="default",
        tags=["robot", "white_check_mark"],
        actions=[
            {"action": "view", "label": "View WandB Dashboard", "url": "https://wandb.ai/my-project"}
        ]
    )

if __name__ == "__main__":
    train_model()
```

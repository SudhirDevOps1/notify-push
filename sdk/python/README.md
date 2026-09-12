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

import os
import json
import urllib.request
import urllib.error
from typing import List, Dict, Optional, Any

class NotifyPush:
    def __init__(
        self,
        server_url: Optional[str] = None,
        topic: Optional[str] = None,
        token: Optional[str] = None,
        default_timeout: float = 4.0
    ):
        self.server_url = (server_url or os.getenv("NOTIFY_SERVER") or os.getenv("NTFY_SERVER") or "https://ntfy.sh").rstrip("/")
        self.topic = topic or os.getenv("NOTIFY_TOPIC") or os.getenv("NTFY_TOPIC") or ""
        self.token = token or os.getenv("NOTIFY_TOKEN") or os.getenv("NTFY_TOKEN")
        self.default_timeout = default_timeout

    def send(
        self,
        title: str,
        message: str,
        priority: str = "default",  # min, low, default, high, urgent
        tags: Optional[List[str]] = None,
        click_url: Optional[str] = None,
        actions: Optional[List[Dict[str, str]]] = None,
        topic: Optional[str] = None,
        server_url: Optional[str] = None,
        token: Optional[str] = None,
        timeout: Optional[float] = None
    ) -> bool:
        target_topic = topic or self.topic
        if not target_topic:
            print("[NotifyPush] Warning: Send failed, no topic specified.")
            return False

        target_server = (server_url or self.server_url).rstrip("/")
        auth_token = token or self.token
        call_timeout = timeout or self.default_timeout

        url = f"{target_server}/{target_topic}"
        req = urllib.request.Request(url, data=message.encode("utf-8"), method="POST")
        req.add_header("Title", title)
        req.add_header("Priority", priority)
        req.add_header("Content-Type", "text/plain; charset=utf-8")

        if auth_token:
            req.add_header("Authorization", f"Bearer {auth_token}")
        if tags:
            req.add_header("Tags", ",".join(tags))
        if click_url:
            req.add_header("Click", click_url)

        if actions:
            action_strs = []
            for act in actions:
                parts = [f"{k}={v}" for k, v in act.items()]
                action_strs.append(", ".join(parts))
            req.add_header("Actions", "; ".join(action_strs))

        try:
            with urllib.request.urlopen(req, timeout=call_timeout) as resp:
                return 200 <= resp.status < 300
        except Exception as e:
            # Graceful failure: prevents crash in calling scripts
            print(f"[NotifyPush] Notification dispatch exception caught: {e}")
            return False

# Default singleton instance
notify = NotifyPush()

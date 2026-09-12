# NotifyPush Enterprise Ecosystem: Architecture, SDKs & Security Specification

> **Privacy-First, Zero-Telemetry, Self-Hosted & E2EE Push Notification Infrastructure**

---

## Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                           APPLICATION SOURCES                                     |
|  [Next.js / React]   [Node / Express]   [Python / FastAPI]   [PHP / Laravel]       |
|  [Go Microservice]   [DevOps / CI-CD]   [Stripe / Webhook]   [Neon Postgres DB]   |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
                    +-----------------------------------+
                    |   NotifyPush Universal SDK /      |
                    |   Transactional Outbox Engine     |
                    |   (AES-256-GCM E2EE + HMAC Topic) |
                    +-----------------+-----------------+
                                      |
                                HTTPS POST
                                      v
                    +-----------------------------------+
                    |   Nginx Reverse Proxy / WAF       |
                    |   - Rate Limiting (10 req/s IP)   |
                    |   - Bearer Token Validation       |
                    |   - SSL Pinning / TLS 1.3         |
                    +-----------------+-----------------+
                                      |
                                      v
                    +-----------------------------------+
                    |   ntfy Server (Cloud or Docker)   |
                    |   - Zero Log Retention            |
                    |   - Ephemeral Memory Buffer       |
                    +-----------------+-----------------+
                                      |
                           SSE Stream / WebSocket
                                      |
                                      v
                    +-----------------------------------+
                    |   NotifyPush Android Device       |
                    |   - 24/7 Foreground Daemon        |
                    |   - Local Room DB (Encrypted)     |
                    |   - Hardware Keystore Decryption  |
                    |   - Interactive Action Buttons    |
                    +-----------------+-----------------+
```

---

## Architectural Principles

1. **Decoupled Asynchronous Delivery**: The dispatching application never blocks on mobile receipt. Dispatches complete in < 50ms over standard HTTP POST.
2. **Zero Central Telemetry**: Payloads are never stored in a multi-tenant cloud database. Message history exists solely inside the device's local encrypted Room SQLite storage.
3. **Resilient Daemon Service**: The Android client operates a persistent Foreground Service with an ongoing notification channel and automatic exponential backoff reconnection.
4. **Zero-Knowledge Security**: With client-side AES-256-GCM encryption enabled, even an intermediate gateway operator cannot view the contents of notification payloads.

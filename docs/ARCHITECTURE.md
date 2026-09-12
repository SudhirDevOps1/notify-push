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

---

## 🗂️ Multi-App Channel Multiplexing Architecture

NotifyPush supports client-side multi-application multiplexing across both the Android Mobile client and the Windows Desktop client.

```
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│  App 1: E-Commerce Web  │   │   App 2: VPS Monitor    │   │  App 3: Portfolio Leads │
│  Topic: shop-order-991  │   │  Topic: vps-alerts-421  │   │  Topic: lead-inq-771    │
└────────────┬────────────┘   └────────────┬────────────┘   └────────────┬────────────┘
             │                             │                             │
             └──────────────────────┬──────┴─────────────────────────────┘
                                    │ HTTP POST
                                    ▼
                     ┌─────────────────────────────┐
                     │ ntfy Gateway / Proxy Server │
                     └──────────────┬──────────────┘
                                    │ TLS SSE Multiplexed Stream
             ┌──────────────────────┴────────────────────────────┐
             ▼                                                   ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│ NotifyPush Android Client     │               │ NotifyPush Windows Desktop    │
│ - ChannelApp Storage Engine   │               │ - App Channels Config Store   │
│ - Origin Prefix: [Shopify]    │               │ - Origin Prefix: [Shopify]    │
│ - Dedicated Action Buttons    │               │ - System Tray Resident        │
└───────────────────────────────┘               └───────────────────────────────┘
```

### Channel Isolation & Tagging Principles:
1. **Zero Cross-Talk**: Each registered application uses an isolated topic and can optionally use distinct servers or authentication tokens.
2. **Deterministic Origin Identification**: Alerts are rendered with explicit visual tagging of the sender application (`[AppName] Alert Title`), preventing alert fatigue or source ambiguity.
3. **Embedded Integration Generator**: Direct export of ready-to-run SDK client instantiation code directly from both mobile and desktop UI for zero-friction developer onboarding.

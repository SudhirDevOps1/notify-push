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

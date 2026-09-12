# 💻 NotifyPush Desktop (Windows .exe)

<p align="center">
  <img src="assets/icon.png" width="96" height="96" alt="NotifyPush Desktop Icon" />
</p>

<p align="center">
  <b>Lightweight, 24/7 Background Push Notification Receiver for Windows</b>
</p>

---

## ⚡ Features

- 🔔 **Native Windows 10/11 Toast Notifications**: Rich alerts with titles, priority levels, clickable action buttons, and direct URL handling.
- 🔒 **Zero-Knowledge End-to-End Encryption (AES-256-GCM)**: Native on-the-fly decryption for incoming encrypted alerts using channel passphrases. The public server sees zero plaintext.
- 📷 **Built-in Channel QR Code Generator**: Generate shareable QR codes for any channel that can be scanned instantly with the Android mobile app camera to import topic and E2EE keys.
- 🛡️ **Rapid Alert Flood Throttling**: Intelligent debounce filter groups repeating alerts from the same channel within 15 seconds, preventing Windows toast notification storms.
- 🔕 **24/7 Background System Tray Daemon**: Minimizes to system tray on close (`✕`). Stays active in the background with zero lag and near-zero memory footprint.
- 📡 **Real-time Multi-Channel SSE Stream**: Direct, low-latency Server-Sent Events listener connected to `ntfy.sh` or your private self-hosted Docker server.
- 📜 **Local Persistent History**: Stores received notifications locally in `%APPDATA%/NotifyPush/history.json` with search and JSON export.
- 🎨 **Material 3 Dark UI**: Beautiful modern dark UI matching the Android mobile application aesthetic.
- 🔒 **Single Instance Lock**: Ensures only one instance runs at any time, avoiding duplicate notifications.

---

## 🗂️ Multi-App Channels Manager

The NotifyPush Desktop application provides a built-in **Multi-App Channels Manager** that lets you monitor notifications across all your different websites, backend servers, and automation jobs simultaneously:

- ➕ **Add Distinct Apps**: Manage separate channels for `E-Commerce Orders`, `DevOps VPS`, `Client Leads`, etc.
- 🔐 **Optional E2EE Passphrase**: Add an optional encryption passphrase to any app. Messages sent to this channel will be encrypted with AES-256-GCM on the sender side and decrypted locally on your PC.
- 📷 **Instant QR Code Sharing**: Click **QR** on any app card to view or download a QR code. Scanning it with NotifyPush Mobile instantly syncs the app name, topic, and E2EE password.
- 🎲 **Unguessable Topic Generator**: One-click high-entropy random topic generator ensures maximum privacy.
- 🏷️ **Origin Tagging**: Native Windows toasts automatically tag the alert title with the originating app: `[AppName] Title` (or `🔒 [AppName] Title` for encrypted alerts).
- 🌐 **Ready-Made Code Modal**: Click the code icon on any app to view and copy instant integration snippets for **Web SDK (Vanilla/React/Next.js)**, **Node/TypeScript**, **Python**, **PHP**, **Go**, and **cURL**—with your E2EE key pre-filled.
- 🔔 **Instant Test Ping**: Send live test alerts directly from the UI to verify sound, toast notifications, and E2EE decryption.
- 🗑️ **Safe Channel Deletion**: Remove inactive channels with one click.

---

## 💡 Desktop Use Cases (Where & Why to Use on Windows)

1. **Full-Stack Developers & Engineers:**
   - Keep NotifyPush running minimized in the Windows System Tray while coding in VS Code / IDE.
   - Receive immediate notification when GitHub Actions CI/CD finishes building or when a unit test fails in production.
2. **E-Commerce Store Owners & Founders:**
   - Get native Windows 10/11 toast alerts with sound whenever a customer completes a purchase on Shopify/WooCommerce/Stripe.
   - Click the action button on the toast to open the order receipt directly in your default browser.
3. **DevOps & SysAdmins:**
   - Monitor remote Linux VPS health, memory spikes, and failed SSH attempts directly on your dual-monitor workstation.

## 🚀 Running the App

### Option 1: Standalone Portable Binary (No Installation Required)
Download or run the single-file executable directly:
```text
desktop/dist/NotifyPush-Windows-1.0.1.exe
```
Just double-click to launch! It immediately connects to your configured topic and lives quietly in your Windows taskbar tray.

---

## 🛠️ Development & Building from Source

### Prerequisites
- Node.js 18+ & npm

### Setup
```bash
cd desktop
npm install
```

### Run in Development
```bash
npm start
```

### Build Windows Executable (.exe)
```bash
# Build standalone portable single-file executable
npm run build:portable

# Or build unpacked directory
npm run build:dir
```
Outputs are generated into the `desktop/dist/` directory.

---

## ⚙️ Configuration

Settings are saved automatically in:
- Windows: `%APPDATA%\NotifyPush\config.json`

Configurable options:
- **Topic**: Your private channel name (e.g., `my-private-alerts-9901`)
- **Server**: Gateway URL (`https://ntfy.sh` or custom self-hosted domain)
- **Sound Alerts**: Toggle native audio alerts on or off
- **Start Minimized**: Launch directly to system tray on boot

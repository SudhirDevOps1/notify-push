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
- 🔕 **24/7 Background System Tray Daemon**: Minimizes to system tray on close (`✕`). Stays active in the background with zero lag and near-zero memory footprint.
- 📡 **Real-time SSE Stream**: Direct, low-latency Server-Sent Events listener connected to `ntfy.sh` or your private self-hosted Docker server.
- 📜 **Local Persistent History**: Stores received notifications locally in `%APPDATA%/NotifyPush/history.json` with search and JSON export.
- 🎨 **Material 3 Dark UI**: Beautiful modern dark UI matching the Android mobile application aesthetic.
- 🔒 **Single Instance Lock**: Ensures only one instance runs at any time, avoiding duplicate notifications.

---

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

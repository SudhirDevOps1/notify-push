# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in NotifyPush:
1. Do **NOT** open a public issue on GitHub.
2. Report it privately via [GitHub Security Advisories](https://github.com/SudhirDevOps1/notify-push/security/advisories).
3. Provide reproducible steps and attack vector description.
4. We aim to acknowledge and patch verified vulnerabilities within 48 hours.

## Architecture Security Principles

### 1. Zero-Knowledge End-to-End Encryption (AES-256-GCM)
NotifyPush implements client-side authenticated encryption using standard **AES-256-GCM** with 128-bit authentication tags and 12-byte cryptographically secure random IVs:
- **Key Derivation**: 256-bit AES keys are derived deterministically using `SHA-256(passphrase)`.
- **Zero Plaintext at Rest & in Transit**: The public relay server (`ntfy.sh` or your self-hosted instance) only receives an encrypted envelope:
  ```json
  {"_e2e":1,"iv":"<base64 12 bytes>","data":"<base64 ciphertext + 16-byte tag>"}
  ```
- **Integrity & Authenticity**: Tampering or corrupted payloads fail GCM authentication immediately, resulting in a safe rejection without crashing or leaking plaintext.
- **Header Obfuscation**: The notification title sent across the network is masked as `Title: 🔒 Encrypted Alert`, and tags are masked as `Tags: lock`. True metadata is decrypted solely inside the recipient app.

### 2. No Cloud Intermediaries or Telemetry
- The Android mobile application and Windows desktop client communicate directly with the designated SSE streaming endpoint over TLS 1.3.
- No analytics SDKs, advertising trackers, or telemetry beacons are present in the codebase.

### 3. Android Keystore & Encrypted Preferences
- Channel configuration and local passphrases are stored on Android using `EncryptedSharedPreferences` backed by the hardware-isolated Android Keystore.
- Passwords are never written to unencrypted logs (`Logcat`) or shared with third-party applications.

### 4. Windows Desktop Isolation
- The desktop Electron process operates with `nodeIntegration: false` and `contextIsolation: true` in the renderer window, communicating through a strictly validated preload IPC interface.
- App configurations and history are persisted locally in `%APPDATA%\NotifyPush\`.

### 5. HMAC Topic Obfuscation
- We strongly recommend using high-entropy random topic IDs (generated via the in-app dice icon) or HMAC-SHA256 derived topics to prevent uninvited eavesdroppers from subscribing to public topics.

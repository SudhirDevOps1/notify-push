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
- **No Cloud Intermediary**: Android app connects directly to the user-configured ntfy gateway (Self-hosted or ntfy.sh).
- **HMAC Topic Obfuscation**: Derive channels using HMAC-SHA256 to prevent topic enumeration.
- **Hardware Keystore**: Encryption keys and preferences are stored locally using Android Keystore and EncryptedSharedPreferences.

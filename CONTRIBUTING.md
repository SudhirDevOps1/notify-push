# Contributing to NotifyPush
Thank you for your interest in contributing to **NotifyPush**! We welcome bug reports, feature proposals, and pull requests.

## Development Setup

### Android App
1. Clone the repository:
   ```bash
   git clone https://github.com/SudhirDevOps1/notify-push.git
   cd notify-push
   ```
2. Open in Android Studio (Jellyfish / Koala or newer).
3. Build the project:
   ```bash
   ./gradlew assembleDebug
   ```
4. Run Unit Tests:
   ```bash
   ./gradlew testDebugUnitTest
   ```

### Multi-Platform SDKs
The client libraries live under `/sdk`:
- `sdk/typescript`: Universal JS/TS SDK
- `sdk/python`: Python client package
- `sdk/php`: PHP Composer package
- `sdk/go`: Go module
- `sdk/cli`: CLI script & GitHub Action

## Guidelines
- **Zero-Telemetry Policy**: We strictly reject any telemetry, tracking, or ad SDK additions.
- **Privacy-First**: No personal device data or push message payloads must ever leave the user's chosen server.
- **Backwards Compatibility**: Ensure notification schema changes do not break existing Android Room migrations.

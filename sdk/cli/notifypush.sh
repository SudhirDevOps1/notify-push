#!/usr/bin/env bash
# NotifyPush CLI & Shell Helper
set -euo pipefail

NOTIFY_SERVER="${NOTIFY_SERVER:-https://ntfy.sh}"
NOTIFY_TOPIC="${NOTIFY_TOPIC:-}"
NOTIFY_TOKEN="${NOTIFY_TOKEN:-}"

notify_send() {
  local title="${1:-Alert}"
  local message="${2:-No message body provided}"
  local priority="${3:-default}"
  local tags="${4:-bell}"
  local click="${5:-}"

  if [[ -z "$NOTIFY_TOPIC" ]]; then
    echo "[NotifyPush Warning] NOTIFY_TOPIC environment variable not set. Aborting." >&2
    return 1
  fi

  local auth_args=()
  if [[ -n "$NOTIFY_TOKEN" ]]; then
    auth_args=(-H "Authorization: Bearer ${NOTIFY_TOKEN}")
  fi

  local click_args=()
  if [[ -n "$click" ]]; then
    click_args=(-H "Click: ${click}")
  fi

  curl -s -m 5 -X POST "${NOTIFY_SERVER}/${NOTIFY_TOPIC}" \
    -H "Title: ${title}" \
    -H "Priority: ${priority}" \
    -H "Tags: ${tags}" \
    "${auth_args[@]}" \
    "${click_args[@]}" \
    -d "${message}" > /dev/null || {
      echo "[NotifyPush] Warning: Failed to send alert." >&2
      return 0
    }
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <title> <message> [priority] [tags] [clickUrl]"
    exit 1
  fi
  notify_send "$@"
fi

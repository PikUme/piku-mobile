#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FLOW_DIR="${MAESTRO_FLOW_DIR:-$ROOT_DIR/.maestro/required}"
APP_ID="${MAESTRO_APP_ID:-com.pikume.mobile}"

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

if command -v maestro >/dev/null 2>&1; then
  MAESTRO_BIN="$(command -v maestro)"
else
  fail "Maestro CLI를 찾을 수 없습니다. 현재는 Maestro Studio만 설치된 것으로 보입니다. 공식 문서 기준으로 CLI를 추가 설치한 뒤 다시 실행해 주세요."
fi

if [ ! -d "$FLOW_DIR" ]; then
  fail "Maestro smoke flow 디렉터리가 없습니다: $FLOW_DIR"
fi

FLOWS="$(find "$FLOW_DIR" -maxdepth 1 -type f -name '*.yaml' | sort)"

if [ -z "$FLOWS" ]; then
  fail "실행할 Maestro smoke flow가 없습니다. $FLOW_DIR 아래에 YAML flow를 추가해 주세요."
fi

if [[ "$(uname -s)" == "Darwin" ]] && xcrun simctl list devices booted 2>/dev/null | grep -q '(Booted)'; then
  if ! xcrun simctl get_app_container booted "$APP_ID" app >/dev/null 2>&1; then
    fail "부팅된 iOS 시뮬레이터에 앱($APP_ID)이 설치되어 있지 않습니다. Expo Go가 아니라 앱 자체를 설치해야 하므로 먼저 'npm run ios:dev'를 실행해 주세요."
  fi
fi

printf '%s\n' "$FLOWS" | while IFS= read -r flow; do
  [ -n "$flow" ] || continue
  printf '\n[maestro] running %s\n' "$flow"
  "$MAESTRO_BIN" test "$flow"
done

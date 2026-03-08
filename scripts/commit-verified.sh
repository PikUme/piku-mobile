#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

MESSAGE=""
EXTRA_ARGS=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    -m|--message)
      [ "$#" -ge 2 ] || fail "커밋 메시지가 비어 있습니다."
      MESSAGE="$2"
      shift 2
      ;;
    *)
      EXTRA_ARGS+=("$1")
      shift
      ;;
  esac
done

[ -n "$MESSAGE" ] || fail "사용법: npm run commit:verified -- -m \"type: message\""

cd "$ROOT_DIR"

if git diff --cached --quiet; then
  fail "staged 변경사항이 없습니다. 먼저 'git add ...'로 커밋 대상을 스테이징해 주세요."
fi

npm run verify:feature
git commit -m "$MESSAGE" "${EXTRA_ARGS[@]}"

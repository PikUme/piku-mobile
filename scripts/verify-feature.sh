#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

printf '\n[verify] 1/2 Jest logic tests\n'
npm run test:logic

printf '\n[verify] 2/2 Maestro smoke tests\n'
npm run test:e2e:smoke

printf '\n[verify] feature verification passed\n'

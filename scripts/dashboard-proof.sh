#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${ROOT_DIR}/output/playwright"
SESSION_NAME="${PLAYWRIGHT_CLI_SESSION:-proof}"
URL="${1:-${DASHBOARD_PROOF_URL:-http://127.0.0.1:4332/#agents}}"
BASE_URL="$(
  python3 - "${URL}" <<'PY'
import sys
from urllib.parse import urlsplit

parts = urlsplit(sys.argv[1])
if not parts.scheme or not parts.netloc:
    raise SystemExit(f"Invalid dashboard URL: {sys.argv[1]}")
print(f"{parts.scheme}://{parts.netloc}")
PY
)"

cd "${ROOT_DIR}"
mkdir -p "${OUTPUT_DIR}"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required for dashboard proof" >&2
  exit 1
fi

CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="${CODEX_HOME}/skills/playwright/scripts/playwright_cli.sh"

run_pwcli() {
  if [[ -x "${PWCLI}" ]]; then
    "${PWCLI}" --session "${SESSION_NAME}" "$@"
  else
    npx --yes --package @playwright/cli playwright-cli --session "${SESSION_NAME}" "$@"
  fi
}

extract_result() {
  awk '/^### Result$/{getline; print; exit}'
}

extract_markdown_target() {
  sed -n 's/.*](\(.*\)).*/\1/p' | head -n 1
}

capture_screenshot() {
  local dest="$1"
  local rel
  rel="$(run_pwcli screenshot | extract_markdown_target)"
  if [[ -z "${rel}" ]]; then
    echo "Failed to capture screenshot for ${dest}" >&2
    exit 1
  fi
  cp "${ROOT_DIR}/${rel}" "${dest}"
}

cleanup() {
  run_pwcli close >/dev/null 2>&1 || true
}

trap cleanup EXIT

run_pwcli close >/dev/null 2>&1 || true

HEALTH_JSON="$(curl -fsS "${BASE_URL}/api/health")"
API_VERSION="$(
  printf '%s' "${HEALTH_JSON}" \
    | python3 -c 'import json,sys; print(json.load(sys.stdin)["version"])'
)"

echo "Opening ${URL} with session ${SESSION_NAME}"
run_pwcli open "${URL}" >/dev/null
run_pwcli snapshot >/dev/null

SIDEBAR_VERSION="$(
  run_pwcli eval "document.querySelector('.sidebar .version')?.textContent" \
    | extract_result \
    | tr -d '"'
)"

if [[ "${SIDEBAR_VERSION}" != *"v${API_VERSION}"* ]]; then
  echo "Version badge mismatch: expected v${API_VERSION}, got ${SIDEBAR_VERSION}" >&2
  exit 1
fi

capture_screenshot "${OUTPUT_DIR}/dashboard-shell-proof.png"

PROOF_BOOTSTRAP_OK="$(
  run_pwcli eval "(window.__proofRoot = document.querySelector('[x-data=\"agentsPage\"]'), window.__proofRoot && window.__proofRoot._x_dataStack ? (window.ClawReformAPI && !window.__clawProofPatched ? (window.__clawProofPatched = true, window.__clawProofOriginalGet = window.ClawReformAPI.get.bind(window.ClawReformAPI), window.ClawReformAPI.get = async function(path) { if (typeof path === 'string' && path.includes('/api/agents/proof-agent/session')) return { messages: [] }; if (typeof path === 'string' && path.includes('/api/agents/proof-agent/sessions')) return { sessions: [] }; return window.__clawProofOriginalGet(path); }) : true, window.__proofRoot._x_dataStack[0].activeChatAgent = { id: 'proof-agent', name: 'proof-agent', model_provider: 'proof', model_name: 'proof-model' }, true) : false)" | extract_result
)"

if [[ "${PROOF_BOOTSTRAP_OK}" != "true" ]]; then
  echo "Failed to mount proof chat view" >&2
  exit 1
fi

sleep 1
run_pwcli snapshot >/dev/null

REASONING_RENDERED="$(
  run_pwcli eval "(window.__chatRoot = document.querySelector('.chat-wrapper'), window.__chatRoot && window.__chatRoot._x_dataStack ? (window.__chatRoot._x_dataStack[0].currentAgent = { id: 'proof-agent', name: 'proof-agent', model_provider: 'proof', model_name: 'proof-model' }, true) : false)" >/dev/null
  sleep 1
  run_pwcli eval "(window.__chatRoot = document.querySelector('.chat-wrapper'), window.__chatRoot && window.__chatRoot._x_dataStack ? (window.__chatRoot._x_dataStack[0].messages = [window.__chatRoot._x_dataStack[0].normalizeMessage({ id: 9001, role: 'agent', text: '<think>Map the system before acting.</think>Dispatches become ledger candidates only after ratification.', meta: '', tools: [], ts: new Date().toISOString() })], true) : false)" >/dev/null
  sleep 1
  run_pwcli eval "!!document.querySelector('.message-reasoning')" | extract_result
)"

if [[ "${REASONING_RENDERED}" != "true" ]]; then
  echo "Reasoning panel did not render" >&2
  exit 1
fi

run_pwcli snapshot >/dev/null

REASONING_SUMMARY="$(
  run_pwcli eval "document.querySelector('.message-reasoning summary')?.textContent?.trim()" \
    | extract_result \
    | tr -d '"'
)"

if [[ "${REASONING_SUMMARY}" != "Reasoning" ]]; then
  echo "Unexpected reasoning summary label: ${REASONING_SUMMARY}" >&2
  exit 1
fi

REASONING_ANSWER="$(
  run_pwcli eval "document.querySelector('.message-reasoning-answer')?.textContent?.trim()" \
    | extract_result \
    | tr -d '"'
)"

if [[ "${REASONING_ANSWER}" != *"Dispatches become ledger candidates only after ratification."* ]]; then
  echo "Reasoning answer block missing expected visible text" >&2
  exit 1
fi

REASONING_STATE_OK="$(
  run_pwcli eval "(window.__proofMsg = document.querySelector('.chat-wrapper')._x_dataStack[0].messages[0], !!(window.__proofMsg && window.__proofMsg.copyText.includes('<think>Map the system before acting.</think>') && window.__proofMsg.searchText.includes('Map the system before acting.') && window.__proofMsg.searchText.includes('Dispatches become ledger candidates only after ratification.')))" | extract_result
)"

if [[ "${REASONING_STATE_OK}" != "true" ]]; then
  echo "Reasoning state did not preserve copy/search invariants" >&2
  exit 1
fi

FOCUS_ENABLED="$(
  run_pwcli eval "(document.querySelector('button[title=\"Ctrl+Shift+F\"]')?.click(), true)" >/dev/null
  sleep 1
  run_pwcli eval "document.querySelector('.app-layout')?.classList.contains('focus-mode')" \
    | extract_result
)"

if [[ "${FOCUS_ENABLED}" != "true" ]]; then
  echo "Focus mode did not enable during proof" >&2
  exit 1
fi

SCREENSHOT_DST="${OUTPUT_DIR}/dashboard-proof.png"
capture_screenshot "${SCREENSHOT_DST}"

CONSOLE_REL="$(
  run_pwcli console \
    | extract_markdown_target
)"

if [[ -z "${CONSOLE_REL}" ]]; then
  echo "Failed to capture console log" >&2
  exit 1
fi

CONSOLE_SRC="${ROOT_DIR}/${CONSOLE_REL}"
CONSOLE_DST="${OUTPUT_DIR}/dashboard-proof-console.log"
cp "${CONSOLE_SRC}" "${CONSOLE_DST}"

if ! grep -q 'Errors: 0' "${CONSOLE_DST}" || ! grep -q 'Warnings: 0' "${CONSOLE_DST}"; then
  echo "Console proof failed; see ${CONSOLE_DST}" >&2
  exit 1
fi

printf 'Dashboard proof ok\n'
printf 'Version: %s\n' "${SIDEBAR_VERSION}"
printf 'Reasoning: ok\n'
printf 'Shell screenshot: %s\n' "${OUTPUT_DIR}/dashboard-shell-proof.png"
printf 'Screenshot: %s\n' "${SCREENSHOT_DST}"
printf 'Console: %s\n' "${CONSOLE_DST}"

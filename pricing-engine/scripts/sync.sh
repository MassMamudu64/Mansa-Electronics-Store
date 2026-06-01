#!/usr/bin/env bash
# =============================================================================
# Trigger a wholesale-listing sync against the FastAPI pricing engine.
# Intended for cron / scheduler use (GitHub Actions, Render Cron Job,
# Railway Cron, systemd timer, etc.).
#
# Required env:
#   PRICING_API_URL   Base URL of the FastAPI service (no trailing slash).
#   PRICING_API_KEY   Bearer token matching the service's PRICING_API_KEY.
#
# Optional env:
#   SYNC_TIMEOUT      curl --max-time in seconds. Default 180.
#
# Exit codes:
#   0   sync succeeded (FastAPI returned 200 + JSON SyncSummary).
#   1   missing / bad env.
#   2   curl request failed (network, timeout, non-2xx HTTP).
# =============================================================================
set -euo pipefail

: "${PRICING_API_URL:?PRICING_API_URL is required}"
: "${PRICING_API_KEY:?PRICING_API_KEY is required}"

TIMEOUT="${SYNC_TIMEOUT:-180}"
URL="${PRICING_API_URL%/}/sync"

echo "[sync.sh] POST ${URL}"

# -f       : fail (exit non-zero) on HTTP errors
# -sS      : silent but show errors
# --max-time: cap end-to-end duration
# We tee the JSON response to stdout so the cron host's log shipper sees it.
if ! curl -fsS \
      --max-time "${TIMEOUT}" \
      -X POST "${URL}" \
      -H "Authorization: Bearer ${PRICING_API_KEY}" \
      -H "Accept: application/json"; then
  echo "[sync.sh] /sync request failed" >&2
  exit 2
fi

echo
echo "[sync.sh] done."

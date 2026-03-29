#!/bin/bash
set -e

echo "[INFO] Starting Irrigation BSS..."

# Read addon options directly from /data/options.json (no bashio needed)
OPTIONS_FILE="/data/options.json"
if [ -f "${OPTIONS_FILE}" ]; then
    LOG_LEVEL=$(python3 -c "import json; d=json.load(open('${OPTIONS_FILE}')); print(d.get('log_level','info'))" 2>/dev/null || echo "info")
    DEFAULT_LANGUAGE=$(python3 -c "import json; d=json.load(open('${OPTIONS_FILE}')); print(d.get('language','en'))" 2>/dev/null || echo "en")
else
    LOG_LEVEL="info"
    DEFAULT_LANGUAGE="en"
fi

# Supervisor provides token and HA URL automatically via environment
export HA_URL="http://supervisor/core"
export HA_TOKEN="${SUPERVISOR_TOKEN}"
export LOG_LEVEL="${LOG_LEVEL}"
export DEFAULT_LANGUAGE="${DEFAULT_LANGUAGE}"
export DATA_DIR="/data"
export STATIC_DIR="/app/frontend/dist"

echo "[INFO] Log level: ${LOG_LEVEL}, Language: ${DEFAULT_LANGUAGE}"

mkdir -p "${DATA_DIR}"

cd /app
exec python -m uvicorn backend.main:app \
    --host 0.0.0.0 \
    --port 8099 \
    --log-level "${LOG_LEVEL}"

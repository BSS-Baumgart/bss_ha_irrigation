#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Irrigation BSS..."

# Supervisor provides token and HA URL automatically
export HA_URL="http://supervisor/core"
export HA_TOKEN="${SUPERVISOR_TOKEN}"
export LOG_LEVEL=$(bashio::config 'log_level')
export DEFAULT_LANGUAGE=$(bashio::config 'language')
export DATA_DIR="/data"
export STATIC_DIR="/app/frontend/dist"

bashio::log.info "Using Supervisor token for HA API"

# Init database directory
mkdir -p "${DATA_DIR}"

# Start FastAPI backend
cd /app
exec python -m uvicorn backend.main:app \
    --host 0.0.0.0 \
    --port 8099 \
    --log-level "${LOG_LEVEL}"

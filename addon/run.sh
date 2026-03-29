#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Irrigation BSS..."

# Read config from HA options
export HA_URL=$(bashio::config 'ha_url')
export HA_TOKEN=$(bashio::config 'ha_token')
export LOG_LEVEL=$(bashio::config 'log_level')
export DEFAULT_LANGUAGE=$(bashio::config 'language')
export DATA_DIR="/data"
export STATIC_DIR="/app/frontend/dist"

bashio::log.info "Connecting to Home Assistant at ${HA_URL}"

# Init database directory
mkdir -p "${DATA_DIR}"

# Start FastAPI backend
cd /app
exec python -m uvicorn backend.main:app \
    --host 0.0.0.0 \
    --port 8099 \
    --log-level "${LOG_LEVEL}"

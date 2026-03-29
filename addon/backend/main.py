"""
Irrigation BSS — FastAPI application entry point.
Serves REST API, WebSocket for live updates, and static frontend files.
"""
import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from typing import Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import settings
from backend.database.db import init_db
from backend.services import ha_client, irrigation, scheduler as sched, ha_publisher
from backend.routers import (
    zones, valves, sensors, schedules,
    irrigation as irr_router, history, ha_entities, weather as weather_router,
)

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# WebSocket connection manager
_ws_clients: Set[WebSocket] = set()


async def broadcast(data: dict):
    """Send JSON message to all connected WebSocket clients."""
    if not _ws_clients:
        return
    msg = json.dumps(data)
    dead = set()
    for ws in _ws_clients:
        try:
            await ws.send_text(msg)
        except Exception:
            dead.add(ws)
    _ws_clients.difference_update(dead)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database...")
    init_db()

    logger.info("Connecting to Home Assistant...")
    if settings.ha_token:
        try:
            await ha_client.connect()
            # Pre-load all states
            await ha_client.get_states()
        except Exception as e:
            logger.warning(f"HA connection failed: {e} — running in offline mode")
    else:
        logger.warning("No ha_token configured — HA features disabled")

    # Inject WS broadcast into irrigation service
    irrigation.set_ws_broadcast(broadcast)

    logger.info("Starting scheduler...")
    sched.start()

    if settings.ha_token:
        logger.info("Starting HA entity publisher...")
        ha_publisher.start()

    logger.info("Irrigation BSS ready on :8099")
    yield

    # Shutdown
    logger.info("Shutting down...")
    ha_publisher.stop()
    sched.stop()
    await irrigation.stop_all()


app = FastAPI(
    title="Irrigation BSS",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(zones.router)
app.include_router(valves.router)
app.include_router(sensors.router)
app.include_router(schedules.router)
app.include_router(irr_router.router)
app.include_router(history.router)
app.include_router(ha_entities.router)
app.include_router(weather_router.router)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """Real-time push updates (valve states, active zones, sensor states)."""
    await ws.accept()
    _ws_clients.add(ws)
    try:
        # Send initial status on connect
        await ws.send_json({
            "event": "connected",
            "active_zones": irrigation.get_active_zones(),
        })
        while True:
            # Keep alive — client may send pings
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        _ws_clients.discard(ws)


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


# Serve React frontend — must be last
static_dir = settings.static_dir
if os.path.isdir(static_dir):
    app.mount("/assets", StaticFiles(directory=f"{static_dir}/assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        index = os.path.join(static_dir, "index.html")
        return FileResponse(index)
else:
    logger.warning(f"Frontend static dir not found: {static_dir} — API-only mode")

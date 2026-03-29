"""
Home Assistant WebSocket client.
Connects to HA WS API, subscribes to state changes and allows calling services.
"""
import asyncio
import json
import logging
from typing import Any, Callable, Dict, List, Optional
import aiohttp

from backend.config import settings

logger = logging.getLogger(__name__)

_ws: Optional[aiohttp.ClientWebSocketResponse] = None
_session: Optional[aiohttp.ClientSession] = None
_msg_id = 0
_pending: Dict[int, asyncio.Future] = {}
_state_listeners: List[Callable] = []
_states: Dict[str, Any] = {}


def _next_id() -> int:
    global _msg_id
    _msg_id += 1
    return _msg_id


async def connect():
    """Establish WebSocket connection to HA."""
    global _ws, _session
    _session = aiohttp.ClientSession()
    ws_url = settings.ha_url.replace("http", "ws") + "/api/websocket"
    _ws = await _session.ws_connect(ws_url)
    asyncio.create_task(_receive_loop())
    logger.info("Connected to HA WebSocket")


async def _receive_loop():
    """Process incoming messages from HA."""
    global _ws
    async for msg in _ws:
        if msg.type == aiohttp.WSMsgType.TEXT:
            data = json.loads(msg.data)
            await _handle_message(data)
        elif msg.type in (aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
            logger.warning("HA WebSocket closed, reconnecting in 5s...")
            await asyncio.sleep(5)
            await connect()
            break


async def _handle_message(data: dict):
    msg_type = data.get("type")

    if msg_type == "auth_required":
        await _ws.send_json({"type": "auth", "access_token": settings.ha_token})

    elif msg_type == "auth_ok":
        logger.info("HA auth OK — subscribing to state changes")
        await _subscribe_states()

    elif msg_type == "auth_invalid":
        logger.error("HA auth FAILED — check ha_token in config")

    elif msg_type == "result":
        msg_id = data.get("id")
        if msg_id in _pending:
            _pending[msg_id].set_result(data)
            del _pending[msg_id]

    elif msg_type == "event":
        event = data.get("event", {})
        if event.get("event_type") == "state_changed":
            ed = event.get("data", {})
            entity_id = ed.get("entity_id")
            new_state = ed.get("new_state")
            if entity_id and new_state:
                _states[entity_id] = new_state
                for listener in _state_listeners:
                    asyncio.create_task(listener(entity_id, new_state))


async def _subscribe_states():
    msg_id = _next_id()
    await _ws.send_json({
        "id": msg_id,
        "type": "subscribe_events",
        "event_type": "state_changed"
    })


async def _send(payload: dict) -> dict:
    """Send message and await result."""
    msg_id = _next_id()
    payload["id"] = msg_id
    loop = asyncio.get_event_loop()
    future = loop.create_future()
    _pending[msg_id] = future
    await _ws.send_json(payload)
    return await asyncio.wait_for(future, timeout=10.0)


async def get_states() -> List[dict]:
    """Fetch all entity states via REST API."""
    url = f"{settings.ha_url}/api/states"
    headers = {"Authorization": f"Bearer {settings.ha_token}"}
    async with aiohttp.ClientSession() as s:
        async with s.get(url, headers=headers) as resp:
            data = await resp.json()
            for entity in data:
                _states[entity["entity_id"]] = entity
            return data


async def get_state(entity_id: str) -> Optional[dict]:
    """Get current state of a single entity."""
    if entity_id in _states:
        return _states[entity_id]
    url = f"{settings.ha_url}/api/states/{entity_id}"
    headers = {"Authorization": f"Bearer {settings.ha_token}"}
    async with aiohttp.ClientSession() as s:
        async with s.get(url, headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                _states[entity_id] = data
                return data
    return None


async def call_service(domain: str, service: str, data: dict = None) -> dict:
    """Call a HA service (e.g. switch.turn_on)."""
    return await _send({
        "type": "call_service",
        "domain": domain,
        "service": service,
        "service_data": data or {}
    })


async def turn_on(entity_id: str):
    domain = entity_id.split(".")[0]
    await call_service(domain, "turn_on", {"entity_id": entity_id})
    logger.info(f"Turned ON: {entity_id}")


async def turn_off(entity_id: str):
    domain = entity_id.split(".")[0]
    await call_service(domain, "turn_off", {"entity_id": entity_id})
    logger.info(f"Turned OFF: {entity_id}")


def add_state_listener(callback: Callable):
    _state_listeners.append(callback)


def get_cached_state(entity_id: str) -> Optional[dict]:
    return _states.get(entity_id)

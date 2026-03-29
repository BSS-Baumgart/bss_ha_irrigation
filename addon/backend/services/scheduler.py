"""
APScheduler — loads schedules from DB, fires zone watering at configured times.
"""
import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlmodel import Session, select

from backend.database.db import engine
from backend.models import Schedule, Zone, TriggerSource
from backend.services import irrigation

logger = logging.getLogger(__name__)

_scheduler = AsyncIOScheduler(timezone="UTC")


def _weekday_bitmask_to_cron(bitmask: int) -> str:
    """Convert bitmask (bit0=Mon..bit6=Sun) to APScheduler cron day_of_week string."""
    days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    selected = [days[i] for i in range(7) if bitmask & (1 << i)]
    return ",".join(selected) if selected else "mon"


async def _fire_schedule(schedule_id: int):
    with Session(engine) as session:
        schedule = session.get(Schedule, schedule_id)
        if not schedule or not schedule.enabled:
            return
        zone = session.get(Zone, schedule.zone_id)
        zone_name = zone.name if zone else "Unknown"

    logger.info(f"Scheduler firing: zone_id={schedule.zone_id} ({zone_name})")
    result = await irrigation.start_zone(
        zone_id=schedule.zone_id,
        duration_min=schedule.duration_override_min,
        triggered_by=TriggerSource.schedule,
    )
    if not result.get("ok"):
        logger.warning(f"Schedule {schedule_id} skipped: {result}")


def reload_schedules():
    """Remove all schedule jobs and re-add from DB."""
    for job in _scheduler.get_jobs():
        if job.id.startswith("schedule_"):
            job.remove()

    with Session(engine) as session:
        schedules = session.exec(select(Schedule).where(Schedule.enabled == True)).all()

    for s in schedules:
        h, m = s.start_time.split(":")
        day_of_week = _weekday_bitmask_to_cron(s.weekdays)
        _scheduler.add_job(
            _fire_schedule,
            CronTrigger(hour=int(h), minute=int(m), day_of_week=day_of_week),
            id=f"schedule_{s.id}",
            kwargs={"schedule_id": s.id},
            replace_existing=True,
            misfire_grace_time=300,
        )
        logger.debug(f"Scheduled zone {s.zone_id} at {s.start_time} on days={day_of_week}")


def start():
    _scheduler.start()
    reload_schedules()
    logger.info("Scheduler started")


def stop():
    _scheduler.shutdown(wait=False)


def get_next_run(schedule_id: int) -> str | None:
    job = _scheduler.get_job(f"schedule_{schedule_id}")
    if job and job.next_run_time:
        return job.next_run_time.isoformat()
    return None

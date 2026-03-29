from typing import Optional
from sqlmodel import SQLModel, Field


class ValveBase(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    entity_id: str = Field(min_length=1, max_length=200)
    zone_id: Optional[int] = Field(default=None, foreign_key="zones.id")
    enabled: bool = Field(default=True)
    notes: Optional[str] = Field(default=None, max_length=500)


class Valve(ValveBase, table=True):
    __tablename__ = "valves"
    id: Optional[int] = Field(default=None, primary_key=True)


class ValveCreate(ValveBase):
    pass


class ValveUpdate(SQLModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    entity_id: Optional[str] = Field(default=None, min_length=1, max_length=200)
    zone_id: Optional[int] = None
    enabled: Optional[bool] = None
    notes: Optional[str] = None


class ValveRead(ValveBase):
    id: int
    ha_state: Optional[str] = None   # "on" | "off" | "unavailable"
    zone_name: Optional[str] = None

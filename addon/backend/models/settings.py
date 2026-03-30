from typing import Optional
from sqlmodel import SQLModel, Field


class AppSetting(SQLModel, table=True):
    __tablename__ = "app_settings"
    key: str = Field(primary_key=True, max_length=64)
    value: Optional[str] = Field(default=None)


class SettingWrite(SQLModel):
    value: Optional[str] = None

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ha_url: str = os.getenv("HA_URL", "http://homeassistant:8123")
    ha_token: str = os.getenv("HA_TOKEN", "")
    log_level: str = os.getenv("LOG_LEVEL", "info")
    default_language: str = os.getenv("DEFAULT_LANGUAGE", "en")
    data_dir: str = os.getenv("DATA_DIR", "./data")
    static_dir: str = os.getenv("STATIC_DIR", "./frontend/dist")
    db_path: str = ""

    def model_post_init(self, __context) -> None:
        if not self.db_path:
            self.db_path = f"sqlite:///{self.data_dir}/irrigation.db"

    class Config:
        env_file = ".env"


settings = Settings()

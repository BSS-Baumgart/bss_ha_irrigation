from sqlmodel import SQLModel, create_engine, Session
from backend.config import settings

engine = create_engine(settings.db_path, echo=False)


def init_db():
    # Import models so SQLModel metadata is fully registered before create_all.
    from backend import models  # noqa: F401
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session

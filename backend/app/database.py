import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlmodel import Session, create_engine

BACKEND_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BACKEND_DIR.parent / "brews.db"
DATABASE_URL = os.environ.get("BREW_TRACKER_DATABASE_URL", f"sqlite:///{DB_PATH}")

connect_args = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def init_db() -> None:
    alembic_cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    command.upgrade(alembic_cfg, "head")
    with engine.connect() as conn:
        conn.exec_driver_sql("PRAGMA foreign_keys = ON")


def get_session():
    with Session(engine) as session:
        yield session

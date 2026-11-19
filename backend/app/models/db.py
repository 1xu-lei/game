"""SQLite + SQLAlchemy 最小实现（规格书 §6.4：无需额外数据库服务器）。"""

import os
from datetime import datetime

from sqlalchemy import DateTime, String, Text, create_engine, func
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

DB_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(DB_DIR, "rainfall.db")
DATABASE_URL = os.environ.get("RAINFALL_DB_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class SimulationRecord(Base):
    __tablename__ = "simulations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    rain_type: Mapped[str] = mapped_column(String(16), index=True)
    score: Mapped[float] = mapped_column(nullable=False)
    result_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


def init_db() -> None:
    Base.metadata.create_all(engine)


def session_scope() -> Session:
    return SessionLocal()

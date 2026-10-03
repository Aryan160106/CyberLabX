import time
from sqlalchemy.exc import OperationalError
import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, Uuid, create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

DATABASE_URL = URL.create(
    "postgresql+psycopg",
    username=os.environ.get("DB_USER", "cyberlabx"),
    password=os.environ["DB_PASSWORD"],  # required: fail loudly if missing
    host=os.environ.get("DB_HOST", "cyberlabx-postgres"),
    port=5432,
    database=os.environ.get("DB_NAME", "cyberlabx"),
)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_db():
    """FastAPI dependency: one DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(80))
    xp: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class LabSession(Base):
    __tablename__ = "lab_sessions"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    lab_type: Mapped[str] = mapped_column(String(50))
    namespace: Mapped[str] = mapped_column(String(100), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    flag: Mapped[str | None] = mapped_column(String(100), nullable=True)

class QuizAnswer(Base):
    """First answer a user gave to a quiz question (later attempts don't change it)."""
    __tablename__ = "quiz_answers"
    __table_args__ = (UniqueConstraint("user_id", "lab_id", "question_id"),)
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    lab_id: Mapped[str] = mapped_column(String(50))
    question_id: Mapped[str] = mapped_column(String(50))
    correct: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

def init_db(retries: int = 30, delay: float = 2.0) -> None:
    """Create tables, waiting up to ~60s for Postgres to accept connections."""
    for attempt in range(1, retries + 1):
        try:
            Base.metadata.create_all(engine)
            return
        except OperationalError:
            if attempt == retries:
                raise
            print(f"[db] Postgres not ready ({attempt}/{retries}), retrying in {delay}s", flush=True)
            time.sleep(delay)
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

def _get_database_url() -> str:
    url = os.getenv("DATABASE_URL") or os.getenv("PAYMENTS_DATABASE_URL")
    if not url:
        raise RuntimeError(
            "Missing database configuration. Set DATABASE_URL or PAYMENTS_DATABASE_URL."
        )
    return url


SQLALCHEMY_DATABASE_URL = _get_database_url()

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

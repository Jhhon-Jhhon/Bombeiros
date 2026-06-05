import logging

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

logger = logging.getLogger("bombeiros")

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Mostra queries SQL no terminal em modo debug
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    """
    Dependência do FastAPI que gerencia o ciclo de vida da sessão.
    Uso: def meu_endpoint(db: Session = Depends(get_db))
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

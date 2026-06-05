import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.database import Base, get_db
from app.main import app

engine_test = create_engine(settings.TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine_test
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def aplicar_triggers():
    """Lê e executa o script de triggers no banco de teste."""
    script_path = os.path.join(
        os.path.dirname(__file__), "..", "scripts", "triggers.sql"
    )
    with open(script_path, encoding="utf-8") as f:
        sql = f.read()

    with engine_test.connect() as conn:
        # Executa cada bloco separado por ponto e vírgula
        for statement in sql.split(";"):
            stmt = statement.strip()
            if stmt and not stmt.startswith("--"):
                try:
                    conn.execute(text(stmt))
                except Exception:
                    pass  # ignora erros de DROP IF EXISTS etc
        conn.commit()


@pytest.fixture(scope="session")
def client():
    Base.metadata.create_all(bind=engine_test)
    aplicar_triggers()  # ← cria os triggers automaticamente

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine_test)
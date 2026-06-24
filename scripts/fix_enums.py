import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TYPE statusviatura ADD VALUE IF NOT EXISTS 'inativa'"))
    conn.execute(text("ALTER TYPE statusdenuncia ADD VALUE IF NOT EXISTS 'aprovada'"))
    conn.execute(text("ALTER TYPE statusmanutencao ADD VALUE IF NOT EXISTS 'inativa'"))
    conn.commit()

print('Enums atualizados!')
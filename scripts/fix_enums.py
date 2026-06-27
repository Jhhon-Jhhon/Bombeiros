import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from app.database import engine

with engine.connect() as conn:
    conn.execute(text("ALTER TYPE statusviatura ADD VALUE IF NOT EXISTS 'inativa'"))
    conn.execute(
        text("ALTER TYPE statusdenuncia ADD VALUE IF NOT EXISTS 'aprovada'")
    )  # ou o que já tem
    conn.execute(text("ALTER TYPE statusmanutencao ADD VALUE IF NOT EXISTS 'inativa'"))
    conn.execute(
        text("ALTER TYPE statusequipamento ADD VALUE IF NOT EXISTS 'inativo'")
    )  # ← adicionar esta
    conn.commit()

print("Enums atualizados!")

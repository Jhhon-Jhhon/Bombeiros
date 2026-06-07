from datetime import date, datetime

from pydantic import BaseModel


class EquipeBase(BaseModel):
    nome: str
    tipo: str


class EquipeCreate(EquipeBase):
    pass


class EquipeUpdate(BaseModel):
    nome: str | None = None
    tipo: str | None = None


class EquipeResponse(EquipeBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Associação de Bombeiro ────────────────────────────────
class AdicionarBombeiroEquipeRequest(BaseModel):
    bombeiro_id: int
    funcao: str | None = None
    data_alocacao: date | None = None


class BombeiroEquipeResponse(BaseModel):
    equipe_id: int
    bombeiro_id: int
    funcao: str | None = None
    data_alocacao: date | None = None
    model_config = {"from_attributes": True}

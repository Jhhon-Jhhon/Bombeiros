from datetime import datetime

from pydantic import BaseModel

from app.models.enums import StatusSolicitacao


class SolicitacaoBase(BaseModel):
    denuncia_id: int
    comandante_id: int
    tipo: str
    prioridade: str | None = None
    observacao: str | None = None


class SolicitacaoCreate(SolicitacaoBase):
    pass


class SolicitacaoUpdate(BaseModel):
    status: StatusSolicitacao | None = None
    observacao: str | None = None
    arquivada: bool | None = None


class SolicitacaoResponse(SolicitacaoBase):
    id: int
    status: StatusSolicitacao
    arquivada: bool
    data_verificacao: datetime | None = None
    data_arquivamento: datetime | None = None
    created_at: datetime
    model_config = {"from_attributes": True}

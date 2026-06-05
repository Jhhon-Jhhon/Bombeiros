from datetime import datetime

from pydantic import BaseModel

from app.models.enums import StatusDenuncia


class DenunciaBase(BaseModel):
    solicitante: str
    telefone: str | None = None
    tipo: str
    descricao: str
    endereco_informado: str | None = None


class DenunciaCreate(DenunciaBase):
    pass


class DenunciaUpdate(BaseModel):
    status: StatusDenuncia | None = None


class DenunciaResponse(DenunciaBase):
    id: int
    status: StatusDenuncia
    data_denuncia: datetime
    created_at: datetime
    model_config = {"from_attributes": True}

from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.enums import StatusEquipamento, TipoEquipamento


class EquipamentoBase(BaseModel):
    nome: str
    tipo: TipoEquipamento
    numero_serie: str
    status: StatusEquipamento = StatusEquipamento.disponivel

    @field_validator("numero_serie")
    @classmethod
    def serie_upper(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("nome")
    @classmethod
    def nome_nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Nome não pode ser vazio")
        return v.strip()


class EquipamentoCreate(EquipamentoBase):
    pass


class EquipamentoUpdate(BaseModel):
    nome: str | None = None
    tipo: TipoEquipamento | None = None
    status: StatusEquipamento | None = None


class EquipamentoResponse(EquipamentoBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}

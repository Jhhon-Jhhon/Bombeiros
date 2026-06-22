from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, model_validator

from app.models.enums import StatusManutencao, TipoManutencao


class ManutencaoBase(BaseModel):
    tipo: TipoManutencao
    descricao: str | None = None
    custo: Decimal | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    status: StatusManutencao = StatusManutencao.pendente
    viatura_id: int | None = None
    equipamento_id: int | None = None

    @model_validator(mode="after")
    def validar_associacao(self):
        if not self.viatura_id and not self.equipamento_id:
            raise ValueError(
                "RN04: manutenção deve estar associada a "
                "pelo menos uma viatura ou um equipamento"
            )
        return self


class ManutencaoCreate(ManutencaoBase):
    pass


class ManutencaoUpdate(BaseModel):
    tipo: TipoManutencao | None = None
    descricao: str | None = None
    custo: Decimal | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    status: StatusManutencao | None = None


class ManutencaoResponse(ManutencaoBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}
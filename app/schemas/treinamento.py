from datetime import date, datetime

from pydantic import BaseModel, field_validator

from app.models.enums import StatusParticipacao, StatusTreinamento, TipoTreinamento


class TreinamentoBase(BaseModel):
    titulo: str
    tipo: TipoTreinamento
    descricao: str | None = None
    instrutor: str
    carga_horaria: int
    data_inicio: date
    data_fim: date
    status: StatusTreinamento = StatusTreinamento.agendado

    @field_validator("carga_horaria")
    @classmethod
    def carga_positiva(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Carga horária deve ser maior que zero")
        return v


class TreinamentoCreate(TreinamentoBase):
    pass


class TreinamentoUpdate(BaseModel):
    titulo: str | None = None
    tipo: TipoTreinamento | None = None
    descricao: str | None = None
    instrutor: str | None = None
    carga_horaria: int | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    status: StatusTreinamento | None = None


class TreinamentoResponse(TreinamentoBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Participação de Bombeiro ──────────────────────────────
class InscricaoRequest(BaseModel):
    bombeiro_id: int
    status_participacao: StatusParticipacao = StatusParticipacao.inscrito


class InscricaoUpdate(BaseModel):
    status_participacao: StatusParticipacao | None = None
    observacao: str | None = None
    data_conclusao: date | None = None


class InscricaoResponse(BaseModel):
    treinamento_id: int
    bombeiro_id: int
    status_participacao: StatusParticipacao
    data_conclusao: date | None = None
    observacao: str | None = None
    model_config = {"from_attributes": True}

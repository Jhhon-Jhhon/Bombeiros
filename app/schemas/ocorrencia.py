from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.enums import (
    PrioridadeOcorrencia, StatusOcorrencia, TipoOcorrencia
)


# ── Endereço ──────────────────────────────────────────────
class EnderecoCreate(BaseModel):
    logradouro: str
    numero: str | None = None
    bairro: str | None = None
    cidade: str
    cep: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class EnderecoResponse(EnderecoCreate):
    id: int
    ocorrencia_id: int
    model_config = {"from_attributes": True}


# ── Ocorrência ────────────────────────────────────────────
class OcorrenciaBase(BaseModel):
    tipo: TipoOcorrencia
    descricao: str | None = None
    prioridade: PrioridadeOcorrencia
    num_vitimas: int = 0

    @field_validator("num_vitimas")
    @classmethod
    def vitimas_positivo(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Número de vítimas não pode ser negativo")
        return v


class OcorrenciaCreate(OcorrenciaBase):
    endereco: EnderecoCreate  # endereço é criado junto


class OcorrenciaUpdate(BaseModel):
    descricao: str | None = None
    status: StatusOcorrencia | None = None
    num_vitimas: int | None = None
    prioridade: PrioridadeOcorrencia | None = None


class OcorrenciaResponse(OcorrenciaBase):
    id: int
    status: StatusOcorrencia
    data_abertura: datetime
    data_encerramento: datetime | None = None
    solicitacao_id: int | None = None
    created_at: datetime
    endereco: EnderecoResponse | None = None
    model_config = {"from_attributes": True}


# ── Alocação de Viatura ───────────────────────────────────
class AlocarViaturaRequest(BaseModel):
    viatura_id: int
    funcao: str | None = None


class OcorrenciaViaturaResponse(BaseModel):
    ocorrencia_id: int
    viatura_id: int
    funcao: str | None = None
    hora_inicio: datetime | None = None
    hora_fim: datetime | None = None
    model_config = {"from_attributes": True}


# ── Alocação de Bombeiro ──────────────────────────────────
class AlocarBombeiroRequest(BaseModel):
    bombeiro_id: int
    funcao: str | None = None


class OcorrenciaBombeiroResponse(BaseModel):
    ocorrencia_id: int
    bombeiro_id: int
    funcao: str | None = None
    data_participacao: datetime | None = None
    model_config = {"from_attributes": True}
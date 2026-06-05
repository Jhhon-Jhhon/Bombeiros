from datetime import date, datetime

from pydantic import BaseModel, field_validator

from app.models.enums import PatenteBombeiro, StatusBombeiro


# Base — campos comuns entre Create e Update
class BombeiroBase(BaseModel):
    nome: str
    matricula: str
    patente: PatenteBombeiro
    especialidade: str | None = None
    telefone: str | None = None
    email: str | None = None
    status: StatusBombeiro = StatusBombeiro.ativo
    data_admissao: date

    @field_validator("nome")
    @classmethod
    def nome_nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Nome não pode ser vazio")
        return v.strip()

    @field_validator("matricula")
    @classmethod
    def matricula_formato(cls, v: str) -> str:
        if len(v.strip()) < 3:
            raise ValueError("Matrícula deve ter pelo menos 3 caracteres")
        return v.strip().upper()


# Create — usado no POST (cliente envia isso)
class BombeiroCreate(BombeiroBase):
    pass  # herda tudo do Base — nada extra por enquanto


# Update — usado no PUT (todos os campos opcionais)
class BombeiroUpdate(BaseModel):
    nome: str | None = None
    patente: PatenteBombeiro | None = None
    especialidade: str | None = None
    telefone: str | None = None
    email: str | None = None
    status: StatusBombeiro | None = None


# Response — o que a API devolve (inclui id e created_at)
class BombeiroResponse(BombeiroBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}

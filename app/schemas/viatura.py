from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.enums import StatusViatura, TipoViatura


class ViaturaBase(BaseModel):
    placa: str
    modelo: str
    tipo: TipoViatura
    ano_fabricacao: int
    status: StatusViatura = StatusViatura.disponivel

    @field_validator("placa")
    @classmethod
    def placa_upper(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("ano_fabricacao")
    @classmethod
    def ano_valido(cls, v: int) -> int:
        if v < 1950 or v > 2030:
            raise ValueError("Ano de fabricação inválido")
        return v


class ViaturaCreate(ViaturaBase):
    pass


class ViaturaUpdate(BaseModel):
    modelo: str | None = None
    tipo: TipoViatura | None = None
    ano_fabricacao: int | None = None
    status: StatusViatura | None = None


class ViaturaResponse(ViaturaBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}

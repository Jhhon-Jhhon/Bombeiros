from pydantic import BaseModel, field_validator


class ViaturaEquipamentoBase(BaseModel):
    equipamento_id: int
    quantidade: int = 1
    observacao: str | None = None

    @field_validator("quantidade")
    @classmethod
    def quantidade_positiva(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantidade deve ser maior que zero")
        return v


class ViaturaEquipamentoCreate(ViaturaEquipamentoBase):
    pass


class ViaturaEquipamentoUpdate(BaseModel):
    quantidade: int | None = None
    observacao: str | None = None


class ViaturaEquipamentoResponse(ViaturaEquipamentoBase):
    viatura_id: int
    model_config = {"from_attributes": True}

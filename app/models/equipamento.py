from sqlalchemy import Column, DateTime, Enum as SAEnum
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import StatusEquipamento, TipoEquipamento


class Equipamento(Base):
    __tablename__ = "equipamento"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    tipo = Column(SAEnum(TipoEquipamento), nullable=False)
    numero_serie = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(
        SAEnum(StatusEquipamento),
        nullable=False,
        default=StatusEquipamento.disponivel,
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    viaturas = relationship("ViaturaEquipamento", back_populates="equipamento")
    manutencoes = relationship("Manutencao", back_populates="equipamento")


class ViaturaEquipamento(Base):
    __tablename__ = "viatura_equipamento"

    viatura_id = Column(
        Integer, ForeignKey("viatura.id"), primary_key=True
    )
    equipamento_id = Column(
        Integer, ForeignKey("equipamento.id"), primary_key=True
    )
    quantidade = Column(Integer, nullable=False, default=1)
    observacao = Column(String(150))

    viatura = relationship("Viatura", back_populates="equipamentos")
    equipamento = relationship("Equipamento", back_populates="viaturas")
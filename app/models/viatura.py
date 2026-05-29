from sqlalchemy import Column, DateTime, Enum as SAEnum
from sqlalchemy import Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import StatusViatura, TipoViatura


class Viatura(Base):
    __tablename__ = "viatura"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(10), unique=True, nullable=False, index=True)
    modelo = Column(String(50), nullable=False)
    tipo = Column(SAEnum(TipoViatura), nullable=False)
    ano_fabricacao = Column(Integer, nullable=False)
    status = Column(
        SAEnum(StatusViatura),
        nullable=False,
        default=StatusViatura.disponivel,
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    ocorrencias = relationship("OcorrenciaViatura", back_populates="viatura")
    equipamentos = relationship("ViaturaEquipamento", back_populates="viatura")
    manutencoes = relationship("Manutencao", back_populates="viatura")
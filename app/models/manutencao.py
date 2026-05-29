from sqlalchemy import Column, Date, DateTime, Enum as SAEnum
from sqlalchemy import ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import StatusManutencao, TipoManutencao


class Manutencao(Base):
    __tablename__ = "manutencao"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(SAEnum(TipoManutencao), nullable=False)
    descricao = Column(Text)
    custo = Column(Numeric(10, 2))
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date)
    status = Column(
        SAEnum(StatusManutencao),
        nullable=False,
        default=StatusManutencao.pendente,
    )

    # Ambos os FKs são nullable — RN04: pelo menos um deve ser preenchido
    # Essa regra é validada no schema Pydantic, não aqui
    viatura_id = Column(Integer, ForeignKey("viatura.id"), nullable=True)
    equipamento_id = Column(
        Integer, ForeignKey("equipamento.id"), nullable=True
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    viatura = relationship("Viatura", back_populates="manutencoes")
    equipamento = relationship("Equipamento", back_populates="manutencoes")
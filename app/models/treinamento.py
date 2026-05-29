from sqlalchemy import Column, Date, DateTime, Enum as SAEnum
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import StatusParticipacao, StatusTreinamento, TipoTreinamento


class Treinamento(Base):
    __tablename__ = "treinamento"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(150), nullable=False)
    tipo = Column(SAEnum(TipoTreinamento), nullable=False)
    descricao = Column(Text)
    instrutor = Column(String(100), nullable=False)
    carga_horaria = Column(Integer, nullable=False)
    data_inicio = Column(Date, nullable=False)
    data_fim = Column(Date, nullable=False)
    status = Column(
        SAEnum(StatusTreinamento),
        nullable=False,
        default=StatusTreinamento.agendado,
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    bombeiros = relationship("BombeiroTreinamento", back_populates="treinamento")


class BombeiroTreinamento(Base):
    __tablename__ = "bombeiro_treinamento"

    bombeiro_id = Column(
        Integer, ForeignKey("bombeiro.id"), primary_key=True
    )
    treinamento_id = Column(
        Integer, ForeignKey("treinamento.id"), primary_key=True
    )
    status_participacao = Column(
        SAEnum(StatusParticipacao),
        nullable=False,
        default=StatusParticipacao.inscrito,
    )
    data_conclusao = Column(Date)
    observacao = Column(String(150))

    bombeiro = relationship("Bombeiro", back_populates="treinamentos")
    treinamento = relationship("Treinamento", back_populates="bombeiros")
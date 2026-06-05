from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import StatusSolicitacao


class Solicitacao(Base):
    __tablename__ = "solicitacao"

    id = Column(Integer, primary_key=True, index=True)

    # FK para Denuncia — única (uma denúncia gera no máximo uma solicitação)
    denuncia_id = Column(
        Integer, ForeignKey("denuncia.id"), nullable=False, unique=True
    )
    # FK para Bombeiro (o comandante que verificou)
    comandante_id = Column(
        Integer, ForeignKey("bombeiro.id"), nullable=True
    )

    tipo = Column(String(50), nullable=False)
    prioridade = Column(String(50))
    status = Column(
        SAEnum(StatusSolicitacao),
        nullable=False,
        default=StatusSolicitacao.recebida,
    )
    arquivada = Column(Boolean, nullable=False, default=False)
    data_verificacao = Column(DateTime)
    data_arquivamento = Column(DateTime)
    observacao = Column(Text)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    denuncia = relationship("Denuncia", back_populates="solicitacao")
    comandante = relationship("Bombeiro", back_populates="solicitacoes_verificadas")
    ocorrencia = relationship(
        "Ocorrencia", back_populates="solicitacao", uselist=False
    )

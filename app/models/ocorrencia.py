from sqlalchemy import Column, DateTime, Enum as SAEnum
from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import (
    PrioridadeOcorrencia,
    StatusOcorrencia,
    TipoOcorrencia,
)


class Ocorrencia(Base):
    __tablename__ = "ocorrencia"

    id = Column(Integer, primary_key=True, index=True)

    # FK para Solicitacao — nullable (ocorrência pode ser registrada diretamente)
    solicitacao_id = Column(
        Integer, ForeignKey("solicitacao.id"), nullable=True, unique=True
    )

    tipo = Column(SAEnum(TipoOcorrencia), nullable=False)
    descricao = Column(Text)
    prioridade = Column(SAEnum(PrioridadeOcorrencia), nullable=False)
    status = Column(
        SAEnum(StatusOcorrencia),
        nullable=False,
        default=StatusOcorrencia.aberta,
    )
    num_vitimas = Column(Integer, nullable=False, default=0)
    data_abertura = Column(DateTime, server_default=func.now(), nullable=False)
    data_encerramento = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    solicitacao = relationship("Solicitacao", back_populates="ocorrencia")
    endereco = relationship(
        "EnderecoOcorrencia", back_populates="ocorrencia", uselist=False
    )
    bombeiros = relationship("OcorrenciaBombeiro", back_populates="ocorrencia")
    viaturas = relationship("OcorrenciaViatura", back_populates="ocorrencia")


class EnderecoOcorrencia(Base):
    __tablename__ = "endereco_ocorrencia"

    id = Column(Integer, primary_key=True, index=True)
    ocorrencia_id = Column(
        Integer, ForeignKey("ocorrencia.id"), nullable=False, unique=True
    )
    logradouro = Column(String(150), nullable=False)
    numero = Column(String(20))
    bairro = Column(String(100))
    cidade = Column(String(100), nullable=False)
    cep = Column(String(10))
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))

    ocorrencia = relationship("Ocorrencia", back_populates="endereco")


class OcorrenciaBombeiro(Base):
    __tablename__ = "ocorrencia_bombeiro"

    ocorrencia_id = Column(
        Integer, ForeignKey("ocorrencia.id"), primary_key=True
    )
    bombeiro_id = Column(
        Integer, ForeignKey("bombeiro.id"), primary_key=True
    )
    funcao = Column(String(50))
    data_participacao = Column(DateTime, server_default=func.now())

    ocorrencia = relationship("Ocorrencia", back_populates="bombeiros")
    bombeiro = relationship("Bombeiro", back_populates="ocorrencias")


class OcorrenciaViatura(Base):
    __tablename__ = "ocorrencia_viatura"

    ocorrencia_id = Column(
        Integer, ForeignKey("ocorrencia.id"), primary_key=True
    )
    viatura_id = Column(
        Integer, ForeignKey("viatura.id"), primary_key=True
    )
    funcao = Column(String(50))
    hora_inicio = Column(DateTime, server_default=func.now())
    hora_fim = Column(DateTime)

    ocorrencia = relationship("Ocorrencia", back_populates="viaturas")
    viatura = relationship("Viatura", back_populates="ocorrencias")
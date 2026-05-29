from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Enum as SAEnum
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import PatenteBombeiro, StatusBombeiro, StatusEquipe


class Bombeiro(Base):
    __tablename__ = "bombeiro"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    matricula = Column(String(20), unique=True, nullable=False, index=True)
    patente = Column(SAEnum(PatenteBombeiro), nullable=False)
    especialidade = Column(String(50))
    telefone = Column(String(20))
    email = Column(String(100))
    status = Column(
        SAEnum(StatusBombeiro),
        nullable=False,
        default=StatusBombeiro.ativo,
    )
    data_admissao = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relacionamentos (não criam colunas — só navegação ORM)
    equipes = relationship("BombeiroEquipe", back_populates="bombeiro")
    ocorrencias = relationship("OcorrenciaBombeiro", back_populates="bombeiro")
    treinamentos = relationship("BombeiroTreinamento", back_populates="bombeiro")
    solicitacoes_verificadas = relationship(
        "Solicitacao", back_populates="comandante"
    )


class Equipe(Base):
    __tablename__ = "equipe"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    tipo = Column(String(50))
    status = Column(
        SAEnum(StatusEquipe),
        nullable=False,
        default=StatusEquipe.ativa,
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    bombeiros = relationship("BombeiroEquipe", back_populates="equipe")


class BombeiroEquipe(Base):
    __tablename__ = "bombeiro_equipe"

    bombeiro_id = Column(
        Integer, ForeignKey("bombeiro.id"), primary_key=True
    )
    equipe_id = Column(
        Integer, ForeignKey("equipe.id"), primary_key=True
    )
    data_alocacao = Column(Date)
    funcao = Column(String(50))

    bombeiro = relationship("Bombeiro", back_populates="equipes")
    equipe = relationship("Equipe", back_populates="bombeiros")
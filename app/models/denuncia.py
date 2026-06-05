from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import StatusDenuncia


class Denuncia(Base):
    __tablename__ = "denuncia"

    id = Column(Integer, primary_key=True, index=True)
    solicitante = Column(String(100), nullable=False)
    telefone = Column(String(20))
    tipo = Column(String(50), nullable=False)
    descricao = Column(Text, nullable=False)
    endereco_informado = Column(String(150))
    status = Column(
        SAEnum(StatusDenuncia),
        nullable=False,
        default=StatusDenuncia.pendente,
    )
    data_denuncia = Column(DateTime, server_default=func.now(), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    solicitacao = relationship(
        "Solicitacao", back_populates="denuncia", uselist=False
    )

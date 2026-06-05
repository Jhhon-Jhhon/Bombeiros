import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.enums import StatusSolicitacao
from app.models.solicitacao import Solicitacao
from app.schemas.solicitacao import SolicitacaoCreate, SolicitacaoUpdate

logger = logging.getLogger("bombeiros")


def get_solicitacao(db: Session, solicitacao_id: int) -> Solicitacao | None:
    return db.query(Solicitacao).filter(Solicitacao.id == solicitacao_id).first()


def get_solicitacoes(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: StatusSolicitacao | None = None,
) -> list[Solicitacao]:
    query = db.query(Solicitacao)
    if status:
        query = query.filter(Solicitacao.status == status)
    return query.order_by(Solicitacao.created_at.desc()).offset(skip).limit(limit).all()


def create_solicitacao(db: Session, dados: SolicitacaoCreate) -> Solicitacao:
    solicitacao = Solicitacao(**dados.model_dump())
    db.add(solicitacao)
    db.commit()
    db.refresh(solicitacao)
    logger.info("Solicitação criada: id=%s", solicitacao.id)
    return solicitacao


def update_solicitacao(
    db: Session, solicitacao_id: int, dados: SolicitacaoUpdate
) -> Solicitacao | None:
    solicitacao = get_solicitacao(db, solicitacao_id)
    if not solicitacao:
        return None

    campos = dados.model_dump(exclude_unset=True)

    # Registra timestamp ao verificar
    if campos.get("status") == StatusSolicitacao.verificada:
        campos["data_verificacao"] = datetime.now(timezone.utc)

    # Registra timestamp ao arquivar
    if campos.get("arquivada") is True:
        campos["data_arquivamento"] = datetime.now(timezone.utc)
        campos["status"] = StatusSolicitacao.arquivada

    for campo, valor in campos.items():
        setattr(solicitacao, campo, valor)

    db.commit()
    db.refresh(solicitacao)
    logger.info("Solicitação atualizada: id=%s", solicitacao_id)
    return solicitacao


def delete_solicitacao(db: Session, solicitacao_id: int) -> bool:
    solicitacao = get_solicitacao(db, solicitacao_id)
    if not solicitacao:
        return False
    db.delete(solicitacao)
    db.commit()
    return True

import logging
from sqlalchemy.orm import Session
from app.models.treinamento import BombeiroTreinamento, Treinamento
from app.models.enums import StatusTreinamento
from app.schemas.treinamento import InscricaoRequest, TreinamentoCreate, TreinamentoUpdate

logger = logging.getLogger("bombeiros")


def get_treinamento(db: Session, treinamento_id: int) -> Treinamento | None:
    return db.query(Treinamento).filter(Treinamento.id == treinamento_id).first()


def get_treinamentos(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: StatusTreinamento | None = None,
) -> list[Treinamento]:
    query = db.query(Treinamento)
    if status:
        query = query.filter(Treinamento.status == status)
    return query.order_by(Treinamento.data_inicio.desc()).offset(skip).limit(limit).all()


def create_treinamento(db: Session, dados: TreinamentoCreate) -> Treinamento:
    treinamento = Treinamento(**dados.model_dump())
    db.add(treinamento)
    db.commit()
    db.refresh(treinamento)
    logger.info("Treinamento criado: id=%s titulo=%s", treinamento.id, treinamento.titulo)
    return treinamento


def update_treinamento(
    db: Session, treinamento_id: int, dados: TreinamentoUpdate
) -> Treinamento | None:
    treinamento = get_treinamento(db, treinamento_id)
    if not treinamento:
        return None
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(treinamento, campo, valor)
    db.commit()
    db.refresh(treinamento)
    logger.info("Treinamento atualizado: id=%s", treinamento_id)
    return treinamento


def delete_treinamento(db: Session, treinamento_id: int) -> bool:
    treinamento = get_treinamento(db, treinamento_id)
    if not treinamento:
        return False
    db.delete(treinamento)
    db.commit()
    logger.info("Treinamento removido: id=%s", treinamento_id)
    return True


def inscrever_bombeiro(
    db: Session, treinamento_id: int, dados: InscricaoRequest
) -> BombeiroTreinamento:
    inscricao = BombeiroTreinamento(
        treinamento_id=treinamento_id,
        bombeiro_id=dados.bombeiro_id,
        status_participacao=dados.status_participacao,
    )
    db.add(inscricao)
    db.commit()
    db.refresh(inscricao)
    logger.info(
        "Bombeiro id=%s inscrito no treinamento id=%s",
        dados.bombeiro_id, treinamento_id,
    )
    return inscricao


def get_inscritos(
    db: Session, treinamento_id: int
) -> list[BombeiroTreinamento]:
    return (
        db.query(BombeiroTreinamento)
        .filter(BombeiroTreinamento.treinamento_id == treinamento_id)
        .all()
    )
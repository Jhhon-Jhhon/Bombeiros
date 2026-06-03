import logging
from sqlalchemy.orm import Session
from app.models.manutencao import Manutencao
from app.models.enums import StatusManutencao
from app.schemas.manutencao import ManutencaoCreate, ManutencaoUpdate

logger = logging.getLogger("bombeiros")


def get_manutencao(db: Session, manutencao_id: int) -> Manutencao | None:
    return db.query(Manutencao).filter(Manutencao.id == manutencao_id).first()


def get_manutencoes(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: StatusManutencao | None = None,
    viatura_id: int | None = None,
    equipamento_id: int | None = None,
) -> list[Manutencao]:
    query = db.query(Manutencao)
    if status:
        query = query.filter(Manutencao.status == status)
    if viatura_id:
        query = query.filter(Manutencao.viatura_id == viatura_id)
    if equipamento_id:
        query = query.filter(Manutencao.equipamento_id == equipamento_id)
    return query.order_by(Manutencao.data_inicio.desc()).offset(skip).limit(limit).all()


def create_manutencao(db: Session, dados: ManutencaoCreate) -> Manutencao:
    manutencao = Manutencao(**dados.model_dump())
    db.add(manutencao)
    db.commit()
    db.refresh(manutencao)
    logger.info("Manutenção criada: id=%s", manutencao.id)
    return manutencao


def update_manutencao(
    db: Session, manutencao_id: int, dados: ManutencaoUpdate
) -> Manutencao | None:
    manutencao = get_manutencao(db, manutencao_id)
    if not manutencao:
        return None
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(manutencao, campo, valor)
    db.commit()
    db.refresh(manutencao)
    logger.info("Manutenção atualizada: id=%s", manutencao_id)
    return manutencao


def delete_manutencao(db: Session, manutencao_id: int) -> bool:
    manutencao = get_manutencao(db, manutencao_id)
    if not manutencao:
        return False
    db.delete(manutencao)
    db.commit()
    logger.info("Manutenção removida: id=%s", manutencao_id)
    return True
import logging
from sqlalchemy.orm import Session
from app.models.viatura import Viatura
from app.models.enums import StatusViatura
from app.schemas.viatura import ViaturaCreate, ViaturaUpdate

logger = logging.getLogger("bombeiros")


def get_viatura(db: Session, viatura_id: int) -> Viatura | None:
    return db.query(Viatura).filter(Viatura.id == viatura_id).first()


def get_viatura_por_placa(db: Session, placa: str) -> Viatura | None:
    return db.query(Viatura).filter(Viatura.placa == placa.upper()).first()


def get_viaturas(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: StatusViatura | None = None,
    tipo: str | None = None,
) -> list[Viatura]:
    query = db.query(Viatura)
    if status:
        query = query.filter(Viatura.status == status)
    if tipo:
        query = query.filter(Viatura.tipo == tipo)
    return query.order_by(Viatura.placa).offset(skip).limit(limit).all()


def create_viatura(db: Session, dados: ViaturaCreate) -> Viatura:
    viatura = Viatura(**dados.model_dump())
    db.add(viatura)
    db.commit()
    db.refresh(viatura)
    logger.info("Viatura criada: placa=%s id=%s", viatura.placa, viatura.id)
    return viatura


def update_viatura(
    db: Session, viatura_id: int, dados: ViaturaUpdate
) -> Viatura | None:
    viatura = get_viatura(db, viatura_id)
    if not viatura:
        return None
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(viatura, campo, valor)
    db.commit()
    db.refresh(viatura)
    logger.info("Viatura atualizada: id=%s", viatura_id)
    return viatura


def delete_viatura(db: Session, viatura_id: int) -> bool:
    viatura = get_viatura(db, viatura_id)
    if not viatura:
        return False
    db.delete(viatura)
    db.commit()
    logger.info("Viatura removida: id=%s", viatura_id)
    return True
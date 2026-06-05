import logging

from sqlalchemy.orm import Session

from app.models.denuncia import Denuncia
from app.models.enums import StatusDenuncia
from app.schemas.denuncia import DenunciaCreate, DenunciaUpdate

logger = logging.getLogger("bombeiros")


def get_denuncia(db: Session, denuncia_id: int) -> Denuncia | None:
    return db.query(Denuncia).filter(Denuncia.id == denuncia_id).first()


def get_denuncias(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: StatusDenuncia | None = None,
) -> list[Denuncia]:
    query = db.query(Denuncia)
    if status:
        query = query.filter(Denuncia.status == status)
    return query.order_by(Denuncia.data_denuncia.desc()).offset(skip).limit(limit).all()


def create_denuncia(db: Session, dados: DenunciaCreate) -> Denuncia:
    denuncia = Denuncia(**dados.model_dump())
    db.add(denuncia)
    db.commit()
    db.refresh(denuncia)
    logger.info("Denúncia registrada: id=%s tipo=%s", denuncia.id, denuncia.tipo)
    return denuncia


def update_denuncia(
    db: Session, denuncia_id: int, dados: DenunciaUpdate
) -> Denuncia | None:
    denuncia = get_denuncia(db, denuncia_id)
    if not denuncia:
        return None
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(denuncia, campo, valor)
    db.commit()
    db.refresh(denuncia)
    logger.info("Denúncia atualizada: id=%s", denuncia_id)
    return denuncia


def delete_denuncia(db: Session, denuncia_id: int) -> bool:
    denuncia = get_denuncia(db, denuncia_id)
    if not denuncia:
        return False
    db.delete(denuncia)
    db.commit()
    return True

import logging
from sqlalchemy.orm import Session
from app.models.equipamento import Equipamento
from app.models.enums import StatusEquipamento, TipoEquipamento
from app.schemas.equipamento import EquipamentoCreate, EquipamentoUpdate

logger = logging.getLogger("bombeiros")


def get_equipamento(db: Session, equipamento_id: int) -> Equipamento | None:
    return db.query(Equipamento).filter(Equipamento.id == equipamento_id).first()


def get_equipamento_por_serie(db: Session, numero_serie: str) -> Equipamento | None:
    return (
        db.query(Equipamento)
        .filter(Equipamento.numero_serie == numero_serie.upper())
        .first()
    )


def get_equipamentos(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: StatusEquipamento | None = None,
    tipo: TipoEquipamento | None = None,
) -> list[Equipamento]:
    query = db.query(Equipamento)
    if status:
        query = query.filter(Equipamento.status == status)
    if tipo:
        query = query.filter(Equipamento.tipo == tipo)
    return query.order_by(Equipamento.nome).offset(skip).limit(limit).all()


def create_equipamento(db: Session, dados: EquipamentoCreate) -> Equipamento:
    equipamento = Equipamento(**dados.model_dump())
    db.add(equipamento)
    db.commit()
    db.refresh(equipamento)
    logger.info("Equipamento criado: serie=%s id=%s", equipamento.numero_serie, equipamento.id)
    return equipamento


def update_equipamento(
    db: Session, equipamento_id: int, dados: EquipamentoUpdate
) -> Equipamento | None:
    equipamento = get_equipamento(db, equipamento_id)
    if not equipamento:
        return None
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(equipamento, campo, valor)
    db.commit()
    db.refresh(equipamento)
    logger.info("Equipamento atualizado: id=%s", equipamento_id)
    return equipamento


def delete_equipamento(db: Session, equipamento_id: int) -> bool:
    equipamento = get_equipamento(db, equipamento_id)
    if not equipamento:
        return False
    db.delete(equipamento)
    db.commit()
    logger.info("Equipamento removido: id=%s", equipamento_id)
    return True
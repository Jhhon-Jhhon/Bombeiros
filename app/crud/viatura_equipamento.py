import logging

from sqlalchemy.orm import Session

from app.models.equipamento import ViaturaEquipamento
from app.schemas.viatura_equipamento import (
    ViaturaEquipamentoCreate,
    ViaturaEquipamentoUpdate,
)

logger = logging.getLogger("bombeiros")


def get_associacao(
    db: Session, viatura_id: int, equipamento_id: int
) -> ViaturaEquipamento | None:
    return (
        db.query(ViaturaEquipamento)
        .filter(
            ViaturaEquipamento.viatura_id == viatura_id,
            ViaturaEquipamento.equipamento_id == equipamento_id,
        )
        .first()
    )


def get_equipamentos_viatura(
    db: Session, viatura_id: int
) -> list[ViaturaEquipamento]:
    return (
        db.query(ViaturaEquipamento)
        .filter(ViaturaEquipamento.viatura_id == viatura_id)
        .all()
    )


def associar_equipamento(
    db: Session, viatura_id: int, dados: ViaturaEquipamentoCreate
) -> ViaturaEquipamento:
    associacao = ViaturaEquipamento(
        viatura_id=viatura_id,
        equipamento_id=dados.equipamento_id,
        quantidade=dados.quantidade,
        observacao=dados.observacao,
    )
    db.add(associacao)
    db.commit()
    db.refresh(associacao)
    logger.info(
        "Equipamento id=%s associado à viatura id=%s",
        dados.equipamento_id, viatura_id,
    )
    return associacao


def update_associacao(
    db: Session,
    viatura_id: int,
    equipamento_id: int,
    dados: ViaturaEquipamentoUpdate,
) -> ViaturaEquipamento | None:
    associacao = get_associacao(db, viatura_id, equipamento_id)
    if not associacao:
        return None
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(associacao, campo, valor)
    db.commit()
    db.refresh(associacao)
    logger.info(
        "Associação viatura id=%s equipamento id=%s atualizada",
        viatura_id, equipamento_id,
    )
    return associacao


def remover_associacao(
    db: Session, viatura_id: int, equipamento_id: int
) -> bool:
    associacao = get_associacao(db, viatura_id, equipamento_id)
    if not associacao:
        return False
    db.delete(associacao)
    db.commit()
    logger.info(
        "Equipamento id=%s removido da viatura id=%s",
        equipamento_id, viatura_id,
    )
    return True

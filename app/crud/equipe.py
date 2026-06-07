import logging

from sqlalchemy.orm import Session

from app.models.bombeiro import BombeiroEquipe, Equipe
from app.schemas.equipe import (
    AdicionarBombeiroEquipeRequest,
    EquipeCreate,
    EquipeUpdate,
)

logger = logging.getLogger("bombeiros")


def get_equipe(db: Session, equipe_id: int) -> Equipe | None:
    return db.query(Equipe).filter(Equipe.id == equipe_id).first()


def get_equipe_por_nome(db: Session, nome: str) -> Equipe | None:
    return db.query(Equipe).filter(Equipe.nome == nome).first()


def get_equipes(
    db: Session, skip: int = 0, limit: int = 20
) -> list[Equipe]:
    return db.query(Equipe).order_by(Equipe.nome).offset(skip).limit(limit).all()


def create_equipe(db: Session, dados: EquipeCreate) -> Equipe:
    equipe = Equipe(**dados.model_dump())
    db.add(equipe)
    db.commit()
    db.refresh(equipe)
    logger.info("Equipe criada: id=%s nome=%s", equipe.id, equipe.nome)
    return equipe


def update_equipe(
    db: Session, equipe_id: int, dados: EquipeUpdate
) -> Equipe | None:
    equipe = get_equipe(db, equipe_id)
    if not equipe:
        return None
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(equipe, campo, valor)
    db.commit()
    db.refresh(equipe)
    logger.info("Equipe atualizada: id=%s", equipe_id)
    return equipe


def delete_equipe(db: Session, equipe_id: int) -> bool:
    equipe = get_equipe(db, equipe_id)
    if not equipe:
        return False
    db.delete(equipe)
    db.commit()
    logger.info("Equipe removida: id=%s", equipe_id)
    return True


def adicionar_bombeiro_equipe(
    db: Session, equipe_id: int, dados: AdicionarBombeiroEquipeRequest
) -> BombeiroEquipe:
    from datetime import date
    associacao = BombeiroEquipe(
        equipe_id=equipe_id,
        bombeiro_id=dados.bombeiro_id,
        funcao=dados.funcao,
        data_alocacao=dados.data_alocacao or date.today(),
    )
    db.add(associacao)
    db.commit()
    db.refresh(associacao)
    logger.info(
        "Bombeiro id=%s adicionado à equipe id=%s",
        dados.bombeiro_id, equipe_id,
    )
    return associacao


def get_membros_equipe(
    db: Session, equipe_id: int
) -> list[BombeiroEquipe]:
    return (
        db.query(BombeiroEquipe)
        .filter(BombeiroEquipe.equipe_id == equipe_id)
        .all()
    )

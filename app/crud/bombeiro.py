import logging
from sqlalchemy.orm import Session
from app.models.bombeiro import Bombeiro
from app.models.enums import StatusBombeiro
from app.schemas.bombeiro import BombeiroCreate, BombeiroUpdate

logger = logging.getLogger("bombeiros")


def get_bombeiro(db: Session, bombeiro_id: int) -> Bombeiro | None:
    """Busca um bombeiro pelo ID. Retorna None se não encontrar."""
    return db.query(Bombeiro).filter(Bombeiro.id == bombeiro_id).first()


def get_bombeiro_por_matricula(db: Session, matricula: str) -> Bombeiro | None:
    """Busca por matrícula — usado para verificar duplicatas."""
    return (
        db.query(Bombeiro)
        .filter(Bombeiro.matricula == matricula.upper())
        .first()
    )


def get_bombeiros(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: StatusBombeiro | None = None,
    nome: str | None = None,
) -> list[Bombeiro]:
    """
    Lista bombeiros com paginação e filtros opcionais.
    skip = quantos registros pular (offset)
    limit = quantos retornar (máximo por página)
    """
    query = db.query(Bombeiro)

    # Filtros opcionais — só aplica se o parâmetro foi informado
    if status:
        query = query.filter(Bombeiro.status == status)
    if nome:
        query = query.filter(Bombeiro.nome.ilike(f"%{nome}%"))

    return query.order_by(Bombeiro.nome).offset(skip).limit(limit).all()


def create_bombeiro(db: Session, dados: BombeiroCreate) -> Bombeiro:
    """Cria um novo bombeiro no banco."""
    bombeiro = Bombeiro(**dados.model_dump())
    db.add(bombeiro)
    db.commit()
    db.refresh(bombeiro)  # recarrega do banco para pegar id e created_at
    logger.info("Bombeiro criado: matricula=%s id=%s", bombeiro.matricula, bombeiro.id)
    return bombeiro


def update_bombeiro(
    db: Session, bombeiro_id: int, dados: BombeiroUpdate
) -> Bombeiro | None:
    """Atualiza apenas os campos informados (campos None são ignorados)."""
    bombeiro = get_bombeiro(db, bombeiro_id)
    if not bombeiro:
        return None

    # exclude_unset=True → só atualiza campos que o cliente enviou
    campos = dados.model_dump(exclude_unset=True)
    for campo, valor in campos.items():
        setattr(bombeiro, campo, valor)

    db.commit()
    db.refresh(bombeiro)
    logger.info("Bombeiro atualizado: id=%s campos=%s", bombeiro_id, list(campos.keys()))
    return bombeiro


def delete_bombeiro(db: Session, bombeiro_id: int) -> bool:
    """Remove o bombeiro. Retorna True se deletou, False se não encontrou."""
    bombeiro = get_bombeiro(db, bombeiro_id)
    if not bombeiro:
        return False

    db.delete(bombeiro)
    db.commit()
    logger.info("Bombeiro removido: id=%s", bombeiro_id)
    return True
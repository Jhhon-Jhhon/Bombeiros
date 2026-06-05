import logging

from sqlalchemy.orm import Session

from app.models.enums import StatusOcorrencia, StatusViatura
from app.models.ocorrencia import (
    EnderecoOcorrencia,
    Ocorrencia,
    OcorrenciaBombeiro,
    OcorrenciaViatura,
)
from app.models.viatura import Viatura
from app.schemas.ocorrencia import (
    AlocarBombeiroRequest,
    AlocarViaturaRequest,
    OcorrenciaCreate,
    OcorrenciaUpdate,
)

logger = logging.getLogger("bombeiros")


def get_ocorrencia(db: Session, ocorrencia_id: int) -> Ocorrencia | None:
    return db.query(Ocorrencia).filter(Ocorrencia.id == ocorrencia_id).first()


def get_ocorrencias(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    status: StatusOcorrencia | None = None,
) -> list[Ocorrencia]:
    query = db.query(Ocorrencia)
    if status:
        query = query.filter(Ocorrencia.status == status)
    return query.order_by(Ocorrencia.data_abertura.desc()).offset(skip).limit(limit).all()


def create_ocorrencia(db: Session, dados: OcorrenciaCreate) -> Ocorrencia:
    """Cria a ocorrência e o endereço numa única transação."""
    # Separa os dados do endereço dos dados da ocorrência
    endereco_dados = dados.endereco
    ocorrencia_dados = dados.model_dump(exclude={"endereco"})

    ocorrencia = Ocorrencia(**ocorrencia_dados)
    db.add(ocorrencia)
    db.flush()  # gera o id da ocorrência sem commitar ainda

    # Cria o endereço vinculado à ocorrência recém-criada
    endereco = EnderecoOcorrencia(
        **endereco_dados.model_dump(),
        ocorrencia_id=ocorrencia.id,
    )
    db.add(endereco)
    db.commit()
    db.refresh(ocorrencia)
    logger.info("Ocorrência criada: id=%s tipo=%s", ocorrencia.id, ocorrencia.tipo)
    return ocorrencia


def update_ocorrencia(
    db: Session, ocorrencia_id: int, dados: OcorrenciaUpdate
) -> Ocorrencia | None:
    from datetime import datetime, timezone
    ocorrencia = get_ocorrencia(db, ocorrencia_id)
    if not ocorrencia:
        return None

    campos = dados.model_dump(exclude_unset=True)

    # Se está encerrando, registra o timestamp
    if campos.get("status") == StatusOcorrencia.encerrada:
        campos["data_encerramento"] = datetime.now(timezone.utc)

    for campo, valor in campos.items():
        setattr(ocorrencia, campo, valor)

    db.commit()
    db.refresh(ocorrencia)
    logger.info("Ocorrência atualizada: id=%s", ocorrencia_id)
    return ocorrencia


def delete_ocorrencia(db: Session, ocorrencia_id: int) -> bool:
    ocorrencia = get_ocorrencia(db, ocorrencia_id)
    if not ocorrencia:
        return False
    db.delete(ocorrencia)
    db.commit()
    logger.info("Ocorrência removida: id=%s", ocorrencia_id)
    return True


# ── Alocação de Viatura ───────────────────────────────────────────────────────

def viatura_esta_em_atendimento(db: Session, viatura_id: int) -> bool:
    """Verifica se a viatura já está alocada a uma ocorrência ativa."""
    viatura = db.query(Viatura).filter(Viatura.id == viatura_id).first()
    if not viatura:
        return False
    return viatura.status == StatusViatura.em_atendimento


def alocar_viatura(
    db: Session, ocorrencia_id: int, dados: AlocarViaturaRequest
) -> OcorrenciaViatura:
    alocacao = OcorrenciaViatura(
        ocorrencia_id=ocorrencia_id,
        viatura_id=dados.viatura_id,
        funcao=dados.funcao,
    )
    db.add(alocacao)
    db.commit()
    db.refresh(alocacao)
    logger.info(
        "Viatura id=%s alocada à ocorrência id=%s",
        dados.viatura_id, ocorrencia_id
    )
    return alocacao


def get_viaturas_da_ocorrencia(
    db: Session, ocorrencia_id: int
) -> list[OcorrenciaViatura]:
    return (
        db.query(OcorrenciaViatura)
        .filter(OcorrenciaViatura.ocorrencia_id == ocorrencia_id)
        .all()
    )


# ── Alocação de Bombeiro ──────────────────────────────────────────────────────

def alocar_bombeiro(
    db: Session, ocorrencia_id: int, dados: AlocarBombeiroRequest
) -> OcorrenciaBombeiro:
    alocacao = OcorrenciaBombeiro(
        ocorrencia_id=ocorrencia_id,
        bombeiro_id=dados.bombeiro_id,
        funcao=dados.funcao,
    )
    db.add(alocacao)
    db.commit()
    db.refresh(alocacao)
    logger.info(
        "Bombeiro id=%s alocado à ocorrência id=%s",
        dados.bombeiro_id, ocorrencia_id
    )
    return alocacao

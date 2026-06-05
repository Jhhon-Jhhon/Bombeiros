import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud.bombeiro import get_bombeiro
from app.crud.ocorrencia import (
    alocar_bombeiro,
    alocar_viatura,
    create_ocorrencia,
    delete_ocorrencia,
    get_ocorrencia,
    get_ocorrencias,
    get_viaturas_da_ocorrencia,
    update_ocorrencia,
    viatura_esta_em_atendimento,
)
from app.crud.viatura import get_viatura
from app.database import get_db
from app.models.enums import StatusOcorrencia
from app.schemas.ocorrencia import (
    AlocarBombeiroRequest,
    AlocarViaturaRequest,
    OcorrenciaBombeiroResponse,
    OcorrenciaCreate,
    OcorrenciaResponse,
    OcorrenciaUpdate,
    OcorrenciaViaturaResponse,
)

logger = logging.getLogger("bombeiros")
router = APIRouter(prefix="/ocorrencias", tags=["Ocorrências"])


@router.post("/", response_model=OcorrenciaResponse, status_code=status.HTTP_201_CREATED)
def criar_ocorrencia(dados: OcorrenciaCreate, db: Session = Depends(get_db)):
    """Registra uma nova ocorrência com endereço."""
    return create_ocorrencia(db, dados)


@router.get("/", response_model=list[OcorrenciaResponse])
def listar_ocorrencias(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status: StatusOcorrencia | None = Query(default=None),
    db: Session = Depends(get_db),
):
    """Lista ocorrências com paginação e filtro opcional por status."""
    return get_ocorrencias(db, skip=skip, limit=limit, status=status)


@router.get("/{ocorrencia_id}", response_model=OcorrenciaResponse)
def buscar_ocorrencia(ocorrencia_id: int, db: Session = Depends(get_db)):
    ocorrencia = get_ocorrencia(db, ocorrencia_id)
    if not ocorrencia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ocorrência id={ocorrencia_id} não encontrada",
        )
    return ocorrencia


@router.put("/{ocorrencia_id}", response_model=OcorrenciaResponse)
def atualizar_ocorrencia(
    ocorrencia_id: int, dados: OcorrenciaUpdate, db: Session = Depends(get_db)
):
    """Atualiza ocorrência. Ao mudar status para 'encerrada', registra data_encerramento."""
    ocorrencia = update_ocorrencia(db, ocorrencia_id, dados)
    if not ocorrencia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ocorrência id={ocorrencia_id} não encontrada",
        )
    return ocorrencia


@router.delete("/{ocorrencia_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_ocorrencia(ocorrencia_id: int, db: Session = Depends(get_db)):
    if not delete_ocorrencia(db, ocorrencia_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ocorrência id={ocorrencia_id} não encontrada",
        )


# ═══════════════════════════════════════════════════════════════
# REGRA DE NEGÓCIO OBRIGATÓRIA — Alocação de viatura
# Validação em dois níveis: aplicação (409) + banco (trigger)
# ═══════════════════════════════════════════════════════════════

@router.post(
    "/{ocorrencia_id}/viaturas",
    response_model=OcorrenciaViaturaResponse,
    status_code=status.HTTP_201_CREATED,
)
def alocar_viatura_ocorrencia(
    ocorrencia_id: int,
    dados: AlocarViaturaRequest,
    db: Session = Depends(get_db),
):
    """
    Aloca uma viatura a uma ocorrência.

    REGRA DE NEGÓCIO (RN01): viatura com status 'em_atendimento'
    não pode ser alocada. Retorna 409 se já estiver em uso.
    """
    # Verifica se a ocorrência existe
    ocorrencia = get_ocorrencia(db, ocorrencia_id)
    if not ocorrencia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ocorrência id={ocorrencia_id} não encontrada",
        )

    # Verifica se a viatura existe
    viatura = get_viatura(db, dados.viatura_id)
    if not viatura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Viatura id={dados.viatura_id} não encontrada",
        )

    # ── REGRA DE NEGÓCIO — Nível 1: aplicação ──────────────────
    # Verifica se a viatura já está em atendimento
    if viatura_esta_em_atendimento(db, dados.viatura_id):
        logger.warning(
            "Tentativa de alocar viatura id=%s em atendimento à ocorrência id=%s",
            dados.viatura_id, ocorrencia_id,
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Viatura id={dados.viatura_id} está em atendimento e não pode "
                "ser alocada a uma nova ocorrência até que a atual seja encerrada."
            ),
        )
    # ── Nível 2: trigger no PostgreSQL (implementado no Passo 4) ──

    return alocar_viatura(db, ocorrencia_id, dados)


@router.get(
    "/{ocorrencia_id}/viaturas",
    response_model=list[OcorrenciaViaturaResponse],
)
def listar_viaturas_ocorrencia(
    ocorrencia_id: int, db: Session = Depends(get_db)
):
    """Lista todas as viaturas alocadas a uma ocorrência."""
    if not get_ocorrencia(db, ocorrencia_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ocorrência id={ocorrencia_id} não encontrada",
        )
    return get_viaturas_da_ocorrencia(db, ocorrencia_id)


@router.post(
    "/{ocorrencia_id}/bombeiros",
    response_model=OcorrenciaBombeiroResponse,
    status_code=status.HTTP_201_CREATED,
)
def alocar_bombeiro_ocorrencia(
    ocorrencia_id: int,
    dados: AlocarBombeiroRequest,
    db: Session = Depends(get_db),
):
    """Associa um bombeiro a uma ocorrência."""
    if not get_ocorrencia(db, ocorrencia_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ocorrência id={ocorrencia_id} não encontrada",
        )
    if not get_bombeiro(db, dados.bombeiro_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bombeiro id={dados.bombeiro_id} não encontrado",
        )
    return alocar_bombeiro(db, ocorrencia_id, dados)

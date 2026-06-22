import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud.bombeiro import get_bombeiro
from app.crud.treinamento import (
    create_treinamento,
    delete_treinamento,
    get_inscritos,
    get_treinamento,
    get_treinamentos,
    inscrever_bombeiro,
    update_inscricao,
    update_treinamento,
)
from app.database import get_db
from app.models.enums import StatusTreinamento
from app.schemas.treinamento import (
    InscricaoRequest,
    InscricaoResponse,
    InscricaoUpdate,
    TreinamentoCreate,
    TreinamentoResponse,
    TreinamentoUpdate,
)

logger = logging.getLogger("bombeiros")
router = APIRouter(prefix="/treinamentos", tags=["Treinamentos"])


@router.post("/", response_model=TreinamentoResponse, status_code=status.HTTP_201_CREATED)
def criar_treinamento(dados: TreinamentoCreate, db: Session = Depends(get_db)):
    return create_treinamento(db, dados)


@router.get("/", response_model=list[TreinamentoResponse])
def listar_treinamentos(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status: StatusTreinamento | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return get_treinamentos(db, skip=skip, limit=limit, status=status)


@router.get("/{treinamento_id}", response_model=TreinamentoResponse)
def buscar_treinamento(treinamento_id: int, db: Session = Depends(get_db)):
    treinamento = get_treinamento(db, treinamento_id)
    if not treinamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Treinamento id={treinamento_id} não encontrado",
        )
    return treinamento


@router.put("/{treinamento_id}", response_model=TreinamentoResponse)
def atualizar_treinamento(
    treinamento_id: int, dados: TreinamentoUpdate, db: Session = Depends(get_db)
):
    treinamento = update_treinamento(db, treinamento_id, dados)
    if not treinamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Treinamento id={treinamento_id} não encontrado",
        )
    return treinamento


@router.delete("/{treinamento_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_treinamento(treinamento_id: int, db: Session = Depends(get_db)):
    if not delete_treinamento(db, treinamento_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Treinamento id={treinamento_id} não encontrado",
        )


@router.post(
    "/{treinamento_id}/bombeiros",
    response_model=InscricaoResponse,
    status_code=status.HTTP_201_CREATED,
)
def inscrever_bombeiro_treinamento(
    treinamento_id: int,
    dados: InscricaoRequest,
    db: Session = Depends(get_db),
):
    """Inscreve um bombeiro em um treinamento."""
    if not get_treinamento(db, treinamento_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Treinamento id={treinamento_id} não encontrado",
        )
    if not get_bombeiro(db, dados.bombeiro_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bombeiro id={dados.bombeiro_id} não encontrado",
        )
    return inscrever_bombeiro(db, treinamento_id, dados)


@router.get(
    "/{treinamento_id}/bombeiros",
    response_model=list[InscricaoResponse],
)
def listar_inscritos(treinamento_id: int, db: Session = Depends(get_db)):
    """Lista todos os bombeiros inscritos em um treinamento."""
    if not get_treinamento(db, treinamento_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Treinamento id={treinamento_id} não encontrado",
        )
    return get_inscritos(db, treinamento_id)


@router.put(
    "/{treinamento_id}/bombeiros/{bombeiro_id}",
    response_model=InscricaoResponse,
)
def atualizar_inscricao_bombeiro(
    treinamento_id: int,
    bombeiro_id: int,
    dados: InscricaoUpdate,
    db: Session = Depends(get_db),
):
    """Atualiza status de participação de um bombeiro no treinamento."""
    inscricao = update_inscricao(db, treinamento_id, bombeiro_id, dados)
    if not inscricao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inscrição não encontrada para treinamento={treinamento_id} bombeiro={bombeiro_id}",
        )
    return inscricao
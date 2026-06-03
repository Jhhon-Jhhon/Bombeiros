import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.crud.solicitacao import (
    create_solicitacao, delete_solicitacao,
    get_solicitacao, get_solicitacoes, update_solicitacao,
)
from app.database import get_db
from app.models.enums import StatusSolicitacao
from app.schemas.solicitacao import (
    SolicitacaoCreate, SolicitacaoResponse, SolicitacaoUpdate,
)

logger = logging.getLogger("bombeiros")
router = APIRouter(prefix="/solicitacoes", tags=["Solicitações"])


@router.post("/", response_model=SolicitacaoResponse, status_code=status.HTTP_201_CREATED)
def criar_solicitacao(dados: SolicitacaoCreate, db: Session = Depends(get_db)):
    """Cria uma solicitação a partir de uma denúncia verificada."""
    return create_solicitacao(db, dados)


@router.get("/", response_model=list[SolicitacaoResponse])
def listar_solicitacoes(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status: StatusSolicitacao | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return get_solicitacoes(db, skip=skip, limit=limit, status=status)


@router.get("/{solicitacao_id}", response_model=SolicitacaoResponse)
def buscar_solicitacao(solicitacao_id: int, db: Session = Depends(get_db)):
    solicitacao = get_solicitacao(db, solicitacao_id)
    if not solicitacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Solicitação id={solicitacao_id} não encontrada",
        )
    return solicitacao


@router.put("/{solicitacao_id}", response_model=SolicitacaoResponse)
def atualizar_solicitacao(
    solicitacao_id: int, dados: SolicitacaoUpdate, db: Session = Depends(get_db)
):
    """Verifica ou arquiva uma solicitação. Timestamps gerados automaticamente."""
    solicitacao = update_solicitacao(db, solicitacao_id, dados)
    if not solicitacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Solicitação id={solicitacao_id} não encontrada",
        )
    return solicitacao


@router.delete("/{solicitacao_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_solicitacao(solicitacao_id: int, db: Session = Depends(get_db)):
    if not delete_solicitacao(db, solicitacao_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Solicitação id={solicitacao_id} não encontrada",
        )
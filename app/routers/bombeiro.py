import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud.bombeiro import (
    create_bombeiro,
    delete_bombeiro,
    get_bombeiro,
    get_bombeiros,
    get_bombeiro_por_matricula,
    update_bombeiro,
)
from app.database import get_db
from app.models.enums import StatusBombeiro
from app.schemas.bombeiro import BombeiroCreate, BombeiroResponse, BombeiroUpdate

logger = logging.getLogger("bombeiros")

router = APIRouter(prefix="/bombeiros", tags=["Bombeiros"])


@router.post("/", response_model=BombeiroResponse, status_code=status.HTTP_201_CREATED)
def criar_bombeiro(dados: BombeiroCreate, db: Session = Depends(get_db)):
    """Registra um novo bombeiro na sede."""
    # Verifica matrícula duplicada → 409 Conflict
    existente = get_bombeiro_por_matricula(db, dados.matricula)
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existe um bombeiro com a matrícula '{dados.matricula}'",
        )
    return create_bombeiro(db, dados)


@router.get("/", response_model=list[BombeiroResponse])
def listar_bombeiros(
    skip: int = Query(default=0, ge=0, description="Registros a pular"),
    limit: int = Query(default=20, ge=1, le=100, description="Máximo por página"),
    status: StatusBombeiro | None = Query(default=None, description="Filtrar por status"),
    nome: str | None = Query(default=None, description="Filtrar por nome (parcial)"),
    db: Session = Depends(get_db),
):
    """Lista bombeiros com paginação e filtros opcionais."""
    return get_bombeiros(db, skip=skip, limit=limit, status=status, nome=nome)


@router.get("/{bombeiro_id}", response_model=BombeiroResponse)
def buscar_bombeiro(bombeiro_id: int, db: Session = Depends(get_db)):
    """Busca um bombeiro pelo ID."""
    bombeiro = get_bombeiro(db, bombeiro_id)
    if not bombeiro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bombeiro com id={bombeiro_id} não encontrado",
        )
    return bombeiro


@router.put("/{bombeiro_id}", response_model=BombeiroResponse)
def atualizar_bombeiro(
    bombeiro_id: int, dados: BombeiroUpdate, db: Session = Depends(get_db)
):
    """Atualiza dados de um bombeiro. Apenas os campos enviados são alterados."""
    bombeiro = update_bombeiro(db, bombeiro_id, dados)
    if not bombeiro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bombeiro com id={bombeiro_id} não encontrado",
        )
    return bombeiro


@router.delete("/{bombeiro_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_bombeiro(bombeiro_id: int, db: Session = Depends(get_db)):
    """Remove um bombeiro. Retorna 204 sem corpo na resposta."""
    removido = delete_bombeiro(db, bombeiro_id)
    if not removido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bombeiro com id={bombeiro_id} não encontrado",
        )
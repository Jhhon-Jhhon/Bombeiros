import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud.bombeiro import get_bombeiro
from app.crud.equipe import (
    adicionar_bombeiro_equipe,
    create_equipe,
    delete_equipe,
    get_equipe,
    get_equipe_por_nome,
    get_equipes,
    get_membros_equipe,
    update_equipe,
)
from app.database import get_db
from app.schemas.equipe import (
    AdicionarBombeiroEquipeRequest,
    BombeiroEquipeResponse,
    EquipeCreate,
    EquipeResponse,
    EquipeUpdate,
)

logger = logging.getLogger("bombeiros")
router = APIRouter(prefix="/equipes", tags=["Equipes"])


@router.post("/", response_model=EquipeResponse, status_code=status.HTTP_201_CREATED)
def criar_equipe(dados: EquipeCreate, db: Session = Depends(get_db)):
    if get_equipe_por_nome(db, dados.nome):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existe uma equipe com o nome '{dados.nome}'",
        )
    return create_equipe(db, dados)


@router.get("/", response_model=list[EquipeResponse])
def listar_equipes(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return get_equipes(db, skip=skip, limit=limit)


@router.get("/{equipe_id}", response_model=EquipeResponse)
def buscar_equipe(equipe_id: int, db: Session = Depends(get_db)):
    equipe = get_equipe(db, equipe_id)
    if not equipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipe id={equipe_id} não encontrada",
        )
    return equipe


@router.put("/{equipe_id}", response_model=EquipeResponse)
def atualizar_equipe(
    equipe_id: int, dados: EquipeUpdate, db: Session = Depends(get_db)
):
    equipe = update_equipe(db, equipe_id, dados)
    if not equipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipe id={equipe_id} não encontrada",
        )
    return equipe


@router.delete("/{equipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_equipe(equipe_id: int, db: Session = Depends(get_db)):
    if not delete_equipe(db, equipe_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipe id={equipe_id} não encontrada",
        )


@router.post(
    "/{equipe_id}/bombeiros",
    response_model=BombeiroEquipeResponse,
    status_code=status.HTTP_201_CREATED,
)
def adicionar_membro(
    equipe_id: int,
    dados: AdicionarBombeiroEquipeRequest,
    db: Session = Depends(get_db),
):
    """Adiciona um bombeiro a uma equipe."""
    if not get_equipe(db, equipe_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipe id={equipe_id} não encontrada",
        )
    if not get_bombeiro(db, dados.bombeiro_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bombeiro id={dados.bombeiro_id} não encontrado",
        )
    return adicionar_bombeiro_equipe(db, equipe_id, dados)


@router.get(
    "/{equipe_id}/bombeiros",
    response_model=list[BombeiroEquipeResponse],
)
def listar_membros(equipe_id: int, db: Session = Depends(get_db)):
    """Lista todos os membros de uma equipe."""
    if not get_equipe(db, equipe_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipe id={equipe_id} não encontrada",
        )
    return get_membros_equipe(db, equipe_id)

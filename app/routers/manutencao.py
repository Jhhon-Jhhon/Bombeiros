import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud.manutencao import (
    create_manutencao,
    delete_manutencao,
    get_manutencao,
    get_manutencoes,
    update_manutencao,
)
from app.database import get_db
from app.models.enums import StatusManutencao
from app.schemas.manutencao import (
    ManutencaoCreate,
    ManutencaoResponse,
    ManutencaoUpdate,
)

logger = logging.getLogger("bombeiros")
router = APIRouter(prefix="/manutencoes", tags=["Manutenções"])


@router.post("/", response_model=ManutencaoResponse, status_code=status.HTTP_201_CREATED)
def criar_manutencao(dados: ManutencaoCreate, db: Session = Depends(get_db)):
    return create_manutencao(db, dados)


@router.get("/", response_model=list[ManutencaoResponse])
def listar_manutencoes(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status: StatusManutencao | None = Query(default=None),
    viatura_id: int | None = Query(default=None),
    equipamento_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return get_manutencoes(
        db, skip=skip, limit=limit, status=status,
        viatura_id=viatura_id, equipamento_id=equipamento_id,
    )


@router.get("/{manutencao_id}", response_model=ManutencaoResponse)
def buscar_manutencao(manutencao_id: int, db: Session = Depends(get_db)):
    manutencao = get_manutencao(db, manutencao_id)
    if not manutencao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Manutenção id={manutencao_id} não encontrada",
        )
    return manutencao


@router.put("/{manutencao_id}", response_model=ManutencaoResponse)
def atualizar_manutencao(
    manutencao_id: int, dados: ManutencaoUpdate, db: Session = Depends(get_db)
):
    manutencao = update_manutencao(db, manutencao_id, dados)
    if not manutencao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Manutenção id={manutencao_id} não encontrada",
        )
    return manutencao


@router.delete("/{manutencao_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_manutencao(manutencao_id: int, db: Session = Depends(get_db)):
    if not delete_manutencao(db, manutencao_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Manutenção id={manutencao_id} não encontrada",
        )

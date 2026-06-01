import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.crud.viatura import (
    create_viatura, delete_viatura, get_viatura,
    get_viaturas, get_viatura_por_placa, update_viatura,
)
from app.database import get_db
from app.models.enums import StatusViatura, TipoViatura
from app.schemas.viatura import ViaturaCreate, ViaturaResponse, ViaturaUpdate

logger = logging.getLogger("bombeiros")
router = APIRouter(prefix="/viaturas", tags=["Viaturas"])


@router.post("/", response_model=ViaturaResponse, status_code=status.HTTP_201_CREATED)
def criar_viatura(dados: ViaturaCreate, db: Session = Depends(get_db)):
    if get_viatura_por_placa(db, dados.placa):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existe uma viatura com a placa '{dados.placa}'",
        )
    return create_viatura(db, dados)


@router.get("/", response_model=list[ViaturaResponse])
def listar_viaturas(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status: StatusViatura | None = Query(default=None),
    tipo: TipoViatura | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return get_viaturas(db, skip=skip, limit=limit, status=status, tipo=tipo)


@router.get("/{viatura_id}", response_model=ViaturaResponse)
def buscar_viatura(viatura_id: int, db: Session = Depends(get_db)):
    viatura = get_viatura(db, viatura_id)
    if not viatura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Viatura id={viatura_id} não encontrada")
    return viatura


@router.put("/{viatura_id}", response_model=ViaturaResponse)
def atualizar_viatura(
    viatura_id: int, dados: ViaturaUpdate, db: Session = Depends(get_db)
):
    viatura = update_viatura(db, viatura_id, dados)
    if not viatura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Viatura id={viatura_id} não encontrada")
    return viatura


@router.delete("/{viatura_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_viatura(viatura_id: int, db: Session = Depends(get_db)):
    if not delete_viatura(db, viatura_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Viatura id={viatura_id} não encontrada")
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud.denuncia import (
    create_denuncia,
    delete_denuncia,
    get_denuncia,
    get_denuncias,
    update_denuncia,
)
from app.database import get_db
from app.models.enums import StatusDenuncia
from app.schemas.denuncia import DenunciaCreate, DenunciaResponse, DenunciaUpdate

logger = logging.getLogger("bombeiros")
router = APIRouter(prefix="/denuncias", tags=["Denúncias"])


@router.post("/", response_model=DenunciaResponse, status_code=status.HTTP_201_CREATED)
def criar_denuncia(dados: DenunciaCreate, db: Session = Depends(get_db)):
    """Registra uma nova denúncia recebida pelo Comandante."""
    return create_denuncia(db, dados)


@router.get("/", response_model=list[DenunciaResponse])
def listar_denuncias(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status: StatusDenuncia | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return get_denuncias(db, skip=skip, limit=limit, status=status)


@router.get("/{denuncia_id}", response_model=DenunciaResponse)
def buscar_denuncia(denuncia_id: int, db: Session = Depends(get_db)):
    denuncia = get_denuncia(db, denuncia_id)
    if not denuncia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Denúncia id={denuncia_id} não encontrada",
        )
    return denuncia


@router.put("/{denuncia_id}", response_model=DenunciaResponse)
def atualizar_denuncia(
    denuncia_id: int, dados: DenunciaUpdate, db: Session = Depends(get_db)
):
    denuncia = update_denuncia(db, denuncia_id, dados)
    if not denuncia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Denúncia id={denuncia_id} não encontrada",
        )
    return denuncia


@router.delete("/{denuncia_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_denuncia(denuncia_id: int, db: Session = Depends(get_db)):
    if not delete_denuncia(db, denuncia_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Denúncia id={denuncia_id} não encontrada",
        )

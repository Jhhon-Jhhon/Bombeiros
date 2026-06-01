import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.crud.equipamento import (
    create_equipamento, delete_equipamento, get_equipamento,
    get_equipamentos, get_equipamento_por_serie, update_equipamento,
)
from app.database import get_db
from app.models.enums import StatusEquipamento, TipoEquipamento
from app.schemas.equipamento import (
    EquipamentoCreate, EquipamentoResponse, EquipamentoUpdate,
)

logger = logging.getLogger("bombeiros")
router = APIRouter(prefix="/equipamentos", tags=["Equipamentos"])


@router.post("/", response_model=EquipamentoResponse, status_code=status.HTTP_201_CREATED)
def criar_equipamento(dados: EquipamentoCreate, db: Session = Depends(get_db)):
    if get_equipamento_por_serie(db, dados.numero_serie):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existe um equipamento com o número de série '{dados.numero_serie}'",
        )
    return create_equipamento(db, dados)


@router.get("/", response_model=list[EquipamentoResponse])
def listar_equipamentos(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status: StatusEquipamento | None = Query(default=None),
    tipo: TipoEquipamento | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return get_equipamentos(db, skip=skip, limit=limit, status=status, tipo=tipo)


@router.get("/{equipamento_id}", response_model=EquipamentoResponse)
def buscar_equipamento(equipamento_id: int, db: Session = Depends(get_db)):
    equipamento = get_equipamento(db, equipamento_id)
    if not equipamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipamento id={equipamento_id} não encontrado",
        )
    return equipamento


@router.put("/{equipamento_id}", response_model=EquipamentoResponse)
def atualizar_equipamento(
    equipamento_id: int, dados: EquipamentoUpdate, db: Session = Depends(get_db)
):
    equipamento = update_equipamento(db, equipamento_id, dados)
    if not equipamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipamento id={equipamento_id} não encontrado",
        )
    return equipamento


@router.delete("/{equipamento_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_equipamento(equipamento_id: int, db: Session = Depends(get_db)):
    if not delete_equipamento(db, equipamento_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipamento id={equipamento_id} não encontrado",
        )
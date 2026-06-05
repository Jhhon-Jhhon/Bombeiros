import logging

from fastapi import FastAPI

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.routers import (
    bombeiro,
    denuncia,
    equipamento,
    manutencao,
    ocorrencia,
    solicitacao,
    treinamento,
    viatura,
)

setup_logging(debug=settings.DEBUG)
logger = logging.getLogger("bombeiros")

app = FastAPI(
    title="API Bombeiros",
    description="Sistema de gestão de chamados — Sede de Bombeiros",
    version="0.1.0",
)

app.include_router(bombeiro.router)
app.include_router(viatura.router)
app.include_router(equipamento.router)
app.include_router(ocorrencia.router)
app.include_router(manutencao.router)
app.include_router(treinamento.router)
app.include_router(denuncia.router)
app.include_router(solicitacao.router)



@app.get("/")
def health_check():
    logger.info("Health check requisitado")
    return {"status": "ok", "message": "API Bombeiros funcionando"}

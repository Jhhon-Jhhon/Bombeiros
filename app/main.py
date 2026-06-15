import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.routers import (
    bombeiro,
    denuncia,
    equipamento,
    equipe,
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bombeiro.router)
app.include_router(viatura.router)
app.include_router(equipamento.router)
app.include_router(ocorrencia.router)
app.include_router(manutencao.router)
app.include_router(treinamento.router)
app.include_router(denuncia.router)
app.include_router(solicitacao.router)
app.include_router(equipe.router)


@app.get("/")
def health_check():
    logger.info("Health check requisitado")
    return {"status": "ok", "message": "API Bombeiros funcionando"}
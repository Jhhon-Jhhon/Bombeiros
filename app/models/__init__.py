from app.models.bombeiro import Bombeiro, BombeiroEquipe, Equipe
from app.models.denuncia import Denuncia
from app.models.equipamento import Equipamento, ViaturaEquipamento
from app.models.manutencao import Manutencao
from app.models.ocorrencia import (
    EnderecoOcorrencia,
    Ocorrencia,
    OcorrenciaBombeiro,
    OcorrenciaViatura,
)
from app.models.solicitacao import Solicitacao
from app.models.treinamento import BombeiroTreinamento, Treinamento
from app.models.viatura import Viatura  # ← linha que estava faltando

__all__ = [
    "Bombeiro",
    "BombeiroEquipe",
    "BombeiroTreinamento",
    "Denuncia",
    "EnderecoOcorrencia",
    "Equipe",
    "Equipamento",
    "Manutencao",
    "Ocorrencia",
    "OcorrenciaBombeiro",
    "OcorrenciaViatura",
    "Solicitacao",
    "Treinamento",
    "Viatura",
    "ViaturaEquipamento",
]

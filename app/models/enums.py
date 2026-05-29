import enum


class StatusBombeiro(enum.Enum):
    ativo = "ativo"
    inativo = "inativo"
    de_folga = "de_folga"


class PatenteBombeiro(enum.Enum):
    soldado = "soldado"
    cabo = "cabo"
    sargento = "sargento"
    tenente = "tenente"
    capitao = "capitao"


class StatusEquipe(enum.Enum):
    ativa = "ativa"
    inativa = "inativa"


class StatusViatura(enum.Enum):
    disponivel = "disponivel"
    em_atendimento = "em_atendimento"
    em_manutencao = "em_manutencao"


class TipoViatura(enum.Enum):
    auto_bomba = "auto_bomba"
    auto_escada = "auto_escada"
    ambulancia = "ambulancia"
    veiculo_leve = "veiculo_leve"


class StatusOcorrencia(enum.Enum):
    aberta = "aberta"
    em_andamento = "em_andamento"
    encerrada = "encerrada"


class PrioridadeOcorrencia(enum.Enum):
    baixa = "baixa"
    media = "media"
    alta = "alta"
    critica = "critica"


class TipoOcorrencia(enum.Enum):
    incendio = "incendio"
    acidente = "acidente"
    resgate = "resgate"
    inundacao = "inundacao"
    outros = "outros"


class StatusEquipamento(enum.Enum):
    disponivel = "disponivel"
    em_uso = "em_uso"
    em_manutencao = "em_manutencao"


class TipoEquipamento(enum.Enum):
    combate = "combate"
    resgate = "resgate"
    medico = "medico"
    comunicacao = "comunicacao"


class TipoManutencao(enum.Enum):
    preventiva = "preventiva"
    corretiva = "corretiva"


class StatusManutencao(enum.Enum):
    pendente = "pendente"
    em_andamento = "em_andamento"
    concluida = "concluida"


class TipoTreinamento(enum.Enum):
    teorico = "teorico"
    pratico = "pratico"


class StatusTreinamento(enum.Enum):
    agendado = "agendado"
    em_andamento = "em_andamento"
    concluido = "concluido"
    cancelado = "cancelado"


class StatusParticipacao(enum.Enum):
    inscrito = "inscrito"
    concluido = "concluido"
    reprovado = "reprovado"
    desistiu = "desistiu"


class StatusDenuncia(enum.Enum):
    pendente = "pendente"
    em_analise = "em_analise"
    arquivada = "arquivada"
    convertida = "convertida"


class StatusSolicitacao(enum.Enum):
    recebida = "recebida"
    verificada = "verificada"
    arquivada = "arquivada"
    convertida = "convertida"
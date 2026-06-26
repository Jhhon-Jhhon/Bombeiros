import os
import sys
from datetime import date, datetime, timezone
from decimal import Decimal

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.bombeiro import Bombeiro
from app.models.denuncia import Denuncia
from app.models.enums import (
    PatenteBombeiro,
    PrioridadeOcorrencia,
    StatusBombeiro,
    StatusDenuncia,
    StatusEquipamento,
    StatusManutencao,
    StatusOcorrencia,
    StatusTreinamento,
    StatusViatura,
    TipoEquipamento,
    TipoManutencao,
    TipoOcorrencia,
    TipoTreinamento,
    TipoViatura,
)
from app.models.equipamento import Equipamento
from app.models.manutencao import Manutencao
from app.models.ocorrencia import EnderecoOcorrencia, Ocorrencia
from app.models.treinamento import Treinamento
from app.models.viatura import Viatura


def limpar_banco(db):
    """Remove todos os dados existentes antes de popular."""
    print("🧹 Limpando banco de dados...")
    from sqlalchemy import text
    db.execute(text("""
        TRUNCATE TABLE ocorrencia_viatura, ocorrencia_bombeiro,
                       endereco_ocorrencia, ocorrencia,
                       viatura_equipamento, manutencao,
                       bombeiro_treinamento, treinamento,
                       bombeiro_equipe, equipe,
                       solicitacao, denuncia,
                       equipamento, viatura, bombeiro
        RESTART IDENTITY CASCADE
    """))
    db.commit()
    print("✅ Banco limpo!")


def seed_bombeiros(db):
    print("👨‍🚒 Inserindo bombeiros...")
    bombeiros = [
        Bombeiro(
            nome="Carlos Eduardo Silva",
            matricula="CB-001",
            patente=PatenteBombeiro.capitao,
            especialidade="Comando e Gestão",
            telefone="61999990001",
            email="carlos.silva@bombeiros.df.gov.br",
            status=StatusBombeiro.ativo,
            data_admissao=date(2005, 3, 10),
        ),
        Bombeiro(
            nome="Ana Paula Ferreira",
            matricula="CB-002",
            patente=PatenteBombeiro.tenente,
            especialidade="Combate a Incêndio",
            telefone="61999990002",
            email="ana.ferreira@bombeiros.df.gov.br",
            status=StatusBombeiro.ativo,
            data_admissao=date(2012, 7, 15),
        ),
        Bombeiro(
            nome="Roberto Mendes Costa",
            matricula="CB-003",
            patente=PatenteBombeiro.sargento,
            especialidade="Resgate em Altura",
            telefone="61999990003",
            email="roberto.costa@bombeiros.df.gov.br",
            status=StatusBombeiro.ativo,
            data_admissao=date(2015, 1, 20),
        ),
        Bombeiro(
            nome="Fernanda Lima Santos",
            matricula="CB-004",
            patente=PatenteBombeiro.cabo,
            especialidade="Atendimento Pré-Hospitalar",
            telefone="61999990004",
            email="fernanda.santos@bombeiros.df.gov.br",
            status=StatusBombeiro.ativo,
            data_admissao=date(2018, 9, 5),
        ),
        Bombeiro(
            nome="Marcos Oliveira Pinto",
            matricula="CB-005",
            patente=PatenteBombeiro.soldado,
            especialidade="Combate a Incêndio",
            telefone="61999990005",
            email="marcos.pinto@bombeiros.df.gov.br",
            status=StatusBombeiro.ativo,
            data_admissao=date(2021, 4, 12),
        ),
        Bombeiro(
            nome="Juliana Carvalho Rocha",
            matricula="CB-006",
            patente=PatenteBombeiro.soldado,
            especialidade="Mergulho e Salvamento Aquático",
            telefone="61999990006",
            email="juliana.rocha@bombeiros.df.gov.br",
            status=StatusBombeiro.de_folga,
            data_admissao=date(2020, 11, 30),
        ),
    ]
    for b in bombeiros:
        db.add(b)
    db.commit()
    print(f"  ✅ {len(bombeiros)} bombeiros inseridos")
    return bombeiros


def seed_viaturas(db):
    print("🚒 Inserindo viaturas...")
    viaturas = [
        Viatura(
            placa="DF-001-AB",
            modelo="Scania P360 AutoBomba",
            tipo=TipoViatura.auto_bomba,
            ano_fabricacao=2019,
            status=StatusViatura.disponivel,   # disponivel — sem manutenção ativa
        ),
        Viatura(
            placa="DF-002-AB",
            modelo="Mercedes-Benz Atron AutoEscada",
            tipo=TipoViatura.auto_escada,
            ano_fabricacao=2021,
            status=StatusViatura.disponivel,   # disponivel
        ),
        Viatura(
            placa="DF-003-AB",
            modelo="Mercedes-Benz Sprinter UTI",
            tipo=TipoViatura.ambulancia,
            ano_fabricacao=2022,
            status=StatusViatura.disponivel,   # disponivel
        ),
        # DF-004-AB: em_manutencao — terá manutenção pendente vinculada abaixo
        Viatura(
            placa="DF-004-AB",
            modelo="Toyota Hilux Veículo Leve",
            tipo=TipoViatura.veiculo_leve,
            ano_fabricacao=2020,
            status=StatusViatura.em_manutencao,
        ),
    ]
    for v in viaturas:
        db.add(v)
    db.commit()
    print(f"  ✅ {len(viaturas)} viaturas inseridas")
    return viaturas


def seed_equipamentos(db):
    print("🧰 Inserindo equipamentos...")
    equipamentos = [
        # Equipamento 0: disponivel — será associado a DF-001-AB abaixo
        Equipamento(
            nome="Mangueira de Ataque 40mm",
            tipo=TipoEquipamento.combate,
            numero_serie="MNG-40-001",
            status=StatusEquipamento.disponivel,
        ),
        # Equipamento 1: disponivel
        Equipamento(
            nome="Escada Extensível 9m",
            tipo=TipoEquipamento.resgate,
            numero_serie="ESC-9M-001",
            status=StatusEquipamento.disponivel,
        ),
        # Equipamento 2: disponivel
        Equipamento(
            nome="Desfibrilador DEA",
            tipo=TipoEquipamento.medico,
            numero_serie="DEA-001-DF",
            status=StatusEquipamento.disponivel,
        ),
        # Equipamento 3: em_uso — vinculado a DF-001-AB via viatura_equipamento abaixo
        Equipamento(
            nome="Aparelho de Respiração Autônoma",
            tipo=TipoEquipamento.combate,
            numero_serie="ARA-001-DF",
            status=StatusEquipamento.em_uso,
        ),
        # Equipamento 4: em_manutencao — terá manutenção em_andamento vinculada abaixo
        Equipamento(
            nome="Kit Ferramentas de Corte Hidráulico",
            tipo=TipoEquipamento.resgate,
            numero_serie="KIT-HC-001",
            status=StatusEquipamento.em_manutencao,
        ),
    ]
    for e in equipamentos:
        db.add(e)
    db.commit()
    print(f"  ✅ {len(equipamentos)} equipamentos inseridos")
    return equipamentos


def seed_viatura_equipamento(db, viaturas, equipamentos):
    """Associa equipamento em_uso à viatura correta via viatura_equipamento."""
    print("🔗 Vinculando equipamentos às viaturas...")
    from sqlalchemy import text
    # Aparelho de Respiração Autônoma (equipamentos[3]) → DF-001-AB (viaturas[0])
    db.execute(text("""
        INSERT INTO viatura_equipamento (viatura_id, equipamento_id, quantidade)
        VALUES (:vid, :eid, 1)
    """), {"vid": viaturas[0].id, "eid": equipamentos[3].id})
    db.commit()
    print("  ✅ Aparelho de Respiração Autônoma vinculado à DF-001-AB")


def seed_manutencoes(db, viaturas, equipamentos):
    print("🔧 Inserindo manutenções...")
    manutencoes = [
        # DF-004-AB está em_manutencao → manutenção PENDENTE (aguardando técnico preencher data de início)
        # Fluxo: Comandante solicitou → criou com status pendente → técnico ainda não iniciou
        Manutencao(
            tipo=TipoManutencao.preventiva,
            descricao="Revisão geral — troca de óleo, filtros e freios",
            status=StatusManutencao.pendente,
            data_inicio=date(2026, 6, 26),  # data da solicitação (banco NOT NULL)
            viatura_id=viaturas[3].id,      # DF-004-AB
        ),

        # Kit Ferramentas (equipamentos[4]) está em_manutencao → manutenção EM ANDAMENTO
        # Fluxo: técnico já preencheu data_inicio e data_fim ao avançar de pendente → em_andamento
        Manutencao(
            tipo=TipoManutencao.corretiva,
            descricao="Substituição de mangueira hidráulica danificada",
            custo=Decimal("380.00"),
            data_inicio=date(2026, 6, 20),
            data_fim=date(2026, 6, 30),   # data_fim obrigatória para estar em_andamento
            status=StatusManutencao.em_andamento,
            equipamento_id=equipamentos[4].id,  # Kit Ferramentas
        ),

        # Manutenção histórica já concluída (viatura que agora está disponivel)
        # Não altera status de nenhuma viatura/equipamento atual
        Manutencao(
            tipo=TipoManutencao.preventiva,
            descricao="Revisão anual de rotina — certificação renovada",
            custo=Decimal("1250.00"),
            data_inicio=date(2026, 5, 10),
            data_fim=date(2026, 5, 12),
            status=StatusManutencao.concluida,
            viatura_id=viaturas[1].id,   # DF-002-AB — agora disponivel (manutenção já encerrada)
        ),
    ]
    for m in manutencoes:
        db.add(m)
    db.commit()
    print(f"  ✅ {len(manutencoes)} manutenções inseridas")


def seed_ocorrencias(db, viaturas, bombeiros):
    print("🚨 Inserindo ocorrências...")

    # Aberta — incêndio crítico
    oc1 = Ocorrencia(
        tipo=TipoOcorrencia.incendio,
        descricao="Incêndio em transformador elétrico na Torre de TV",
        prioridade=PrioridadeOcorrencia.critica,
        num_vitimas=0,
        status=StatusOcorrencia.aberta,
        data_abertura=datetime(2026, 6, 12, 14, 30, tzinfo=timezone.utc),
    )
    db.add(oc1)
    db.flush()
    db.add(EnderecoOcorrencia(
        ocorrencia_id=oc1.id,
        logradouro="Eixo Monumental",
        numero="s/n",
        bairro="Setor de Divulgação Cultural",
        cidade="Brasília",
        cep="70070-350",
        latitude=-15.7795,
        longitude=-47.9292,
    ))

    # Em andamento — acidente com vítimas
    oc2 = Ocorrencia(
        tipo=TipoOcorrencia.acidente,
        descricao="Colisão entre ônibus e automóvel com vítimas presas",
        prioridade=PrioridadeOcorrencia.alta,
        num_vitimas=4,
        status=StatusOcorrencia.em_andamento,
        data_abertura=datetime(2026, 6, 12, 10, 15, tzinfo=timezone.utc),
    )
    db.add(oc2)
    db.flush()
    db.add(EnderecoOcorrencia(
        ocorrencia_id=oc2.id,
        logradouro="SGAS 915",
        numero="s/n",
        bairro="Setor Hospitalar Sul",
        cidade="Brasília",
        cep="70390-150",
        latitude=-15.7942,
        longitude=-47.8982,
    ))

    # Aberta — resgate aquático
    oc3 = Ocorrencia(
        tipo=TipoOcorrencia.resgate,
        descricao="Pessoa desaparecida no Lago Norte após acidente náutico",
        prioridade=PrioridadeOcorrencia.media,
        num_vitimas=1,
        status=StatusOcorrencia.aberta,
        data_abertura=datetime(2026, 6, 11, 8, 0, tzinfo=timezone.utc),
    )
    db.add(oc3)
    db.flush()
    db.add(EnderecoOcorrencia(
        ocorrencia_id=oc3.id,
        logradouro="QI 13",
        numero="s/n",
        bairro="Lago Norte",
        cidade="Brasília",
        cep="71535-130",
        latitude=-15.7276,
        longitude=-47.8824,
    ))

    # Encerrada — inundação
    oc4 = Ocorrencia(
        tipo=TipoOcorrencia.inundacao,
        descricao="Alagamento em via após chuvas intensas",
        prioridade=PrioridadeOcorrencia.media,
        num_vitimas=0,
        status=StatusOcorrencia.encerrada,
        data_abertura=datetime(2026, 6, 10, 18, 0, tzinfo=timezone.utc),
        data_encerramento=datetime(2026, 6, 10, 22, 30, tzinfo=timezone.utc),
    )
    db.add(oc4)
    db.flush()
    db.add(EnderecoOcorrencia(
        ocorrencia_id=oc4.id,
        logradouro="QNN 31",
        numero="s/n",
        bairro="Ceilândia Norte",
        cidade="Brasília",
        cep="72215-310",
        latitude=-15.8081,
        longitude=-48.1101,
    ))

    # Encerrada — incêndio crítico
    oc5 = Ocorrencia(
        tipo=TipoOcorrencia.incendio,
        descricao="Incêndio em estabelecimento comercial no centro de Taguatinga",
        prioridade=PrioridadeOcorrencia.critica,
        num_vitimas=2,
        status=StatusOcorrencia.encerrada,
        data_abertura=datetime(2026, 6, 9, 9, 0, tzinfo=timezone.utc),
        data_encerramento=datetime(2026, 6, 9, 13, 0, tzinfo=timezone.utc),
    )
    db.add(oc5)
    db.flush()
    db.add(EnderecoOcorrencia(
        ocorrencia_id=oc5.id,
        logradouro="QSA 3",
        numero="s/n",
        bairro="Taguatinga Centro",
        cidade="Brasília",
        cep="72015-030",
        latitude=-15.8327,
        longitude=-48.0560,
    ))

    db.commit()
    print("  ✅ 5 ocorrências inseridas")
    return [oc1, oc2, oc3, oc4, oc5]


def seed_treinamentos(db, bombeiros):
    print("🎓 Inserindo treinamentos...")
    t1 = Treinamento(
        titulo="Combate a Incêndio em Edificações",
        tipo=TipoTreinamento.pratico,
        descricao="Técnicas avançadas de combate em edifícios verticais",
        instrutor="Cel. José Augusto Neves",
        carga_horaria=40,
        data_inicio=date(2026, 7, 7),
        data_fim=date(2026, 7, 11),
        status=StatusTreinamento.agendado,
    )
    t2 = Treinamento(
        titulo="Primeiros Socorros e APH",
        tipo=TipoTreinamento.teorico,
        descricao="Atendimento Pré-Hospitalar e suporte básico de vida",
        instrutor="Dra. Carla Mendes",
        carga_horaria=20,
        data_inicio=date(2026, 6, 16),
        data_fim=date(2026, 6, 18),
        status=StatusTreinamento.agendado,
    )
    db.add(t1)
    db.add(t2)
    db.commit()
    print("  ✅ 2 treinamentos inseridos")


def seed_denuncias(db):
    print("📢 Inserindo denúncias...")
    denuncias = [
        Denuncia(
            solicitante="Maria Aparecida dos Santos",
            telefone="61988880001",
            tipo="incendio",
            descricao="Fumaça saindo de apartamento abandonado no 5º andar",
            endereco_informado="SQN 210, Bloco B, Asa Norte",
            status=StatusDenuncia.em_analise,
        ),
        Denuncia(
            solicitante="João Carlos Pereira",
            telefone="61988880002",
            tipo="inundacao",
            descricao="Bueiro entupido causando alagamento na via",
            endereco_informado="W3 Norte, 714, Asa Norte",
            status=StatusDenuncia.pendente,
        ),
    ]
    for d in denuncias:
        db.add(d)
    db.commit()
    print(f"  ✅ {len(denuncias)} denúncias inseridas")


def main():
    print("🌱 Iniciando seed do banco de dados...\n")
    db = SessionLocal()
    try:
        limpar_banco(db)
        bombeiros  = seed_bombeiros(db)
        viaturas   = seed_viaturas(db)
        equipamentos = seed_equipamentos(db)
        seed_viatura_equipamento(db, viaturas, equipamentos)
        seed_manutencoes(db, viaturas, equipamentos)
        seed_ocorrencias(db, viaturas, bombeiros)
        seed_treinamentos(db, bombeiros)
        seed_denuncias(db)
        print("\n✅ Seed concluído com sucesso!")
        print("   Acesse http://127.0.0.1:8000/docs para explorar os dados.")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro durante o seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
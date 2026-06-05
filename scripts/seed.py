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
            telefone="11999990001",
            email="carlos.silva@bombeiros.sp.gov.br",
            status=StatusBombeiro.ativo,
            data_admissao=date(2005, 3, 10),
        ),
        Bombeiro(
            nome="Ana Paula Ferreira",
            matricula="CB-002",
            patente=PatenteBombeiro.tenente,
            especialidade="Combate a Incêndio",
            telefone="11999990002",
            email="ana.ferreira@bombeiros.sp.gov.br",
            status=StatusBombeiro.ativo,
            data_admissao=date(2012, 7, 15),
        ),
        Bombeiro(
            nome="Roberto Mendes Costa",
            matricula="CB-003",
            patente=PatenteBombeiro.sargento,
            especialidade="Resgate em Altura",
            telefone="11999990003",
            email="roberto.costa@bombeiros.sp.gov.br",
            status=StatusBombeiro.ativo,
            data_admissao=date(2015, 1, 20),
        ),
        Bombeiro(
            nome="Fernanda Lima Santos",
            matricula="CB-004",
            patente=PatenteBombeiro.cabo,
            especialidade="Atendimento Pré-Hospitalar",
            telefone="11999990004",
            email="fernanda.santos@bombeiros.sp.gov.br",
            status=StatusBombeiro.ativo,
            data_admissao=date(2018, 9, 5),
        ),
        Bombeiro(
            nome="Marcos Oliveira Pinto",
            matricula="CB-005",
            patente=PatenteBombeiro.soldado,
            especialidade="Combate a Incêndio",
            telefone="11999990005",
            email="marcos.pinto@bombeiros.sp.gov.br",
            status=StatusBombeiro.ativo,
            data_admissao=date(2021, 4, 12),
        ),
        Bombeiro(
            nome="Juliana Carvalho Rocha",
            matricula="CB-006",
            patente=PatenteBombeiro.soldado,
            especialidade="Mergulho e Salvamento Aquático",
            telefone="11999990006",
            email="juliana.rocha@bombeiros.sp.gov.br",
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
            placa="SP-001-AB",
            modelo="Scania P360 AutoBomba",
            tipo=TipoViatura.auto_bomba,
            ano_fabricacao=2019,
            status=StatusViatura.disponivel,
        ),
        Viatura(
            placa="SP-002-AB",
            modelo="Mercedes-Benz Atron AutoEscada",
            tipo=TipoViatura.auto_escada,
            ano_fabricacao=2021,
            status=StatusViatura.disponivel,
        ),
        Viatura(
            placa="SP-003-AB",
            modelo="Mercedes-Benz Sprinter UTI",
            tipo=TipoViatura.ambulancia,
            ano_fabricacao=2022,
            status=StatusViatura.disponivel,
        ),
        Viatura(
            placa="SP-004-AB",
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
        Equipamento(
            nome="Mangueira de Ataque 40mm",
            tipo=TipoEquipamento.combate,
            numero_serie="MNG-40-001",
            status=StatusEquipamento.disponivel,
        ),
        Equipamento(
            nome="Escada Extensível 9m",
            tipo=TipoEquipamento.resgate,
            numero_serie="ESC-9M-001",
            status=StatusEquipamento.disponivel,
        ),
        Equipamento(
            nome="Desfibrilador DEA",
            tipo=TipoEquipamento.medico,
            numero_serie="DEA-001-SP",
            status=StatusEquipamento.disponivel,
        ),
        Equipamento(
            nome="Aparelho de Respiração Autônoma",
            tipo=TipoEquipamento.combate,
            numero_serie="ARA-001-SP",
            status=StatusEquipamento.em_uso,
        ),
        Equipamento(
            nome="Kit Ferramentas de Corte Hidráulico",
            tipo=TipoEquipamento.resgate,
            numero_serie="KIT-HC-001",
            status=StatusEquipamento.disponivel,
        ),
    ]
    for e in equipamentos:
        db.add(e)
    db.commit()
    print(f"  ✅ {len(equipamentos)} equipamentos inseridos")
    return equipamentos


def seed_ocorrencias(db, viaturas, bombeiros):
    print("🚨 Inserindo ocorrências...")

    oc1 = Ocorrencia(
        tipo=TipoOcorrencia.incendio,
        descricao="Incêndio em edifício residencial de 8 andares",
        prioridade=PrioridadeOcorrencia.critica,
        num_vitimas=2,
        status=StatusOcorrencia.encerrada,
        data_abertura=datetime(2026, 5, 10, 14, 30, tzinfo=timezone.utc),
        data_encerramento=datetime(2026, 5, 10, 17, 45, tzinfo=timezone.utc),
    )
    db.add(oc1)
    db.flush()
    db.add(EnderecoOcorrencia(
        ocorrencia_id=oc1.id,
        logradouro="Rua Augusta",
        numero="1500",
        bairro="Consolação",
        cidade="São Paulo",
        cep="01304-001",
        latitude=-23.5541,
        longitude=-46.6565,
    ))

    oc2 = Ocorrencia(
        tipo=TipoOcorrencia.acidente,
        descricao="Colisão entre dois veículos com vítimas presas",
        prioridade=PrioridadeOcorrencia.alta,
        num_vitimas=3,
        status=StatusOcorrencia.aberta,
        data_abertura=datetime(2026, 6, 3, 9, 15, tzinfo=timezone.utc),
    )
    db.add(oc2)
    db.flush()
    db.add(EnderecoOcorrencia(
        ocorrencia_id=oc2.id,
        logradouro="Avenida Paulista",
        numero="2300",
        bairro="Bela Vista",
        cidade="São Paulo",
        cep="01310-300",
        latitude=-23.5613,
        longitude=-46.6563,
    ))

    oc3 = Ocorrencia(
        tipo=TipoOcorrencia.resgate,
        descricao="Pessoa presa em elevador há mais de 2 horas",
        prioridade=PrioridadeOcorrencia.media,
        num_vitimas=1,
        status=StatusOcorrencia.em_andamento,
        data_abertura=datetime(2026, 6, 3, 11, 0, tzinfo=timezone.utc),
    )
    db.add(oc3)
    db.flush()
    db.add(EnderecoOcorrencia(
        ocorrencia_id=oc3.id,
        logradouro="Rua da Consolação",
        numero="800",
        bairro="Higienópolis",
        cidade="São Paulo",
        cep="01301-000",
        latitude=-23.5489,
        longitude=-46.6488,
    ))

    db.commit()
    print("  ✅ 3 ocorrências inseridas")
    return [oc1, oc2, oc3]


def seed_manutencoes(db, viaturas, equipamentos):
    print("🔧 Inserindo manutenções...")
    manutencoes = [
        Manutencao(
            tipo=TipoManutencao.preventiva,
            descricao="Revisão geral — troca de óleo e filtros",
            custo=Decimal("1250.00"),
            data_inicio=date(2026, 5, 20),
            data_fim=date(2026, 5, 22),
            status=StatusManutencao.concluida,
            viatura_id=viaturas[3].id,
        ),
        Manutencao(
            tipo=TipoManutencao.corretiva,
            descricao="Substituição de mangueira danificada",
            custo=Decimal("380.00"),
            data_inicio=date(2026, 6, 1),
            status=StatusManutencao.em_andamento,
            equipamento_id=equipamentos[0].id,
        ),
    ]
    for m in manutencoes:
        db.add(m)
    db.commit()
    print(f"  ✅ {len(manutencoes)} manutenções inseridas")


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
            telefone="11988880001",
            tipo="incendio",
            descricao="Fumaça saindo de apartamento abandonado no 5º andar",
            endereco_informado="Rua Vergueiro, 3000, Vila Mariana",
            status=StatusDenuncia.em_analise,
        ),
        Denuncia(
            solicitante="João Carlos Pereira",
            telefone="11988880002",
            tipo="inundacao",
            descricao="Bueiro entupido causando alagamento na via",
            endereco_informado="Av. Rebouças, 500, Pinheiros",
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
        bombeiros = seed_bombeiros(db)
        viaturas = seed_viaturas(db)
        equipamentos = seed_equipamentos(db)
        seed_ocorrencias(db, viaturas, bombeiros)
        seed_manutencoes(db, viaturas, equipamentos)
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

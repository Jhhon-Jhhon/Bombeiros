# Documento de Requisitos — API REST Sede de Bombeiros

## Entidades do Sistema

### Entidades obrigatórias
- Bombeiro
- Viatura
- Ocorrência
- Equipamento

### Entidades propostas
- Manutenção *(relacionada a Viatura e Equipamento)*
- Treinamento *(relacionada a Bombeiro)*

### Entidades de suporte operacional
- Solicitação *(cobre os casos de uso: receber denúncia, verificar
  solicitação e arquivar solicitação — ator: Comandante)*
- Equipe *(entidade operacional de suporte ao Bombeiro; um bombeiro
  pode pertencer a uma ou mais equipes. Não possui fluxo próprio no
  diagrama de casos de uso, sendo uma entidade de apoio implícita
  às operações do ator Bombeiro)*

### Tabelas de junção
- Bombeiro_Equipe
- Ocorrencia_Bombeiro
- Ocorrencia_Viatura
- Viatura_Equipamento
- Bombeiro_Treinamento

---

## Requisitos Funcionais

| ID   | Descrição |
|------|-----------|
| RF01 | Cadastrar, consultar, atualizar e remover bombeiros |
| RF02 | Cadastrar, consultar, atualizar e remover viaturas |
| RF03 | Registrar ocorrências com endereço, prioridade e número de vítimas |
| RF04 | Alocar uma ou mais viaturas a uma ocorrência |
| RF05 | Associar bombeiros a uma ocorrência com função e horário |
| RF06 | Atualizar o status de uma ocorrência |
| RF07 | Cadastrar, consultar, atualizar e remover equipamentos |
| RF08 | Associar equipamentos a viaturas com quantidade e observação |
| RF09 | Registrar manutenções de viaturas e equipamentos |
| RF10 | Registrar treinamentos e associar bombeiros com status de participação |
| RF11 | Registrar e gerenciar equipes de bombeiros |
| RF12 | Receber solicitações e denúncias externas |
| RF13 | Verificar e arquivar solicitações recebidas |
| RF14 | Converter uma solicitação em ocorrência quando procedente |
| RF15 | Listar todos os recursos com filtros e paginação |
| RF16 | Gerar relatório de ocorrências por período, status e tipo |

---

## Requisitos Não-Funcionais

| ID    | Descrição |
|-------|-----------|
| RNF01 | API desenvolvida em Python com FastAPI |
| RNF02 | Banco de dados PostgreSQL com SQLAlchemy e Alembic |
| RNF03 | Validação de entrada e saída com schemas Pydantic separados (nunca expor o model do banco diretamente) |
| RNF04 | Retorno de códigos HTTP corretos: 200, 201, 204, 400, 404, 409, 500 |
| RNF05 | Logging com o módulo nativo do Python — uso de print() é proibido |
| RNF06 | Cobertura de testes mínima de 70% com pytest e pytest-cov |
| RNF07 | Testes passando em pelo menos 3 versões do Python |
| RNF08 | CI automatizado via GitHub Actions: pytest + ruff a cada push |
| RNF09 | Credenciais de banco exclusivamente via variáveis de ambiente (.env) |
| RNF10 | Código formatado com Ruff |
| RNF11 | Histórico de commits pequeno, frequente e com mensagens descritivas |

---

## Regras de Negócio

| ID   | Descrição | Nível de validação |
|------|-----------|-------------------|
| RN01 | Uma viatura com status `em_atendimento` não pode ser alocada a uma nova ocorrência enquanto a ocorrência atual não for encerrada. A tentativa retorna HTTP 409. | Aplicação (FastAPI) + Banco (trigger PostgreSQL) |
| RN02 | Ao alocar uma viatura a uma ocorrência (inserção em Ocorrencia_Viatura), o status da viatura muda automaticamente para `em_atendimento`. | Banco (trigger AFTER INSERT em Ocorrencia_Viatura) |
| RN03 | Ao encerrar uma ocorrência, todas as viaturas alocadas a ela voltam automaticamente ao status `disponivel`. | Banco (trigger AFTER UPDATE em Ocorrencia quando status = 'encerrada') |
| RN04 | Uma manutenção deve estar associada a pelo menos uma viatura ou um equipamento — ambos os campos FK podem ser nulos, mas não simultaneamente. | Aplicação (Pydantic) + Banco (CHECK constraint) |
| RN05 | Um equipamento com status `em_manutencao` não pode ser alocado a uma viatura. | Aplicação (FastAPI) + Banco (trigger BEFORE INSERT em Viatura_Equipamento) |
| RN06 | Uma solicitação só pode ser convertida em ocorrência se seu status for `verificada`. Tentativas com outros status retornam HTTP 409. | Aplicação (FastAPI) |
| RN07 | Ao arquivar uma solicitação, o campo `ocorrencia_id` deve permanecer nulo — uma solicitação arquivada não gerou ocorrência. | Aplicação (Pydantic) + Banco (CHECK constraint) |

---

## Triggers no Banco (PostgreSQL — mínimo exigido: 3)

| # | Nome sugerido | Evento | Propósito |
|---|---------------|--------|-----------|
| 1 | `trg_viatura_em_atendimento` | BEFORE INSERT em `ocorrencia_viatura` | Bloqueia alocação de viatura já em atendimento (RN01) |
| 2 | `trg_atualiza_status_viatura` | AFTER INSERT em `ocorrencia_viatura` | Muda status da viatura para `em_atendimento` (RN02) |
| 3 | `trg_libera_viaturas` | AFTER UPDATE em `ocorrencia` | Libera viaturas ao encerrar ocorrência (RN03) |

> Triggers adicionais podem ser implementados para auditoria ou
> outras automações de integridade conforme o desenvolvimento avançar.

---

## Atores e Casos de Uso Cobertos

| Ator | Caso de uso | RF relacionado |
|------|-------------|---------------|
| Bombeiro | Registrar ocorrência | RF03 |
| Bombeiro | Solicitar viatura | RF04 |
| Bombeiro | Requisitar equipamento | RF08 |
| Bombeiro | Participar de treinamento prático/teórico | RF10 |
| Bombeiro | Checar número de vítimas `<<include>>` | RF03 |
| Técnico de manutenção | Registrar manutenção de viatura | RF09 |
| Técnico de manutenção | Registrar manutenção de equipamento | RF09 |
| Comandante | Gerar relatório de ocorrências | RF16 |
| Comandante | Atualizar status de ocorrência | RF06 |
| Comandante | Requisitar equipamento e viatura `<<extend>>` | RF04, RF08 |
| Comandante | Receber denúncia | RF12 |
| Comandante | Verificar solicitação | RF13 |
| Comandante | Arquivar solicitação `<<extend>>` | RF13 |

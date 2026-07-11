# 🚒 Sistema de Gestão — Corpo de Bombeiros DF

API REST completa para gestão operacional do Corpo de Bombeiros do Distrito Federal, desenvolvida como projeto acadêmico. O sistema gerencia ocorrências, viaturas, equipamentos, manutenções, bombeiros, equipes, treinamentos e denúncias cidadãs, com controle de fluxo por perfil de usuário.

---

## 📋 Sumário

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Funcionalidades por Perfil](#funcionalidades-por-perfil)
- [Modelos de Dados](#modelos-de-dados)
- [Fluxos de Negócio](#fluxos-de-negócio)
- [Como Executar](#como-executar)
- [Endpoints da API](#endpoints-da-api)
- [Testes](#testes)
- [Estrutura do Projeto](#estrutura-do-projeto)

---

## Visão Geral

O sistema opera com quatro perfis distintos, cada um com responsabilidades e permissões específicas dentro do fluxo operacional:

| Perfil | Responsabilidade principal |
|---|---|
| **Cidadão** | Registrar denúncias de ocorrências |
| **Comandante** | Aprovar denúncias, gerenciar recursos e encerrar ocorrências |
| **Bombeiro** | Registrar e conduzir ocorrências em campo |
| **Técnico de Manutenção** | Gerenciar manutenções de viaturas e equipamentos |

---

## Tecnologias

**Backend**
- Python 3.10+
- FastAPI — framework web assíncrono
- SQLAlchemy — ORM
- Alembic — migrações de banco de dados
- PostgreSQL — banco de dados relacional
- Pydantic v2 — validação de dados
- pytest — testes automatizados
- Ruff — linting e formatação

**Frontend**
- HTML5 / CSS3 / JavaScript (Vanilla)
- Leaflet.js — mapas interativos *(recurso adicional, não previsto no escopo original)*
- Nominatim (OpenStreetMap) — geocodificação de endereços em 4 níveis de fallback *(recurso adicional)*

> **Nota sobre recursos adicionais:** O escopo original do projeto previa apenas a API REST. Os itens abaixo foram implementados como melhorias além do requisitado:
> - **Kanban de ocorrências** (Comandante) e **Kanban de manutenções** (Técnico de Manutenção) — painéis visuais com fluxo de status controlado
> - **Mapa interativo** com pins de ocorrências ativas e geocodificação automática de endereços
> - **Portal do Cidadão** — interface separada para registro de denúncias com mensagem de confirmação
> - **Frontend completo com 4 perfis** — Comandante, Bombeiro, Técnico de Manutenção e Cidadão, cada um com fluxos e restrições próprias
> - **Controle automático de status** — manutenções alteram automaticamente o status de viaturas e equipamentos
> - **CI/CD via GitHub Actions** com matrix de versões Python (3.10, 3.11, 3.12)

**CI/CD**
- GitHub Actions — pipeline com matrix Python 3.10 / 3.11 / 3.12

---

## Arquitetura

```
Cliente (Browser)
       │
       ▼
  Frontend (HTML/CSS/JS)
       │  REST (JSON)
       ▼
  FastAPI (Routers)
       │
       ▼
  CRUD Layer (SQLAlchemy)
       │
       ▼
  PostgreSQL
```

O backend segue o padrão de quatro camadas:

- **Routers** — recebem as requisições HTTP e delegam ao CRUD
- **CRUD** — lógica de acesso ao banco de dados
- **Models** — mapeamento ORM das tabelas
- **Schemas** — validação de entrada e saída via Pydantic (Base / Create / Update / Response)

---

## Funcionalidades por Perfil

### Cidadão
- Registrar denúncias com nome, endereço, tipo e descrição

### Comandante
- Analisar e aprovar/arquivar denúncias
- Gerenciar cadastro de bombeiros, viaturas, equipes e treinamentos
- Solicitar manutenção de viaturas
- Visualizar ocorrências no kanban e no mapa
- Encerrar ocorrências após solicitação do bombeiro

### Bombeiro
- Registrar ocorrências a partir de denúncias aprovadas
- Alocar bombeiros (mínimo 2) e viaturas (mínimo 1) antes de iniciar operação
- Atualizar status de `aberta` → `em andamento`
- Solicitar encerramento ao Comandante com confirmação
- Inscrever-se em treinamentos

### Técnico de Manutenção
- Criar e gerenciar manutenções via kanban (Pendente → Em andamento → Concluída / Inativa)
- Associar equipamentos a viaturas
- Controle automático de status: recursos entram em manutenção ao criar e voltam a disponível ao concluir
- Excluir equipamentos inativos

---

## Modelos de Dados

### Entidades principais

| Entidade | Campos principais |
|---|---|
| `Bombeiro` | nome, matrícula, patente, especialidade, status |
| `Viatura` | placa, modelo, tipo, ano, status |
| `Equipamento` | nome, tipo, número de série, status |
| `Ocorrência` | tipo, descrição, prioridade, status, endereço (com lat/lng) |
| `Manutenção` | tipo, descrição, custo, datas, status, viatura/equipamento |
| `Treinamento` | título, tipo, instrutor, carga horária, datas, status |
| `Denúncia` | solicitante, tipo, endereço, descrição, status |
| `Equipe` | nome, tipo, membros (bombeiros) |

### Enums de Status

```python
StatusViatura:     disponivel | em_atendimento | em_manutencao | inativa
StatusEquipamento: disponivel | em_uso | em_manutencao | inativo
StatusManutencao:  pendente | em_andamento | concluida | inativa
StatusOcorrencia:  aberta | em_andamento | encerrada
StatusBombeiro:    ativo | de_folga | inativo
StatusDenuncia:    pendente | em_analise | aprovada | arquivada | convertida
```

---

## Fluxos de Negócio

### Fluxo de Ocorrência

```
Cidadão registra denúncia
        │
        ▼
Comandante analisa → aprova ou arquiva
        │ (aprovada)
        ▼
Bombeiro registra ocorrência (status: aberta)
        │
        ▼
Bombeiro aloca ≥2 bombeiros + ≥1 viatura
        │
        ▼
Bombeiro avança para "Em andamento"
        │
        ▼
Bombeiro solicita encerramento (com confirmação)
        │
        ▼
Comandante encerra a ocorrência
```

### Fluxo de Manutenção

```
Técnico (ou Comandante) cria manutenção
        │
        ▼ (recurso → em_manutencao automaticamente)
Kanban: PENDENTE
        │ (técnico preenche data_inicio + data_fim)
        ▼
Kanban: EM ANDAMENTO
        │
        ├── Concluída → recurso volta para disponivel
        │
        └── Inativa   → recurso marcado como inativo (pode ser excluído)
```

### Fluxo de Denúncia

```
Cidadão → pendente → em_analise → aprovada → (Bombeiro cria ocorrência) → convertida
                                └── arquivada
```

---

## Como Executar

### Pré-requisitos

- Python 3.10+
- PostgreSQL rodando localmente
- `pip` ou `uv`

### 1. Clonar o repositório

```bash
git clone https://github.com/Jhhon-Jhhon/Bombeiros.git
cd Bombeiros
```

### 2. Criar e ativar o ambiente virtual

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 3. Instalar dependências

```bash
pip install -r requirements.txt
```

### 4. Configurar variáveis de ambiente

Copie o arquivo de exemplo e ajuste as variáveis:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/bombeiros_db
TEST_DATABASE_URL=postgresql://usuario:senha@localhost:5432/bombeiros_test
```

### 5. Criar o banco de dados

```bash
# Criar banco via psql
psql -U postgres -c "CREATE DATABASE bombeiros_db;"
psql -U postgres -c "CREATE DATABASE bombeiros_test;"

# Aplicar schema
psql -U postgres -d bombeiros_db -f scripts/criar_banco.sql

# Aplicar triggers
psql -U postgres -d bombeiros_db -f scripts/triggers.sql

# Corrigir enums (se necessário)
python scripts/fix_enums.py
```

### 6. Popular com dados de exemplo

```bash
python scripts/seed.py
```

### 7. Iniciar o servidor

```bash
uvicorn app.main:app --reload
```

A API estará disponível em `http://127.0.0.1:8000`.  
Documentação interativa: `http://127.0.0.1:8000/docs`

### 8. Abrir o frontend

Abra o arquivo `frontend/index.html` diretamente no navegador ou sirva com Live Server.

---

## Endpoints da API

### Bombeiros
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/bombeiros` | Listar todos |
| POST | `/bombeiros` | Criar |
| GET | `/bombeiros/{id}` | Buscar por ID |
| PUT | `/bombeiros/{id}` | Atualizar |
| DELETE | `/bombeiros/{id}` | Excluir |

### Viaturas
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/viaturas` | Listar todas |
| POST | `/viaturas` | Criar |
| PUT | `/viaturas/{id}` | Atualizar |
| DELETE | `/viaturas/{id}` | Excluir |
| GET | `/viaturas/{id}/equipamentos` | Listar equipamentos da viatura |
| POST | `/viaturas/{id}/equipamentos` | Associar equipamento |

### Equipamentos
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/equipamentos` | Listar todos |
| POST | `/equipamentos` | Criar |
| PUT | `/equipamentos/{id}` | Atualizar |
| DELETE | `/equipamentos/{id}` | Excluir |

### Ocorrências
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/ocorrencias` | Listar todas |
| POST | `/ocorrencias` | Criar |
| PUT | `/ocorrencias/{id}` | Atualizar |
| GET | `/ocorrencias/{id}/bombeiros` | Listar bombeiros alocados |
| POST | `/ocorrencias/{id}/bombeiros` | Alocar bombeiro |
| GET | `/ocorrencias/{id}/viaturas` | Listar viaturas alocadas |
| POST | `/ocorrencias/{id}/viaturas` | Alocar viatura |

### Manutenções
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/manutencoes` | Listar todas |
| POST | `/manutencoes` | Criar |
| PUT | `/manutencoes/{id}` | Atualizar |

### Outros recursos
| Prefixo | Recursos |
|---|---|
| `/denuncias` | CRUD completo |
| `/equipes` | CRUD + membros |
| `/treinamentos` | CRUD + inscrições |
| `/solicitacoes` | CRUD |

---

## Testes

```bash
pytest -v
```

O projeto possui testes automatizados para os principais recursos com banco de dados de teste isolado (`bombeiros_test`), cobrindo criação, leitura, atualização e remoção.

O CI roda automaticamente via GitHub Actions em push/PR para `main` e `feature/*`, testando nas versões Python 3.10, 3.11 e 3.12.

---

## Estrutura do Projeto

```
bombeiros/
├── app/
│   ├── core/           # Configurações gerais
│   ├── crud/           # Lógica de acesso ao banco
│   ├── models/         # Modelos SQLAlchemy + Enums
│   ├── routers/        # Endpoints FastAPI
│   ├── schemas/        # Schemas Pydantic
│   ├── database.py     # Conexão com o banco
│   └── main.py         # Aplicação principal
├── frontend/
│   ├── components/     # kanban.js, map.js, modal.js, table.js, toast.js
│   ├── api.js          # Camada de comunicação com a API
│   ├── app.js          # Lógica principal do frontend
│   ├── index.html      # Interface principal
│   └── style.css       # Estilos
├── scripts/
│   ├── criar_banco.sql # Schema do banco
│   ├── triggers.sql    # Triggers PostgreSQL
│   ├── fix_enums.py    # Atualização de enums no PostgreSQL
│   └── seed.py         # Dados de exemplo
├── tests/              # Testes automatizados (pytest)
├── alembic/            # Migrações de banco
├── .github/workflows/  # CI/CD GitHub Actions
├── .env.example
├── requirements.txt
└── README.md
```

---

## Autor

Desenvolvido por **João** como projeto acadêmico — 2026.
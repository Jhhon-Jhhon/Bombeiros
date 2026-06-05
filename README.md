# API REST — Sede de Bombeiros

![CI](https://github.com/Jhhon-Jhhon/Bombeiros/actions/workflows/ci.yml/badge.svg)

Sistema de gestão de chamados para sede de bombeiros.

## Stack
- Python + FastAPI
- PostgreSQL + SQLAlchemy + Alembic
- pytest + Ruff + GitHub Actions

## Entidades
- Bombeiro, Viatura, Ocorrência, Equipamento
- Manutenção, Treinamento, Denúncia, Solicitação

## Como rodar

```bash
cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Acesse: `http://127.0.0.1:8000/docs`

## Testes

```bash
pytest tests/ -v --cov=app
```
import pytest


BOMBEIRO_BASE = {
    "nome": "Carlos Teste",
    "matricula": "TEST-001",
    "patente": "sargento",
    "especialidade": "combate",
    "telefone": "11999990001",
    "email": "carlos@test.com",
    "status": "ativo",
    "data_admissao": "2020-01-15",
}


def test_criar_bombeiro(client):
    response = client.post("/bombeiros/", json=BOMBEIRO_BASE)
    assert response.status_code == 201
    data = response.json()
    assert data["matricula"] == "TEST-001"
    assert data["nome"] == "Carlos Teste"
    assert "id" in data
    assert "created_at" in data


def test_criar_bombeiro_matricula_duplicada(client):
    response = client.post("/bombeiros/", json=BOMBEIRO_BASE)
    assert response.status_code == 409
    assert "TEST-001" in response.json()["detail"]


def test_listar_bombeiros(client):
    response = client.get("/bombeiros/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_listar_bombeiros_com_filtro(client):
    response = client.get("/bombeiros/?status=ativo")
    assert response.status_code == 200
    assert all(b["status"] == "ativo" for b in response.json())


def test_listar_bombeiros_paginacao(client):
    response = client.get("/bombeiros/?skip=0&limit=1")
    assert response.status_code == 200
    assert len(response.json()) <= 1


def test_buscar_bombeiro_por_id(client):
    # Primeiro cria um novo para garantir que existe
    novo = {**BOMBEIRO_BASE, "matricula": "TEST-002"}
    criado = client.post("/bombeiros/", json=novo).json()
    response = client.get(f"/bombeiros/{criado['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == criado["id"]


def test_buscar_bombeiro_inexistente(client):
    response = client.get("/bombeiros/99999")
    assert response.status_code == 404


def test_atualizar_bombeiro(client):
    novo = {**BOMBEIRO_BASE, "matricula": "TEST-003"}
    criado = client.post("/bombeiros/", json=novo).json()
    response = client.put(
        f"/bombeiros/{criado['id']}",
        json={"status": "de_folga"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "de_folga"
    # Campos não enviados devem permanecer intactos
    assert response.json()["nome"] == "Carlos Teste"


def test_atualizar_bombeiro_inexistente(client):
    response = client.put("/bombeiros/99999", json={"status": "inativo"})
    assert response.status_code == 404


def test_remover_bombeiro(client):
    novo = {**BOMBEIRO_BASE, "matricula": "TEST-DEL"}
    criado = client.post("/bombeiros/", json=novo).json()
    response = client.delete(f"/bombeiros/{criado['id']}")
    assert response.status_code == 204


def test_remover_bombeiro_inexistente(client):
    response = client.delete("/bombeiros/99999")
    assert response.status_code == 404


def test_validacao_enum_invalido(client):
    invalido = {**BOMBEIRO_BASE, "matricula": "TEST-ERR", "patente": "general"}
    response = client.post("/bombeiros/", json=invalido)
    assert response.status_code == 422


def test_validacao_campo_obrigatorio(client):
    sem_nome = {k: v for k, v in BOMBEIRO_BASE.items() if k != "nome"}
    sem_nome["matricula"] = "TEST-ERR2"
    response = client.post("/bombeiros/", json=sem_nome)
    assert response.status_code == 422
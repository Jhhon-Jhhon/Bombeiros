VIATURA_BASE = {
    "placa": "TST-0001",
    "modelo": "Scania P360",
    "tipo": "auto_bomba",
    "ano_fabricacao": 2020,
    "status": "disponivel",
}


def test_criar_viatura(client):
    response = client.post("/viaturas/", json=VIATURA_BASE)
    assert response.status_code == 201
    data = response.json()
    assert data["placa"] == "TST-0001"
    assert "id" in data


def test_criar_viatura_placa_duplicada(client):
    response = client.post("/viaturas/", json=VIATURA_BASE)
    assert response.status_code == 409


def test_listar_viaturas(client):
    response = client.get("/viaturas/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_buscar_viatura_inexistente(client):
    response = client.get("/viaturas/99999")
    assert response.status_code == 404


def test_atualizar_viatura(client):
    nova = {**VIATURA_BASE, "placa": "TST-0002"}
    criada = client.post("/viaturas/", json=nova).json()
    response = client.put(
        f"/viaturas/{criada['id']}",
        json={"status": "em_manutencao"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "em_manutencao"


def test_remover_viatura(client):
    nova = {**VIATURA_BASE, "placa": "TST-DEL"}
    criada = client.post("/viaturas/", json=nova).json()
    assert client.delete(f"/viaturas/{criada['id']}").status_code == 204
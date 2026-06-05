OCORRENCIA_BASE = {
    "tipo": "incendio",
    "descricao": "Teste de incêndio",
    "prioridade": "alta",
    "num_vitimas": 0,
    "endereco": {
        "logradouro": "Rua Teste",
        "numero": "100",
        "bairro": "Centro",
        "cidade": "São Paulo",
        "cep": "01000-000",
        "latitude": -23.55,
        "longitude": -46.63,
    },
}


def test_regra_negocio_viatura_em_atendimento(client):
    """
    RN01: testa a validação no nível da aplicação.
    Coloca a viatura em atendimento via PUT antes de testar o bloqueio.
    """
    # Cria uma viatura
    viatura = client.post("/viaturas/", json={
        "placa": "RN01-TEST",
        "modelo": "Mercedes Atego",
        "tipo": "ambulancia",
        "ano_fabricacao": 2021,
        "status": "disponivel",
    }).json()

    # Muda o status para em_atendimento diretamente
    client.put(
        f"/viaturas/{viatura['id']}",
        json={"status": "em_atendimento"},
    )

    # Cria uma ocorrência e tenta alocar a viatura já em atendimento
    ocorrencia = client.post("/ocorrencias/", json=OCORRENCIA_BASE).json()
    conflito = client.post(
        f"/ocorrencias/{ocorrencia['id']}/viaturas",
        json={"viatura_id": viatura["id"]},
    )

    # Deve retornar 409 — regra de negócio bloqueou
    assert conflito.status_code == 409
    assert "atendimento" in conflito.json()["detail"]

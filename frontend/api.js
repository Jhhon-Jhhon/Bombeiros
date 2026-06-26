// =============================================
// CONFIGURAÇÃO BASE
// =============================================

const API_BASE = 'http://127.0.0.1:8000';

async function request(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${path}`, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Erro ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

// =============================================
// OCORRÊNCIAS
// =============================================

const Ocorrencias = {
  listar:    ()         => request('GET',    '/ocorrencias/'),
  buscar:    (id)       => request('GET',    `/ocorrencias/${id}`),
  criar:     (dados)    => request('POST',   '/ocorrencias/', dados),
  atualizar: (id,dados) => request('PUT',    `/ocorrencias/${id}`, dados),
  deletar:   (id)       => request('DELETE', `/ocorrencias/${id}`),
  // Sub-recursos
  listarBombeiros: (id)       => request('GET',  `/ocorrencias/${id}/bombeiros`),
  alocarBombeiro:  (id,dados) => request('POST', `/ocorrencias/${id}/bombeiros`, dados),
  listarViaturas:  (id)       => request('GET',  `/ocorrencias/${id}/viaturas`),
  alocarViatura:   (id,dados) => request('POST', `/ocorrencias/${id}/viaturas`, dados),
};

// =============================================
// BOMBEIROS
// =============================================

const Bombeiros = {
  listar:    ()         => request('GET',    '/bombeiros/'),
  buscar:    (id)       => request('GET',    `/bombeiros/${id}`),
  criar:     (dados)    => request('POST',   '/bombeiros/', dados),
  atualizar: (id,dados) => request('PUT',    `/bombeiros/${id}`, dados),
  deletar:   (id)       => request('DELETE', `/bombeiros/${id}`),
};

// =============================================
// VIATURAS
// =============================================

const Viaturas = {
  listar:    ()         => request('GET',    '/viaturas/'),
  buscar:    (id)       => request('GET',    `/viaturas/${id}`),
  criar:     (dados)    => request('POST',   '/viaturas/', dados),
  atualizar: (id,dados) => request('PUT',    `/viaturas/${id}`, dados),
  deletar:   (id)       => request('DELETE', `/viaturas/${id}`),
  listarEquipamentos: (id) => request('GET', `/viaturas/${id}/equipamentos`),
  associarEquipamento: (id,dados) => request('POST', `/viaturas/${id}/equipamentos`, dados),
};

// =============================================
// EQUIPAMENTOS
// =============================================

const Equipamentos = {
  listar:    ()         => request('GET',    '/equipamentos/'),
  buscar:    (id)       => request('GET',    `/equipamentos/${id}`),
  criar:     (dados)    => request('POST',   '/equipamentos/', dados),
  atualizar: (id,dados) => request('PUT',    `/equipamentos/${id}`, dados),
  deletar:   (id)       => request('DELETE', `/equipamentos/${id}`),
};

// =============================================
// MANUTENÇÕES
// =============================================

const Manutencoes = {
  listar:    ()         => request('GET',    '/manutencoes/'),
  buscar:    (id)       => request('GET',    `/manutencoes/${id}`),
  criar:     (dados)    => request('POST',   '/manutencoes/', dados),
  atualizar: (id,dados) => request('PUT',    `/manutencoes/${id}`, dados),
  deletar:   (id)       => request('DELETE', `/manutencoes/${id}`),
};

// =============================================
// EQUIPES
// =============================================

const Equipes = {
  listar:    ()         => request('GET',    '/equipes/'),
  buscar:    (id)       => request('GET',    `/equipes/${id}`),
  criar:     (dados)    => request('POST',   '/equipes/', dados),
  atualizar: (id,dados) => request('PUT',    `/equipes/${id}`, dados),
  deletar:   (id)       => request('DELETE', `/equipes/${id}`),
  listarBombeiros:   (id)       => request('GET',    `/equipes/${id}/bombeiros`),
  adicionarBombeiro: (id,dados) => request('POST',   `/equipes/${id}/bombeiros`, dados),
  removerBombeiro:   (id,bid)   => request('DELETE', `/equipes/${id}/bombeiros/${bid}`),
};

// =============================================
// DENÚNCIAS
// =============================================

const Denuncias = {
  listar:    ()         => request('GET',    '/denuncias/'),
  buscar:    (id)       => request('GET',    `/denuncias/${id}`),
  criar:     (dados)    => request('POST',   '/denuncias/', dados),
  atualizar: (id,dados) => request('PUT',    `/denuncias/${id}`, dados),
  deletar:   (id)       => request('DELETE', `/denuncias/${id}`),
};

// =============================================
// SOLICITAÇÕES
// =============================================

const Solicitacoes = {
  listar:    ()         => request('GET',    '/solicitacoes/'),
  buscar:    (id)       => request('GET',    `/solicitacoes/${id}`),
  criar:     (dados)    => request('POST',   '/solicitacoes/', dados),
  atualizar: (id,dados) => request('PUT',    `/solicitacoes/${id}`, dados),
  deletar:   (id)       => request('DELETE', `/solicitacoes/${id}`),
};

// =============================================
// TREINAMENTOS
// =============================================

const Treinamentos = {
  listar:    ()         => request('GET',    '/treinamentos/'),
  buscar:    (id)       => request('GET',    `/treinamentos/${id}`),
  criar:     (dados)    => request('POST',   '/treinamentos/', dados),
  atualizar: (id,dados) => request('PUT',    `/treinamentos/${id}`, dados),
  deletar:   (id)       => request('DELETE', `/treinamentos/${id}`),
  listarInscritos:   (id)       => request('GET',  `/treinamentos/${id}/bombeiros`),
  inscreverBombeiro: (id,dados) => request('POST', `/treinamentos/${id}/bombeiros`, dados),
  atualizarInscricao:(id,bid,dados) => request('PUT', `/treinamentos/${id}/bombeiros/${bid}`, dados),
};
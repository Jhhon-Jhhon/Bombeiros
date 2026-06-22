// =============================================
// KANBAN DE OCORRÊNCIAS
// =============================================

async function carregarKanbanOcorrencias() {
  try {
    const ocorrencias = await Ocorrencias.listar();

    document.getElementById('col-aberta').innerHTML       = '';
    document.getElementById('col-em-andamento').innerHTML = '';
    document.getElementById('col-encerrada').innerHTML    = '';

    const contadores = { aberta: 0, em_andamento: 0, encerrada: 0 };

    ocorrencias.forEach((oc) => {
      const card = criarCardOcorrencia(oc);
      if (oc.status === 'aberta') {
        document.getElementById('col-aberta').appendChild(card);
        contadores.aberta++;
      } else if (oc.status === 'em_andamento') {
        document.getElementById('col-em-andamento').appendChild(card);
        contadores.em_andamento++;
      } else if (oc.status === 'encerrada') {
        document.getElementById('col-encerrada').appendChild(card);
        contadores.encerrada++;
      }
    });

    document.getElementById('count-aberta').textContent       = contadores.aberta;
    document.getElementById('count-em-andamento').textContent = contadores.em_andamento;
    document.getElementById('count-encerrada').textContent    = contadores.encerrada;

  } catch (erro) {
    showToast('Erro ao carregar ocorrências.', 'error');
  }
}

// =============================================
// CARD DE OCORRÊNCIA
// =============================================

function criarCardOcorrencia(oc) {
  const card = document.createElement('div');
  card.className = `kanban-card prioridade-${oc.prioridade}`;

  const bairro = oc.endereco?.bairro ?? '—';

  const labelTipo = {
    incendio:  'Incêndio',
    acidente:  'Acidente',
    resgate:   'Resgate',
    inundacao: 'Inundação',
    outros:    'Outros',
  }[oc.tipo] ?? oc.tipo;

  const labelPrioridade = {
    critica: 'Crítica',
    alta:    'Alta',
    media:   'Média',
    baixa:   'Baixa',
  }[oc.prioridade] ?? oc.prioridade;

  const classeBadge = {
    critica: 'badge-critica',
    alta:    'badge-alta',
    media:   'badge-media',
    baixa:   'badge-baixa',
  }[oc.prioridade] ?? 'badge-muted';

  card.innerHTML = `
    <div class="card-tipo">${labelTipo}</div>
    <div class="card-desc">${oc.descricao}</div>
    <div class="card-footer">
      <span class="card-bairro">📍 ${bairro}</span>
      <span class="badge ${classeBadge}">${labelPrioridade}</span>
    </div>
  `;

  card.addEventListener('click', () => abrirModalOcorrencia(oc));
  return card;
}

// =============================================
// MODAL — DETALHES E EDIÇÃO DE OCORRÊNCIA (Kanban Comandante)
// FIX I: sem botão excluir — encerra via status
// =============================================

function abrirModalOcorrencia(oc) {
  const duracao = oc.data_encerramento
    ? calcularDuracao(oc.data_abertura, oc.data_encerramento)
    : null;

  openModal(`Ocorrência #${oc.id}`, `
    <div class="form-group">
      <label>Tipo</label>
      <select id="edit-tipo">
        <option value="incendio"  ${oc.tipo==='incendio'  ?'selected':''}>Incêndio</option>
        <option value="acidente"  ${oc.tipo==='acidente'  ?'selected':''}>Acidente</option>
        <option value="resgate"   ${oc.tipo==='resgate'   ?'selected':''}>Resgate</option>
        <option value="inundacao" ${oc.tipo==='inundacao' ?'selected':''}>Inundação</option>
        <option value="outros"    ${oc.tipo==='outros'    ?'selected':''}>Outros</option>
      </select>
    </div>
    <div class="form-group">
      <label>Descrição</label>
      <textarea id="edit-descricao" rows="3">${oc.descricao}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Prioridade</label>
        <select id="edit-prioridade">
          <option value="baixa"   ${oc.prioridade==='baixa'   ?'selected':''}>Baixa</option>
          <option value="media"   ${oc.prioridade==='media'   ?'selected':''}>Média</option>
          <option value="alta"    ${oc.prioridade==='alta'    ?'selected':''}>Alta</option>
          <option value="critica" ${oc.prioridade==='critica' ?'selected':''}>Crítica</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="edit-status">
          <option value="aberta"       ${oc.status==='aberta'       ?'selected':''}>Aberta</option>
          <option value="em_andamento" ${oc.status==='em_andamento' ?'selected':''}>Em andamento</option>
          <option value="encerrada"    ${oc.status==='encerrada'    ?'selected':''}>Encerrada</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Nº de vítimas</label>
      <input type="number" id="edit-vitimas" min="0" value="${oc.num_vitimas??0}" />
    </div>
    ${duracao ? `
      <div class="form-group">
        <label>Duração do atendimento</label>
        <input type="text" value="${duracao}" disabled />
      </div>` : ''}
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="salvarEdicaoOcorrencia(${oc.id})">Salvar</button>
    </div>
  `);
}

// =============================================
// MODAL — NOVA OCORRÊNCIA (botão + Nova do Kanban)
// =============================================

function abrirModalNovaOcorrencia() {
  openModal('Nova ocorrência', `
    <div class="form-group">
      <label>Tipo</label>
      <select id="edit-tipo">
        <option value="incendio">Incêndio</option>
        <option value="acidente">Acidente</option>
        <option value="resgate">Resgate</option>
        <option value="inundacao">Inundação</option>
        <option value="outros">Outros</option>
      </select>
    </div>
    <div class="form-group">
      <label>Descrição</label>
      <textarea id="edit-descricao" rows="3" placeholder="Descreva a ocorrência..."></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Prioridade</label>
        <select id="edit-prioridade">
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>
      <div class="form-group">
        <label>Nº de vítimas</label>
        <input type="number" id="edit-vitimas" min="0" value="0" />
      </div>
    </div>
    <div class="form-group">
      <label>Logradouro</label>
      <input type="text" id="edit-logradouro" placeholder="Ex: Eixo Monumental" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Bairro</label>
        <input type="text" id="edit-bairro" placeholder="Ex: Asa Norte" />
      </div>
      <div class="form-group">
        <label>Cidade</label>
        <input type="text" id="edit-cidade" value="Brasília" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Latitude</label>
        <input type="number" id="edit-lat" step="any" placeholder="-15.7795" />
      </div>
      <div class="form-group">
        <label>Longitude</label>
        <input type="number" id="edit-lng" step="any" placeholder="-47.9292" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="criarOcorrencia()">Criar</button>
    </div>
  `);
}

// =============================================
// AÇÕES — CRUD DE OCORRÊNCIA
// =============================================

async function criarOcorrencia() {
  const dados = {
    tipo:        document.getElementById('edit-tipo').value,
    descricao:   document.getElementById('edit-descricao').value,
    prioridade:  document.getElementById('edit-prioridade').value,
    num_vitimas: parseInt(document.getElementById('edit-vitimas').value) || 0,
    endereco: {
      logradouro: document.getElementById('edit-logradouro').value,
      bairro:     document.getElementById('edit-bairro').value,
      cidade:     document.getElementById('edit-cidade').value,
      latitude:   parseFloat(document.getElementById('edit-lat').value) || null,
      longitude:  parseFloat(document.getElementById('edit-lng').value) || null,
    },
  };
  try {
    await Ocorrencias.criar(dados);
    closeModal();
    showToast('Ocorrência criada com sucesso!', 'success');
    // FIX 2: recarrega kanban E pins do mapa após criar
    await carregarKanbanOcorrencias();
    await carregarPinsOcorrencias();
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

async function salvarEdicaoOcorrencia(id) {
  const dados = {
    tipo:        document.getElementById('edit-tipo').value,
    descricao:   document.getElementById('edit-descricao').value,
    prioridade:  document.getElementById('edit-prioridade').value,
    status:      document.getElementById('edit-status').value,
    num_vitimas: parseInt(document.getElementById('edit-vitimas').value) || 0,
  };
  try {
    await Ocorrencias.atualizar(id, dados);
    closeModal();
    showToast('Ocorrência atualizada!', 'success');
    // FIX 2: recarrega kanban E pins do mapa após editar
    await carregarKanbanOcorrencias();
    await carregarPinsOcorrencias();
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

// =============================================
// KANBAN DE MANUTENÇÕES (Técnico)
// FIX 3/4: 4 colunas — pendente, em_andamento, concluida, inativa
// FIX 3: recarrega após salvar no modal
// =============================================

async function carregarKanbanManutencoes() {
  try {
    const manutencoes = await Manutencoes.listar();

    const colunas = {
      pendente:     document.getElementById('col-manut-pendente'),
      em_andamento: document.getElementById('col-manut-em-andamento'),
      concluida:    document.getElementById('col-manut-concluida'),
      inativa:      document.getElementById('col-manut-inativa'),
    };

    Object.values(colunas).forEach((col) => { if (col) col.innerHTML = ''; });

    const contadores = { pendente: 0, em_andamento: 0, concluida: 0, inativa: 0 };

    manutencoes.forEach((m) => {
      const card = criarCardManutencao(m);
      const col  = colunas[m.status];
      if (col) {
        col.appendChild(card);
        contadores[m.status] = (contadores[m.status] || 0) + 1;
      }
    });

    // Atualiza contadores
    const ids = {
      pendente:     'count-manut-pendente',
      em_andamento: 'count-manut-em-andamento',
      concluida:    'count-manut-concluida',
      inativa:      'count-manut-inativa',
    };
    Object.entries(ids).forEach(([status, elId]) => {
      const el = document.getElementById(elId);
      if (el) el.textContent = contadores[status] || 0;
    });

  } catch (erro) {
    showToast('Erro ao carregar manutenções.', 'error');
  }
}

// =============================================
// CARD DE MANUTENÇÃO
// =============================================

function criarCardManutencao(m) {
  const card = document.createElement('div');
  card.className = 'kanban-card';

  const labelTipo = {
    preventiva: 'Preventiva',
    corretiva:  'Corretiva',
  }[m.tipo] ?? m.tipo;

  const alvo = m.viatura_id
    ? `🚒 Viatura #${m.viatura_id}`
    : `🧰 Equipamento #${m.equipamento_id}`;

  const custo = m.custo
    ? `R$ ${parseFloat(m.custo).toFixed(2)}`
    : '—';

  card.innerHTML = `
    <div class="card-tipo">${labelTipo}</div>
    <div class="card-desc">${m.descricao}</div>
    <div class="card-footer">
      <span class="card-bairro">${alvo}</span>
      <span class="badge badge-muted">${custo}</span>
    </div>
  `;

  card.addEventListener('click', () => abrirModalManutencao(m));
  return card;
}

// =============================================
// MODAL — DETALHES E EDIÇÃO DE MANUTENÇÃO
// FIX 3: inclui status "inativa" e recarrega kanban após salvar
// =============================================

function abrirModalManutencao(m) {
  openModal(`Manutenção #${m.id}`, `
    <div class="form-group">
      <label>Tipo</label>
      <select id="manut-edit-tipo">
        <option value="preventiva" ${m.tipo==='preventiva'?'selected':''}>Preventiva</option>
        <option value="corretiva"  ${m.tipo==='corretiva' ?'selected':''}>Corretiva</option>
      </select>
    </div>
    <div class="form-group">
      <label>Descrição</label>
      <textarea id="manut-edit-descricao" rows="3">${m.descricao}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Status</label>
        <select id="manut-edit-status">
          <option value="pendente"     ${m.status==='pendente'     ?'selected':''}>Pendente</option>
          <option value="em_andamento" ${m.status==='em_andamento' ?'selected':''}>Em andamento</option>
          <option value="concluida"    ${m.status==='concluida'    ?'selected':''}>Concluída</option>
          <option value="inativa"      ${m.status==='inativa'      ?'selected':''}>Inativa</option>
        </select>
      </div>
      <div class="form-group">
        <label>Custo (R$)</label>
        <input type="number" id="manut-edit-custo" step="0.01" min="0"
               value="${m.custo??''}" placeholder="0.00" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Data de início</label>
        <input type="date" id="manut-edit-inicio" value="${m.data_inicio??''}" />
      </div>
      <div class="form-group">
        <label>Data de fim</label>
        <input type="date" id="manut-edit-fim" value="${m.data_fim??''}" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="salvarEdicaoManutencao(${m.id})">Salvar</button>
    </div>
  `);
}

async function salvarEdicaoManutencao(id) {
  const dados = {
    tipo:       document.getElementById('manut-edit-tipo').value,
    descricao:  document.getElementById('manut-edit-descricao').value,
    status:     document.getElementById('manut-edit-status').value,
    custo:      parseFloat(document.getElementById('manut-edit-custo').value) || null,
    data_inicio: document.getElementById('manut-edit-inicio').value || null,
    data_fim:    document.getElementById('manut-edit-fim').value || null,
  };
  try {
    await Manutencoes.atualizar(id, dados);
    closeModal();
    showToast('Manutenção atualizada!', 'success');
    // FIX 3: recarrega kanban após salvar — card vai para coluna correta
    await carregarKanbanManutencoes();
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

// =============================================
// UTILITÁRIO — DURAÇÃO DE ATENDIMENTO
// =============================================

function calcularDuracao(inicio, fim) {
  const diff    = new Date(fim) - new Date(inicio);
  const horas   = Math.floor(diff / 3600000);
  const minutos = Math.floor((diff % 3600000) / 60000);
  return `${horas}h ${minutos}min`;
}
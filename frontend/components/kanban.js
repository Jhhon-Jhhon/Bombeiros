// Animacao pulse para notificacao
if (!document.getElementById('pulse-style')) {
  const s = document.createElement('style');
  s.id = 'pulse-style';
  s.textContent = '@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }';
  document.head.appendChild(s);
}

// =============================================
// KANBAN DE OCORRENCIAS
// =============================================

async function carregarKanbanOcorrencias() {
  try {
    const ocorrencias = await Ocorrencias.listar();

    document.getElementById('col-aberta').innerHTML       = '';
    document.getElementById('col-em-andamento').innerHTML = '';

    const contadores = { aberta: 0, em_andamento: 0 };

    // Encerradas nao aparecem como cards — apenas no contador do dia
    const hoje = new Date().toISOString().split('T')[0];
    const encerradasHoje = ocorrencias.filter((oc) => {
      if (oc.status !== 'encerrada') return false;
      const dataEnc = oc.data_encerramento || oc.updated_at || oc.created_at || '';
      return dataEnc.startsWith(hoje);
    });

    const colEnc = document.getElementById('col-encerrada');
    if (colEnc) {
      if (encerradasHoje.length > 0) {
        colEnc.innerHTML = `
          <div style="padding:16px;text-align:center;">
            <div style="font-size:48px;font-weight:700;color:var(--color-encerrada);line-height:1;">
              ${encerradasHoje.length}
            </div>
            <div style="font-size:13px;color:var(--color-text-muted);margin-top:4px;">
              encerrada${encerradasHoje.length > 1 ? 's' : ''} hoje
            </div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">
              Reinicia a meia-noite
            </div>
          </div>`;
      } else {
        colEnc.innerHTML = '<div class="empty-state" style="font-size:12px;">Nenhuma encerrada hoje</div>';
      }
    }
    document.getElementById('count-encerrada').textContent = encerradasHoje.length;

    // Apenas abertas e em_andamento aparecem como cards
    ocorrencias.filter((oc) => oc.status !== 'encerrada').forEach((oc) => {
      const card = criarCardOcorrencia(oc);
      if (oc.status === 'aberta') {
        document.getElementById('col-aberta').appendChild(card);
        contadores.aberta++;
      } else if (oc.status === 'em_andamento') {
        document.getElementById('col-em-andamento').appendChild(card);
        contadores.em_andamento++;
      }
    });

    document.getElementById('count-aberta').textContent       = contadores.aberta;
    document.getElementById('count-em-andamento').textContent = contadores.em_andamento;

  } catch (erro) {
    showToast('Erro ao carregar ocorrencias.', 'error');
  }
}

// =============================================
// CARD DE OCORRENCIA
// =============================================

function criarCardOcorrencia(oc) {
  const card = document.createElement('div');
  const temSolicitacao = oc.descricao && oc.descricao.includes('[SOLICITACAO DE ENCERRAMENTO]');
  card.className = `kanban-card prioridade-${oc.prioridade}${temSolicitacao ? ' card-solicitacao' : ''}`;

  const bairro = oc.endereco?.bairro ?? '--';
  const labelTipo = {
    incendio:'Incendio', acidente:'Acidente', resgate:'Resgate',
    inundacao:'Inundacao', outros:'Outros'
  }[oc.tipo] ?? oc.tipo;
  const labelPrioridade = { critica:'Critica', alta:'Alta', media:'Media', baixa:'Baixa' }[oc.prioridade] ?? oc.prioridade;
  const classeBadge = { critica:'badge-critica', alta:'badge-alta', media:'badge-media', baixa:'badge-baixa' }[oc.prioridade] ?? 'badge-muted';

  const descricaoLimpa = temSolicitacao
    ? oc.descricao.replace('[SOLICITACAO DE ENCERRAMENTO]', '').trim()
    : oc.descricao;

  card.innerHTML = `
    <div class="card-tipo">
      ${labelTipo}
      ${temSolicitacao ? `<span style="display:inline-block;width:10px;height:10px;
        background:var(--color-critica);border-radius:50%;margin-left:6px;
        animation:pulse 1.5s infinite;" title="Bombeiro solicitou encerramento"></span>` : ''}
    </div>
    <div class="card-desc">${descricaoLimpa}</div>
    ${temSolicitacao ? '<div style="font-size:11px;color:var(--color-critica);font-weight:600;margin:4px 0;">Solicitacao de encerramento</div>' : ''}
    <div class="card-footer">
      <span class="card-bairro">${bairro}</span>
      <span class="badge ${classeBadge}">${labelPrioridade}</span>
    </div>`;

  card.addEventListener('click', () => abrirModalOcorrencia(oc));
  return card;
}

// =============================================
// MODAL DE OCORRENCIA — Comandante
// Novo fluxo: somente leitura + lista de alocados
// So encerra quando ha solicitacao do bombeiro
// =============================================

async function abrirModalOcorrencia(oc) {
  const temSolicitacao = oc.descricao && oc.descricao.includes('[SOLICITACAO DE ENCERRAMENTO]');
  const descricaoLimpa = temSolicitacao
    ? oc.descricao.replace('[SOLICITACAO DE ENCERRAMENTO]', '').trim()
    : oc.descricao;

  openModal(`Ocorrencia #${oc.id}`, '<div class="empty-state">Carregando...</div>');

  // Buscar bombeiros e viaturas alocados
  try {
    const [bombeiroAlocados, viaturaAlocadas, todosBombeiros, todasViaturas] = await Promise.all([
      request('GET', `/ocorrencias/${oc.id}/bombeiros`).catch(() => []),
      request('GET', `/ocorrencias/${oc.id}/viaturas`).catch(() => []),
      Bombeiros.listar(),
      Viaturas.listar(),
    ]);

    const listaBombeiros = bombeiroAlocados.length > 0
      ? bombeiroAlocados.map((ab) => {
          const b = todosBombeiros.find((x) => x.id === ab.bombeiro_id);
          return `<span class="badge badge-info" style="margin:2px;">
            ${b ? `${b.nome} (${b.matricula})` : `Bombeiro #${ab.bombeiro_id}`}
          </span>`;
        }).join('')
      : '<span class="text-muted" style="font-size:12px;">Nenhum bombeiro alocado ainda.</span>';

    const listaViaturas = viaturaAlocadas.length > 0
      ? viaturaAlocadas.map((av) => {
          const v = todasViaturas.find((x) => x.id === av.viatura_id);
          return `<span class="badge badge-muted" style="margin:2px;">
            ${v ? `${v.placa} — ${v.modelo}` : `Viatura #${av.viatura_id}`}
          </span>`;
        }).join('')
      : '<span class="text-muted" style="font-size:12px;">Nenhuma viatura alocada ainda.</span>';

    const labelTipo = {
      incendio:'Incendio', acidente:'Acidente', resgate:'Resgate',
      inundacao:'Inundacao', outros:'Outros'
    }[oc.tipo] ?? oc.tipo;

    const labelStatus = {
      aberta:'Aberta', em_andamento:'Em andamento', encerrada:'Encerrada'
    }[oc.status] ?? oc.status;

    const labelPrioridade = {
      critica:'Critica', alta:'Alta', media:'Media', baixa:'Baixa'
    }[oc.prioridade] ?? oc.prioridade;

    document.getElementById('modal-body').innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>Tipo</label>
          <input type="text" value="${labelTipo}" disabled />
        </div>
        <div class="form-group">
          <label>Prioridade</label>
          <input type="text" value="${labelPrioridade}" disabled />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Status atual</label>
          <input type="text" value="${labelStatus}" disabled />
        </div>
        <div class="form-group">
          <label>Nr de vitimas</label>
          <input type="number" id="edit-vitimas" min="0" value="${oc.num_vitimas??0}" />
        </div>
      </div>
      <div class="form-group">
        <label>Descricao</label>
        <textarea id="edit-descricao" rows="3">${descricaoLimpa}</textarea>
      </div>
      <div class="form-group">
        <label>Bombeiros alocados</label>
        <div style="padding:8px;border:1px solid var(--color-border);border-radius:8px;min-height:36px;">
          ${listaBombeiros}
        </div>
      </div>
      <div class="form-group">
        <label>Viaturas alocadas</label>
        <div style="padding:8px;border:1px solid var(--color-border);border-radius:8px;min-height:36px;">
          ${listaViaturas}
        </div>
      </div>

      ${temSolicitacao ? `
        <div style="background:rgba(231,76,60,0.1);border:1px solid var(--color-critica);
          border-radius:8px;padding:12px;margin-top:8px;">
          <div style="color:var(--color-critica);font-weight:600;font-size:13px;margin-bottom:8px;">
            Bombeiro solicitou encerramento desta ocorrencia.
          </div>
          <div class="form-group">
            <label>Prioridade (pode ajustar antes de encerrar)</label>
            <select id="edit-prioridade">
              <option value="baixa"   ${oc.prioridade==='baixa'   ?'selected':''}>Baixa</option>
              <option value="media"   ${oc.prioridade==='media'   ?'selected':''}>Media</option>
              <option value="alta"    ${oc.prioridade==='alta'    ?'selected':''}>Alta</option>
              <option value="critica" ${oc.prioridade==='critica' ?'selected':''}>Critica</option>
            </select>
          </div>
          <div class="form-actions" style="margin-top:8px;">
            <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn-primary" style="background:var(--color-encerrada);"
              onclick="encerrarOcorrencia(${oc.id})">Encerrar ocorrencia</button>
          </div>
        </div>
      ` : `
        <div style="background:rgba(255,255,255,0.03);border:1px solid var(--color-border);
          border-radius:8px;padding:12px;margin-top:8px;">
          <p class="text-muted" style="font-size:12px;margin:0;">
            Aguardando solicitacao de encerramento do Bombeiro.
            Voce pode editar a descricao e o numero de vitimas.
          </p>
          <div class="form-actions" style="margin-top:12px;">
            <button class="btn-secondary" onclick="closeModal()">Fechar</button>
            <button class="btn-primary" onclick="salvarEdicaoOcorrencia(${oc.id})">Salvar alteracoes</button>
          </div>
        </div>
      `}
    `;
  } catch (erro) {
    document.getElementById('modal-body').innerHTML = '<div class="empty-state">Erro ao carregar detalhes.</div>';
  }
}

// Encerrar ocorrencia — so chamado quando ha solicitacao
async function encerrarOcorrencia(id) {
  const dados = {
    status:      'encerrada',
    prioridade:  document.getElementById('edit-prioridade')?.value,
    descricao:   document.getElementById('edit-descricao')?.value,
    num_vitimas: parseInt(document.getElementById('edit-vitimas')?.value) || 0,
  };
  try {
    await Ocorrencias.atualizar(id, dados);
    closeModal();
    showToast('Ocorrencia encerrada!', 'success');
    await carregarKanbanOcorrencias();
    if (mapaOcorrencias) {
      mapaOcorrencias.eachLayer((l) => { if (l instanceof L.Marker) mapaOcorrencias.removeLayer(l); });
      await carregarPinsOcorrencias();
    }
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// Salvar edicao sem encerrar (descricao + vitimas)
async function salvarEdicaoOcorrencia(id) {
  const dados = {
    descricao:   document.getElementById('edit-descricao')?.value,
    num_vitimas: parseInt(document.getElementById('edit-vitimas')?.value) || 0,
  };
  try {
    await Ocorrencias.atualizar(id, dados);
    closeModal();
    showToast('Ocorrencia atualizada!', 'success');
    await carregarKanbanOcorrencias();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// MODAL NOVA OCORRENCIA (botao + Nova do Kanban)
// =============================================

function abrirModalNovaOcorrencia() {
  openModal('Nova ocorrencia', `
    <div class="form-group"><label>Tipo</label>
      <select id="edit-tipo">
        <option value="incendio">Incendio</option><option value="acidente">Acidente</option>
        <option value="resgate">Resgate</option><option value="inundacao">Inundacao</option>
        <option value="outros">Outros</option>
      </select>
    </div>
    <div class="form-group"><label>Descricao</label>
      <textarea id="edit-descricao" rows="3" placeholder="Descreva..."></textarea>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Prioridade</label>
        <select id="edit-prioridade">
          <option value="baixa">Baixa</option><option value="media">Media</option>
          <option value="alta">Alta</option><option value="critica">Critica</option>
        </select>
      </div>
      <div class="form-group"><label>Nr de vitimas</label>
        <input type="number" id="edit-vitimas" min="0" value="0" />
      </div>
    </div>
    <div class="form-group"><label>Logradouro</label>
      <input type="text" id="edit-logradouro" placeholder="Ex: Eixo Monumental" />
    </div>
    <div class="form-row">
      <div class="form-group"><label>Bairro</label>
        <input type="text" id="edit-bairro" placeholder="Ex: Asa Norte" />
      </div>
      <div class="form-group"><label>Cidade</label>
        <input type="text" id="edit-cidade" value="Brasilia" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Latitude</label>
        <input type="number" id="edit-lat" step="any" placeholder="-15.7795" />
      </div>
      <div class="form-group"><label>Longitude</label>
        <input type="number" id="edit-lng" step="any" placeholder="-47.9292" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="criarOcorrencia()">Criar</button>
    </div>`);
}

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
    showToast('Ocorrencia criada!', 'success');
    await carregarKanbanOcorrencias();
    if (mapaOcorrencias) {
      mapaOcorrencias.eachLayer((l) => { if (l instanceof L.Marker) mapaOcorrencias.removeLayer(l); });
      await carregarPinsOcorrencias();
    }
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// KANBAN DE MANUTENCOES
// =============================================

async function carregarKanbanManutencoes() {
  try {
    const todasManutencoes = await Manutencoes.listar();
    const manutencoes = todasManutencoes.filter((m) => !['concluida','inativa'].includes(m.status));

    const colunas = {
      pendente:     document.getElementById('col-manut-pendente'),
      em_andamento: document.getElementById('col-manut-em-andamento'),
      concluida:    document.getElementById('col-manut-concluida'),
      inativa:      document.getElementById('col-manut-inativa'),
    };
    Object.values(colunas).forEach((col) => { if (col) col.innerHTML = ''; });
    const contadores = { pendente:0, em_andamento:0, concluida:0, inativa:0 };
    manutencoes.forEach((m) => {
      const card = criarCardManutencao(m);
      const col = colunas[m.status];
      if (col) { col.appendChild(card); contadores[m.status] = (contadores[m.status]||0)+1; }
    });
    const ids = {
      pendente:'count-manut-pendente', em_andamento:'count-manut-em-andamento',
      concluida:'count-manut-concluida', inativa:'count-manut-inativa'
    };
    Object.entries(ids).forEach(([s,elId]) => {
      const el = document.getElementById(elId);
      if (el) el.textContent = contadores[s]||0;
    });
  } catch (erro) { showToast('Erro ao carregar manutencoes.', 'error'); }
}

function criarCardManutencao(m) {
  const card = document.createElement('div');
  card.className = 'kanban-card';
  const labelTipo = { preventiva:'Preventiva', corretiva:'Corretiva' }[m.tipo] ?? m.tipo;
  const alvo = m.viatura_id ? `Viatura #${m.viatura_id}` : `Equipamento #${m.equipamento_id}`;
  const custo = m.custo ? `R$ ${parseFloat(m.custo).toFixed(2)}` : '--';
  card.innerHTML = `
    <div class="card-tipo">${labelTipo}</div>
    <div class="card-desc">${m.descricao}</div>
    <div class="card-footer">
      <span class="card-bairro">${alvo}</span>
      <span class="badge badge-muted">${custo}</span>
    </div>`;
  card.addEventListener('click', () => abrirModalManutencao(m));
  return card;
}

function abrirModalManutencao(m) {
  openModal(`Manutencao #${m.id}`, `
    <div class="form-group"><label>Tipo</label>
      <select id="manut-edit-tipo">
        <option value="preventiva" ${m.tipo==='preventiva'?'selected':''}>Preventiva</option>
        <option value="corretiva"  ${m.tipo==='corretiva' ?'selected':''}>Corretiva</option>
      </select>
    </div>
    <div class="form-group"><label>Descricao</label>
      <textarea id="manut-edit-descricao" rows="3">${m.descricao}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Status</label>
        <select id="manut-edit-status">
          <option value="pendente"     ${m.status==='pendente'    ?'selected':''}>Pendente</option>
          <option value="em_andamento" ${m.status==='em_andamento'?'selected':''}>Em andamento</option>
          <option value="concluida"    ${m.status==='concluida'   ?'selected':''}>Concluida</option>
          <option value="inativa"      ${m.status==='inativa'     ?'selected':''}>Inativa</option>
        </select>
      </div>
      <div class="form-group"><label>Custo (R$)</label>
        <input type="number" id="manut-edit-custo" step="0.01" min="0"
          value="${m.custo??''}" placeholder="0.00" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Data inicio</label>
        <input type="date" id="manut-edit-inicio" value="${m.data_inicio??''}" />
      </div>
      <div class="form-group"><label>Data fim</label>
        <input type="date" id="manut-edit-fim" value="${m.data_fim??''}" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="salvarEdicaoManutencao(${m.id})">Salvar</button>
    </div>`);
}

async function salvarEdicaoManutencao(id) {
  const dados = {
    tipo:        document.getElementById('manut-edit-tipo').value,
    descricao:   document.getElementById('manut-edit-descricao').value,
    status:      document.getElementById('manut-edit-status').value,
    custo:       parseFloat(document.getElementById('manut-edit-custo').value) || null,
    data_inicio: document.getElementById('manut-edit-inicio').value || null,
    data_fim:    document.getElementById('manut-edit-fim').value || null,
  };
  try {
    await Manutencoes.atualizar(id, dados);
    closeModal();
    if (['concluida','inativa'].includes(dados.status)) {
      showToast('Manutencao finalizada! Removida do kanban.', 'success');
    } else {
      showToast('Manutencao atualizada!', 'success');
    }
    await carregarKanbanManutencoes();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

function calcularDuracao(inicio, fim) {
  const diff    = new Date(fim) - new Date(inicio);
  const horas   = Math.floor(diff / 3600000);
  const minutos = Math.floor((diff % 3600000) / 60000);
  return `${horas}h ${minutos}min`;
}
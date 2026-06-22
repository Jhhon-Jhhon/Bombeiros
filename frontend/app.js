// =============================================
// APP.JS — inicialização e controle de perfis
// =============================================

function inicializarSeletorPerfil() {
  const botoes = document.querySelectorAll('.profile-btn');
  const views  = document.querySelectorAll('.view');
  botoes.forEach((btn) => {
    btn.addEventListener('click', () => {
      const perfil = btn.dataset.profile;
      botoes.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      views.forEach((v) => v.classList.remove('active'));
      document.getElementById(`view-${perfil}`).classList.add('active');
      if (perfil === 'comandante') carregarViewComandante();
      if (perfil === 'tecnico')    carregarViewTecnico();
      if (perfil === 'bombeiro')   carregarViewBombeiro();
      if (perfil === 'cidadao')    carregarViewCidadao();
    });
  });
}

// =============================================
// VIEW: COMANDANTE
// =============================================

async function carregarViewComandante() {
  await carregarKanbanOcorrencias();
  await carregarRecursosComandante();
  if (mapaOcorrencias) {
    mapaOcorrencias.eachLayer((layer) => {
      if (layer instanceof L.Marker) mapaOcorrencias.removeLayer(layer);
    });
    await carregarPinsOcorrencias();
  }
}

async function carregarRecursosComandante() {
  const grid = document.getElementById('resources-grid');
  if (!grid) return;
  grid.innerHTML = '';
  try {
    const [bombeiros, viaturas, equipamentos, equipes] = await Promise.all([
      Bombeiros.listar(),
      Viaturas.listar(),
      Equipamentos.listar(),
      Equipes.listar(),
    ]);

    grid.appendChild(criarResourceCard('👨‍🚒 Bombeiros', bombeiros,
      [
        { label: 'Nome',    key: 'nome' },
        { label: 'Patente', render: badgePatente },
        { label: 'Status',  render: badgeStatusBombeiro },
      ],
      {
        onEditar: (b) => abrirModalEditarBombeiro(b),
        btnExtra: { label: '+ Novo', onClick: abrirModalNovoBombeiro },
      }
    ));

    grid.appendChild(criarResourceCard('🚒 Viaturas', viaturas,
      [
        { label: 'Placa',  key: 'placa' },
        { label: 'Modelo', key: 'modelo' },
        { label: 'Status', render: badgeStatusViatura },
      ],
      {
        onEditar: (v) => abrirModalComandanteViatura(v),
        btnExtra: { label: '+ Nova', onClick: abrirModalNovaViatura },
      }
    ));

    grid.appendChild(criarResourceCard('🧰 Equipamentos', equipamentos,
      [
        { label: 'ID',     key: 'id' },
        { label: 'Nome',   key: 'nome' },
        { label: 'Tipo',   key: 'tipo' },
        { label: 'Status', render: badgeStatusEquipamento },
      ],
      {}
    ));

    grid.appendChild(criarResourceCard('👥 Equipes', equipes,
      [
        { label: 'Nome', key: 'nome' },
        { label: 'Tipo', key: 'tipo' },
      ],
      {
        onEditar: (eq) => abrirModalEditarEquipe(eq),
        btnExtra: { label: '+ Nova', onClick: abrirModalNovaEquipe },
      }
    ));

    const treinamentos = await Treinamentos.listar();
    grid.appendChild(criarResourceCard('🎓 Treinamentos', treinamentos,
      [
        { label: 'Título',    key: 'titulo' },
        { label: 'Tipo',      key: 'tipo' },
        { label: 'Status',    render: badgeStatusTreinamento },
        { label: 'Instrutor', key: 'instrutor' },
      ],
      {
        // FIX #3: Comandante abre modal com lista de inscritos
        onEditar: (t) => abrirModalComandanteTreinamento(t),
        btnExtra: { label: '+ Novo', onClick: abrirModalNovoTreinamento },
      }
    ));

    const [denuncias, solicitacoes] = await Promise.all([
      Denuncias.listar(),
      Solicitacoes.listar(),
    ]);

    grid.appendChild(criarResourceCard('📢 Denúncias recebidas', denuncias,
      [
        { label: 'Solicitante', key: 'solicitante' },
        { label: 'Tipo',        key: 'tipo' },
        {
          label: 'Status',
          render: (d) => {
            const mapa = {
              pendente:   { classe: 'badge-warning', label: 'Pendente' },
              em_analise: { classe: 'badge-info',    label: 'Em análise' },
              aprovada:   { classe: 'badge-success', label: 'Aprovada' },
              arquivada:  { classe: 'badge-muted',   label: 'Arquivada' },
              convertida: { classe: 'badge-success', label: 'Convertida' },
            };
            const { classe, label } = mapa[d.status] ?? { classe: 'badge-muted', label: d.status };
            return `<span class="badge ${classe}">${label}</span>`;
          },
        },
      ],
      { onEditar: (d) => abrirModalVerificarDenuncia(d) }
    ));

    grid.appendChild(criarResourceCard('📋 Solicitações', solicitacoes,
      [
        { label: 'Tipo',      key: 'tipo' },
        { label: 'Prioridade', key: 'prioridade' },
        {
          label: 'Status',
          render: (s) => s.arquivada
            ? `<span class="badge badge-muted">Arquivada</span>`
            : `<span class="badge badge-info">Ativa</span>`,
        },
      ],
      { onEditar: (s) => abrirModalAvaliarSolicitacao(s) }
    ));

  } catch (erro) {
    console.error('Erro carregarRecursosComandante:', erro);
    showToast('Erro ao carregar recursos.', 'error');
  }
}

function criarResourceCard(titulo, dados, colunas, opcoes = {}) {
  const card = document.createElement('div');
  card.className = 'resource-card';
  const header = document.createElement('div');
  header.className = 'resource-card-header';
  header.innerHTML = `<span class="resource-card-title">${titulo}</span>`;
  if (opcoes.btnExtra) {
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.textContent = opcoes.btnExtra.label;
    btn.addEventListener('click', opcoes.btnExtra.onClick);
    header.appendChild(btn);
  }
  card.appendChild(header);
  card.appendChild(criarTabela(colunas, dados, opcoes));
  return card;
}

// =============================================
// MODAIS DO COMANDANTE — Bombeiro
// =============================================

function abrirModalNovoBombeiro() {
  openModal('Novo bombeiro', `
    <div class="form-row">
      <div class="form-group">
        <label>Nome completo</label>
        <input type="text" id="b-nome" placeholder="Ex: João Silva" />
      </div>
      <div class="form-group">
        <label>Matrícula</label>
        <input type="text" id="b-matricula" placeholder="Ex: CB-007" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Patente</label>
        <select id="b-patente">
          <option value="soldado">Soldado</option>
          <option value="cabo">Cabo</option>
          <option value="sargento">Sargento</option>
          <option value="tenente">Tenente</option>
          <option value="capitao">Capitão</option>
          <option value="major">Major</option>
          <option value="tenente_coronel">Tenente Coronel</option>
          <option value="coronel">Coronel</option>
        </select>
      </div>
      <div class="form-group">
        <label>Especialidade</label>
        <input type="text" id="b-especialidade" placeholder="Ex: Combate a Incêndio" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Telefone</label>
        <input type="text" id="b-telefone" placeholder="61999990007" />
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="b-email" placeholder="nome@bombeiros.df.gov.br" />
      </div>
    </div>
    <div class="form-group">
      <label>Data de admissão</label>
      <input type="date" id="b-admissao" />
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="criarBombeiro()">Criar</button>
    </div>
  `);
}

function abrirModalEditarBombeiro(b) {
  openModal(`Bombeiro — ${b.nome}`, `
    <div class="form-row">
      <div class="form-group">
        <label>Nome completo</label>
        <input type="text" id="b-nome" value="${b.nome}" />
      </div>
      <div class="form-group">
        <label>Matrícula</label>
        <input type="text" value="${b.matricula}" disabled />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Patente</label>
        <select id="b-patente">
          <option value="soldado"         ${b.patente==='soldado'         ?'selected':''}>Soldado</option>
          <option value="cabo"            ${b.patente==='cabo'            ?'selected':''}>Cabo</option>
          <option value="sargento"        ${b.patente==='sargento'        ?'selected':''}>Sargento</option>
          <option value="tenente"         ${b.patente==='tenente'         ?'selected':''}>Tenente</option>
          <option value="capitao"         ${b.patente==='capitao'         ?'selected':''}>Capitão</option>
          <option value="major"           ${b.patente==='major'           ?'selected':''}>Major</option>
          <option value="tenente_coronel" ${b.patente==='tenente_coronel' ?'selected':''}>Tenente Coronel</option>
          <option value="coronel"         ${b.patente==='coronel'         ?'selected':''}>Coronel</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="b-status">
          <option value="ativo"    ${b.status==='ativo'    ?'selected':''}>Ativo</option>
          <option value="de_folga" ${b.status==='de_folga' ?'selected':''}>De folga</option>
          <option value="inativo"  ${b.status==='inativo'  ?'selected':''}>Inativo</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Especialidade</label>
      <input type="text" id="b-especialidade" value="${b.especialidade??''}" />
    </div>
    <div class="form-actions">
      <button class="btn-danger"    onclick="deletarBombeiro(${b.id})">Excluir</button>
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="salvarBombeiro(${b.id})">Salvar</button>
    </div>
  `);
}

async function criarBombeiro() {
  const dados = {
    nome:          document.getElementById('b-nome').value,
    matricula:     document.getElementById('b-matricula').value,
    patente:       document.getElementById('b-patente').value,
    especialidade: document.getElementById('b-especialidade').value,
    telefone:      document.getElementById('b-telefone').value,
    email:         document.getElementById('b-email').value,
    data_admissao: document.getElementById('b-admissao').value || null,
  };
  try {
    await Bombeiros.criar(dados);
    closeModal();
    showToast('Bombeiro cadastrado!', 'success');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function salvarBombeiro(id) {
  const dados = {
    nome:          document.getElementById('b-nome').value,
    patente:       document.getElementById('b-patente').value,
    status:        document.getElementById('b-status').value,
    especialidade: document.getElementById('b-especialidade').value,
  };
  try {
    await Bombeiros.atualizar(id, dados);
    closeModal();
    showToast('Bombeiro atualizado!', 'success');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function deletarBombeiro(id) {
  if (!confirm('Excluir este bombeiro?')) return;
  try {
    await Bombeiros.deletar(id);
    closeModal();
    showToast('Bombeiro excluído.', 'info');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// MODAIS DO COMANDANTE — Viatura (somente leitura)
// =============================================

function abrirModalNovaViatura() {
  openModal('Nova viatura', `
    <div class="form-row">
      <div class="form-group">
        <label>Placa</label>
        <input type="text" id="v-placa" placeholder="Ex: DF-005-AB" />
      </div>
      <div class="form-group">
        <label>Modelo</label>
        <input type="text" id="v-modelo" placeholder="Ex: Scania P360" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipo</label>
        <select id="v-tipo">
          <option value="auto_bomba">Auto Bomba</option>
          <option value="auto_escada">Auto Escada</option>
          <option value="ambulancia">Ambulância</option>
          <option value="veiculo_leve">Veículo Leve</option>
        </select>
      </div>
      <div class="form-group">
        <label>Ano de fabricação</label>
        <input type="number" id="v-ano" min="2000" max="2030" placeholder="Ex: 2023" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="criarViatura()">Criar</button>
    </div>
  `);
}

async function criarViatura() {
  const dados = {
    placa:          document.getElementById('v-placa').value,
    modelo:         document.getElementById('v-modelo').value,
    tipo:           document.getElementById('v-tipo').value,
    ano_fabricacao: parseInt(document.getElementById('v-ano').value) || null,
    status:         'disponivel',
  };
  if (!dados.placa || !dados.modelo) { showToast('Informe placa e modelo.', 'error'); return; }
  try {
    await Viaturas.criar(dados);
    closeModal();
    showToast('Viatura criada!', 'success');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

function abrirModalComandanteViatura(v) {
  const statusLabel = {
    disponivel:     'Disponível',
    em_manutencao:  'Em manutenção',
    em_atendimento: 'Em atendimento',
    inativa:        'Inativa',
  }[v.status] ?? v.status;

  const podeSolicitarManutencao = v.status === 'disponivel';

  openModal(`Viatura — ${v.placa}`, `
    <div class="form-row">
      <div class="form-group">
        <label>Placa</label>
        <input type="text" value="${v.placa}" disabled />
      </div>
      <div class="form-group">
        <label>Modelo</label>
        <input type="text" value="${v.modelo}" disabled />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipo</label>
        <input type="text" value="${v.tipo}" disabled />
      </div>
      <div class="form-group">
        <label>Status (definido pelo Técnico)</label>
        <input type="text" value="${statusLabel}" disabled
          style="color:${v.status==='disponivel'?'var(--color-encerrada)':v.status==='em_manutencao'?'var(--color-alta)':'var(--color-text-muted)'}" />
      </div>
    </div>
    ${!podeSolicitarManutencao ? `
      <p class="text-muted" style="font-size:12px;margin-top:8px;">
        ⚠ Viatura indisponível para manutenção (status: ${statusLabel}).
      </p>` : ''}
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Fechar</button>
      ${podeSolicitarManutencao ? `
        <button class="btn-primary" style="background:var(--color-alta);"
          onclick="solicitarManutencaoViatura(${v.id}, '${v.placa}')">
          🔧 Solicitar manutenção
        </button>` : ''}
    </div>
  `);
}

async function solicitarManutencaoViatura(viaturaId, placa) {
  openModal(`Solicitar manutenção — ${placa}`, `
    <div class="form-group">
      <label>Tipo de manutenção</label>
      <select id="sol-manut-tipo">
        <option value="preventiva">Preventiva</option>
        <option value="corretiva">Corretiva</option>
      </select>
    </div>
    <div class="form-group">
      <label>Descrição do problema</label>
      <textarea id="sol-manut-desc" rows="3" placeholder="Descreva o motivo da manutenção..."></textarea>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="confirmarSolicitacaoManutencao(${viaturaId})">Solicitar</button>
    </div>
  `);
}

async function confirmarSolicitacaoManutencao(viaturaId) {
  const tipo      = document.getElementById('sol-manut-tipo').value;
  const descricao = document.getElementById('sol-manut-desc').value;
  if (!descricao) { showToast('Informe a descrição.', 'error'); return; }
  try {
    await Manutencoes.criar({
      tipo, descricao, viatura_id: viaturaId,
      data_inicio: new Date().toISOString().split('T')[0],
    });
    await Viaturas.atualizar(viaturaId, { status: 'em_manutencao' });
    closeModal();
    showToast('Manutenção solicitada!', 'success');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// MODAIS DO COMANDANTE — Equipe
// =============================================

function abrirModalNovaEquipe() {
  openModal('Nova equipe', `
    <div class="form-group">
      <label>Nome</label>
      <input type="text" id="eq-nome-equipe" placeholder="Ex: Equipe Alpha" />
    </div>
    <div class="form-group">
      <label>Tipo</label>
      <input type="text" id="eq-tipo-equipe" placeholder="Ex: combate, resgate, APH" />
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="criarEquipe()">Criar</button>
    </div>
  `);
}

async function criarEquipe() {
  const dados = {
    nome: document.getElementById('eq-nome-equipe').value,
    tipo: document.getElementById('eq-tipo-equipe').value,
  };
  if (!dados.nome || !dados.tipo) { showToast('Informe nome e tipo.', 'error'); return; }
  try {
    await Equipes.criar(dados);
    closeModal();
    showToast('Equipe criada!', 'success');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

function abrirModalEditarEquipe(eq) {
  openModal(`Equipe — ${eq.nome}`, `
    <div class="form-group">
      <label>Nome</label>
      <input type="text" id="eq-nome-equipe" value="${eq.nome}" />
    </div>
    <div class="form-group">
      <label>Tipo</label>
      <input type="text" id="eq-tipo-equipe" value="${eq.tipo??''}" />
    </div>
    <div class="form-actions">
      <button class="btn-danger"    onclick="deletarEquipe(${eq.id})">Excluir</button>
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-secondary" onclick="abrirModalMembros(${eq.id},'${eq.nome}')">👥 Membros</button>
      <button class="btn-primary"   onclick="salvarEquipe(${eq.id})">Salvar</button>
    </div>
  `);
}

async function salvarEquipe(id) {
  const dados = {
    nome: document.getElementById('eq-nome-equipe').value,
    tipo: document.getElementById('eq-tipo-equipe').value,
  };
  try {
    await Equipes.atualizar(id, dados);
    closeModal();
    showToast('Equipe atualizada!', 'success');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function deletarEquipe(id) {
  if (!confirm('Excluir esta equipe?')) return;
  try {
    await Equipes.deletar(id);
    closeModal();
    showToast('Equipe excluída.', 'info');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// MEMBROS DE EQUIPE
// =============================================

async function abrirModalMembros(equipeId, equipeNome) {
  openModal(`Membros — ${equipeNome}`, '<div class="empty-state">Carregando...</div>');
  try {
    const [membros, bombeiros] = await Promise.all([
      request('GET', `/equipes/${equipeId}/bombeiros`),
      Bombeiros.listar(),
    ]);
    const idsAlocados = membros.map((m) => m.bombeiro_id);
    const disponiveis = bombeiros.filter((b) => !idsAlocados.includes(b.id));
    const listaMembros = membros.length > 0
      ? membros.map((m) => {
          const b = bombeiros.find((x) => x.id === m.bombeiro_id);
          const nome = b ? b.nome : `Bombeiro #${m.bombeiro_id}`;
          return `<div style="display:flex;justify-content:space-between;align-items:center;
                      padding:8px 0;border-bottom:1px solid var(--color-border);">
            <span>${nome}</span>
            <button class="btn-danger" style="padding:4px 10px;font-size:12px"
              onclick="removerMembroEquipe(${equipeId},${m.bombeiro_id},'${equipeNome}')">Remover</button>
          </div>`;
        }).join('')
      : '<div class="empty-state">Nenhum membro alocado.</div>';
    const selectOpcoes = disponiveis.length > 0
      ? disponiveis.map((b) => `<option value="${b.id}">${b.nome} — ${b.patente}</option>`).join('')
      : '<option disabled>Todos já alocados</option>';
    document.getElementById('modal-body').innerHTML = `
      <div class="form-group">
        <label>Membros atuais</label>
        <div style="max-height:200px;overflow-y:auto;">${listaMembros}</div>
      </div>
      <div class="form-group" style="margin-top:16px">
        <label>Adicionar bombeiro</label>
        <select id="select-bombeiro-equipe">${selectOpcoes}</select>
      </div>
      <div class="form-group">
        <label>Função (opcional)</label>
        <input type="text" id="funcao-membro" placeholder="Ex: Comandante de equipe" />
      </div>
      <div class="form-actions">
        <button class="btn-secondary" onclick="closeModal()">Fechar</button>
        <button class="btn-primary" onclick="adicionarMembroEquipe(${equipeId},'${equipeNome}')">Adicionar</button>
      </div>`;
  } catch (erro) {
    document.getElementById('modal-body').innerHTML = '<div class="empty-state">Erro ao carregar membros.</div>';
  }
}

async function adicionarMembroEquipe(equipeId, equipeNome) {
  const bombeiroId = parseInt(document.getElementById('select-bombeiro-equipe').value);
  const funcao = document.getElementById('funcao-membro').value || null;
  if (!bombeiroId) { showToast('Selecione um bombeiro.', 'error'); return; }
  try {
    await request('POST', `/equipes/${equipeId}/bombeiros`, { bombeiro_id: bombeiroId, funcao });
    showToast('Bombeiro adicionado!', 'success');
    await abrirModalMembros(equipeId, equipeNome);
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function removerMembroEquipe(equipeId, bombeiroId, equipeNome) {
  if (!confirm('Remover este bombeiro da equipe?')) return;
  try {
    await request('DELETE', `/equipes/${equipeId}/bombeiros/${bombeiroId}`);
    showToast('Membro removido.', 'info');
    await abrirModalMembros(equipeId, equipeNome);
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// MODAIS DO COMANDANTE — Treinamentos
// FIX #3: Comandante vê inscritos e marca presença
// =============================================

function abrirModalNovoTreinamento() {
  openModal('Novo treinamento', `
    <div class="form-group">
      <label>Título</label>
      <input type="text" id="tr-titulo" placeholder="Ex: Combate a Incêndio em Edificações" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipo</label>
        <select id="tr-tipo">
          <option value="teorico">Teórico</option>
          <option value="pratico">Prático</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="tr-status">
          <option value="agendado">Agendado</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Instrutor</label>
        <input type="text" id="tr-instrutor" placeholder="Ex: Cel. José Augusto" />
      </div>
      <div class="form-group">
        <label>Carga horária (h)</label>
        <input type="number" id="tr-carga" min="1" placeholder="Ex: 40" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Data de início</label>
        <input type="date" id="tr-inicio" />
      </div>
      <div class="form-group">
        <label>Data de fim</label>
        <input type="date" id="tr-fim" />
      </div>
    </div>
    <div class="form-group">
      <label>Descrição</label>
      <textarea id="tr-descricao" rows="3" placeholder="Descreva o treinamento..."></textarea>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="criarTreinamento()">Criar</button>
    </div>
  `);
}

// FIX #3: Modal do Comandante para treinamento — edita + vê inscritos + marca presença
async function abrirModalComandanteTreinamento(t) {
  openModal(`Treinamento — ${t.titulo}`, '<div class="empty-state">Carregando participantes...</div>');

  try {
    const [participantes, bombeiros] = await Promise.all([
      request('GET', `/treinamentos/${t.id}/bombeiros`),
      Bombeiros.listar(),
    ]);

    const listaParticipantes = participantes.length > 0
      ? participantes.map((p) => {
          const b = bombeiros.find((x) => x.id === p.bombeiro_id);
          const nome = b ? `${b.nome} (${b.matricula})` : `Bombeiro #${p.bombeiro_id}`;
          const badgeStatus = {
            inscrito:  '<span class="badge badge-info">Inscrito</span>',
            concluido: '<span class="badge badge-success">Concluído</span>',
            reprovado: '<span class="badge badge-danger">Reprovado</span>',
            desistiu:  '<span class="badge badge-muted">Desistiu</span>',
          }[p.status_participacao] ?? `<span class="badge badge-muted">${p.status_participacao}</span>`;

          return `<div style="display:flex;justify-content:space-between;align-items:center;
                      padding:8px 0;border-bottom:1px solid var(--color-border);gap:8px;">
            <span style="flex:1">${nome}</span>
            ${badgeStatus}
            <select onchange="atualizarParticipacao(${t.id}, ${p.bombeiro_id}, this.value)"
              style="background:var(--color-bg);color:var(--color-text);border:1px solid var(--color-border);
                     border-radius:6px;padding:4px 8px;font-size:12px;">
              <option value="inscrito"  ${p.status_participacao==='inscrito'  ?'selected':''}>Inscrito</option>
              <option value="concluido" ${p.status_participacao==='concluido' ?'selected':''}>Concluído</option>
              <option value="reprovado" ${p.status_participacao==='reprovado' ?'selected':''}>Reprovado</option>
              <option value="desistiu"  ${p.status_participacao==='desistiu'  ?'selected':''}>Desistiu</option>
            </select>
          </div>`;
        }).join('')
      : '<div class="empty-state">Nenhum bombeiro inscrito ainda.</div>';

    document.getElementById('modal-body').innerHTML = `
      <div class="form-group">
        <label>Título</label>
        <input type="text" id="tr-titulo" value="${t.titulo}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Tipo</label>
          <select id="tr-tipo">
            <option value="teorico" ${t.tipo==='teorico'?'selected':''}>Teórico</option>
            <option value="pratico" ${t.tipo==='pratico'?'selected':''}>Prático</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="tr-status">
            <option value="agendado"     ${t.status==='agendado'    ?'selected':''}>Agendado</option>
            <option value="em_andamento" ${t.status==='em_andamento'?'selected':''}>Em andamento</option>
            <option value="concluido"    ${t.status==='concluido'   ?'selected':''}>Concluído</option>
            <option value="cancelado"    ${t.status==='cancelado'   ?'selected':''}>Cancelado</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Instrutor</label>
          <input type="text" id="tr-instrutor" value="${t.instrutor??''}" />
        </div>
        <div class="form-group">
          <label>Carga horária (h)</label>
          <input type="number" id="tr-carga" min="1" value="${t.carga_horaria??''}" />
        </div>
      </div>
      <div class="form-group">
        <label>👥 Participantes inscritos</label>
        <div style="max-height:200px;overflow-y:auto;border:1px solid var(--color-border);
                    border-radius:8px;padding:8px;">${listaParticipantes}</div>
      </div>
      <div class="form-actions">
        <button class="btn-danger"    onclick="deletarTreinamento(${t.id})">Excluir</button>
        <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-primary"   onclick="salvarTreinamento(${t.id})">Salvar</button>
      </div>
    `;
  } catch (erro) {
    document.getElementById('modal-body').innerHTML = '<div class="empty-state">Erro ao carregar participantes.</div>';
  }
}

// FIX #3: Comandante atualiza status de participação de um bombeiro
async function atualizarParticipacao(treinamentoId, bombeiroId, novoStatus) {
  try {
    await request('PUT', `/treinamentos/${treinamentoId}/bombeiros/${bombeiroId}`, {
      status_participacao: novoStatus,
    });
    showToast('Participação atualizada!', 'success');
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

async function criarTreinamento() {
  const dados = {
    titulo:        document.getElementById('tr-titulo').value,
    tipo:          document.getElementById('tr-tipo').value,
    status:        document.getElementById('tr-status').value,
    instrutor:     document.getElementById('tr-instrutor').value || null,
    carga_horaria: parseInt(document.getElementById('tr-carga').value) || null,
    data_inicio:   document.getElementById('tr-inicio').value || null,
    data_fim:      document.getElementById('tr-fim').value || null,
    descricao:     document.getElementById('tr-descricao').value || null,
  };
  if (!dados.titulo) { showToast('Informe o título.', 'error'); return; }
  try {
    await Treinamentos.criar(dados);
    closeModal();
    showToast('Treinamento criado!', 'success');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function salvarTreinamento(id) {
  const dados = {
    titulo:        document.getElementById('tr-titulo').value,
    tipo:          document.getElementById('tr-tipo').value,
    status:        document.getElementById('tr-status').value,
    instrutor:     document.getElementById('tr-instrutor').value || null,
    carga_horaria: parseInt(document.getElementById('tr-carga').value) || null,
    data_inicio:   document.getElementById('tr-inicio')?.value || null,
    data_fim:      document.getElementById('tr-fim')?.value || null,
    descricao:     document.getElementById('tr-descricao')?.value || null,
  };
  try {
    await Treinamentos.atualizar(id, dados);
    closeModal();
    showToast('Treinamento atualizado!', 'success');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function deletarTreinamento(id) {
  if (!confirm('Excluir este treinamento?')) return;
  try {
    await Treinamentos.deletar(id);
    closeModal();
    showToast('Treinamento excluído.', 'info');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// MODAIS DO COMANDANTE — Denúncias
// FIX #5: status "aprovada" em vez de "resolvida"
// =============================================

function abrirModalVerificarDenuncia(d) {
  openModal(`Denúncia — ${d.solicitante}`, `
    <div class="form-group">
      <label>Solicitante</label>
      <input type="text" value="${d.solicitante}" disabled />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Telefone</label>
        <input type="text" value="${d.telefone??'—'}" disabled />
      </div>
      <div class="form-group">
        <label>Tipo</label>
        <input type="text" value="${d.tipo}" disabled />
      </div>
    </div>
    <div class="form-group">
      <label>Endereço informado</label>
      <input type="text" value="${d.endereco_informado??'—'}" disabled />
    </div>
    <div class="form-group">
      <label>Descrição</label>
      <textarea rows="3" disabled>${d.descricao}</textarea>
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="den-status">
        <option value="pendente"   ${d.status==='pendente'   ?'selected':''}>Pendente</option>
        <option value="em_analise" ${d.status==='em_analise' ?'selected':''}>Em análise</option>
        <option value="aprovada"   ${d.status==='aprovada'   ?'selected':''}>Aprovada</option>
        <option value="arquivada"  ${d.status==='arquivada'  ?'selected':''}>Arquivada</option>
      </select>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="atualizarDenuncia(${d.id})">Atualizar</button>
    </div>
  `);
}

async function atualizarDenuncia(id) {
  const dados = { status: document.getElementById('den-status').value };
  try {
    await Denuncias.atualizar(id, dados);
    closeModal();
    showToast('Denúncia atualizada!', 'success');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

function abrirModalAvaliarSolicitacao(s) {
  openModal(`Solicitação #${s.id}`, `
    <div class="form-row">
      <div class="form-group">
        <label>Tipo</label>
        <input type="text" value="${s.tipo}" disabled />
      </div>
      <div class="form-group">
        <label>Prioridade</label>
        <input type="text" value="${s.prioridade??'—'}" disabled />
      </div>
    </div>
    <div class="form-group">
      <label>Observação</label>
      <textarea id="sol-obs" rows="3" placeholder="Observação do comandante...">${s.observacao??''}</textarea>
    </div>
    <div class="form-group">
      <label>Arquivar solicitação?</label>
      <select id="sol-arquivada">
        <option value="false" ${!s.arquivada?'selected':''}>Não — manter ativa</option>
        <option value="true"  ${s.arquivada ?'selected':''}>Sim — arquivar</option>
      </select>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="avaliarSolicitacao(${s.id})">Salvar</button>
    </div>
  `);
}

async function avaliarSolicitacao(id) {
  const dados = {
    arquivada:  document.getElementById('sol-arquivada').value === 'true',
    observacao: document.getElementById('sol-obs').value || null,
  };
  try {
    await Solicitacoes.atualizar(id, dados);
    closeModal();
    showToast('Solicitação atualizada!', 'success');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// VIEW: TÉCNICO
// =============================================

async function carregarViewTecnico() {
  const container = document.getElementById('tecnico-content');
  if (!container) return;
  container.innerHTML = `
    <div class="tecnico-layout">
      <div class="kanban-panel kanban-manutencao">
        <div class="panel-header">
          <span class="panel-title">Kanban de manutenções</span>
          <button class="btn-primary" onclick="abrirModalNovaManutencao()">+ Nova</button>
        </div>
        <div class="kanban-board" style="grid-template-columns: repeat(4, 1fr);">
          <div class="kanban-col">
            <div class="kanban-col-header status-pendente">
              Pendente <span class="col-count" id="count-manut-pendente">0</span>
            </div>
            <div class="kanban-cards" id="col-manut-pendente"></div>
          </div>
          <div class="kanban-col">
            <div class="kanban-col-header status-em-andamento">
              Em andamento <span class="col-count" id="count-manut-em-andamento">0</span>
            </div>
            <div class="kanban-cards" id="col-manut-em-andamento"></div>
          </div>
          <div class="kanban-col">
            <div class="kanban-col-header status-concluida">
              Concluída <span class="col-count" id="count-manut-concluida">0</span>
            </div>
            <div class="kanban-cards" id="col-manut-concluida"></div>
          </div>
          <div class="kanban-col">
            <div class="kanban-col-header status-inativa">
              Inativa <span class="col-count" id="count-manut-inativa">0</span>
            </div>
            <div class="kanban-cards" id="col-manut-inativa"></div>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:20px;">
        <div class="resource-card" id="card-viaturas-tecnico"></div>
        <div class="resource-card" id="card-equipamentos-tecnico"></div>
      </div>
    </div>
  `;
  await carregarKanbanManutencoes();
  await carregarTabelasTecnico();
}

async function carregarTabelasTecnico() {
  try {
    const [viaturas, equipamentos] = await Promise.all([
      Viaturas.listar(),
      Equipamentos.listar(),
    ]);

    const cardV = document.getElementById('card-viaturas-tecnico');
    cardV.innerHTML = `<div class="resource-card-header">
      <span class="resource-card-title">🚒 Viaturas</span>
    </div>`;
    cardV.appendChild(criarTabela(
      [
        { label: 'Placa',  key: 'placa' },
        { label: 'Modelo', key: 'modelo' },
        { label: 'Status', render: badgeStatusViatura },
      ],
      viaturas,
      { onEditar: (v) => abrirModalTecnicoViatura(v) }
    ));

    const cardE = document.getElementById('card-equipamentos-tecnico');
    cardE.innerHTML = `<div class="resource-card-header">
      <span class="resource-card-title">🧰 Equipamentos</span>
      <button class="btn-primary" onclick="abrirModalNovoEquipamento()">+ Novo</button>
    </div>`;
    cardE.appendChild(criarTabela(
      [
        { label: 'ID',     key: 'id' },
        { label: 'Nome',   key: 'nome' },
        { label: 'Tipo',   key: 'tipo' },
        { label: 'Status', render: badgeStatusEquipamento },
      ],
      equipamentos,
      { onEditar: (e) => abrirModalTecnicoEquipamento(e) }
    ));
  } catch (erro) {
    showToast('Erro ao carregar dados do técnico.', 'error');
  }
}

function abrirModalTecnicoViatura(v) {
  openModal(`Viatura — ${v.placa}`, `
    <div class="form-group">
      <label>Modelo</label>
      <input type="text" value="${v.modelo}" disabled />
    </div>
    <div class="form-group">
      <label>Status</label>
      <select id="tecnico-v-status">
        <option value="disponivel"    ${v.status==='disponivel'    ?'selected':''}>Disponível</option>
        <option value="em_manutencao" ${v.status==='em_manutencao' ?'selected':''}>Em manutenção</option>
        <option value="inativa"       ${v.status==='inativa'       ?'selected':''}>Inativa</option>
      </select>
    </div>
    <p class="text-muted" style="font-size:12px;margin-top:4px;">
      O Técnico é responsável por liberar a viatura como disponível após concluir a manutenção.
    </p>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="tecnicoAtualizarViatura(${v.id})">Atualizar status</button>
    </div>
  `);
}

async function tecnicoAtualizarViatura(id) {
  const dados = { status: document.getElementById('tecnico-v-status').value };
  try {
    await Viaturas.atualizar(id, dados);
    closeModal();
    showToast('Status da viatura atualizado!', 'success');
    await carregarTabelasTecnico();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

function abrirModalNovoEquipamento() {
  openModal('Novo equipamento', `
    <div class="form-group">
      <label>Nome</label>
      <input type="text" id="teq-nome" placeholder="Ex: Mangueira 40mm" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipo</label>
        <select id="teq-tipo">
          <option value="combate">Combate</option>
          <option value="resgate">Resgate</option>
          <option value="medico">Médico</option>
          <option value="outros">Outros</option>
        </select>
      </div>
      <div class="form-group">
        <label>Número de série</label>
        <input type="text" id="teq-serie" placeholder="Ex: MNG-001" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="criarEquipamentoTecnico()">Criar</button>
    </div>
  `);
}

async function criarEquipamentoTecnico() {
  const dados = {
    nome:         document.getElementById('teq-nome').value,
    tipo:         document.getElementById('teq-tipo').value,
    numero_serie: document.getElementById('teq-serie').value || null,
    status:       'disponivel',
  };
  if (!dados.nome) { showToast('Informe o nome.', 'error'); return; }
  try {
    await Equipamentos.criar(dados);
    closeModal();
    showToast('Equipamento criado!', 'success');
    await carregarTabelasTecnico();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function abrirModalTecnicoEquipamento(e) {
  const viaturas = await Viaturas.listar();
  const opcoesViaturas = viaturas.map((v) =>
    `<option value="${v.id}">${v.placa} — ${v.modelo}</option>`
  ).join('');

  openModal(`Equipamento #${e.id} — ${e.nome}`, `
    <div class="form-group">
      <label>Nome</label>
      <input type="text" value="${e.nome}" disabled />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipo</label>
        <input type="text" value="${e.tipo}" disabled />
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="teq-edit-status">
          <option value="disponivel"    ${e.status==='disponivel'    ?'selected':''}>Disponível</option>
          <option value="em_uso"        ${e.status==='em_uso'        ?'selected':''}>Em uso</option>
          <option value="em_manutencao" ${e.status==='em_manutencao' ?'selected':''}>Em manutenção</option>
          <option value="inativo"       ${e.status==='inativo'       ?'selected':''}>Inativo</option>
        </select>
      </div>
    </div>
    <div class="form-group" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border)">
      <label>Associar a uma viatura</label>
      <div style="display:flex;gap:8px;">
        <select id="teq-viatura-select" style="flex:1">${opcoesViaturas}</select>
        <button class="btn-secondary" onclick="associarEquipamentoViatura(${e.id})">Associar</button>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="salvarEquipamentoTecnico(${e.id})">Salvar status</button>
    </div>
  `);
}

async function salvarEquipamentoTecnico(id) {
  const dados = { status: document.getElementById('teq-edit-status').value };
  try {
    await Equipamentos.atualizar(id, dados);
    closeModal();
    showToast('Status do equipamento atualizado!', 'success');
    await carregarTabelasTecnico();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function associarEquipamentoViatura(equipamentoId) {
  const viaturaId = parseInt(document.getElementById('teq-viatura-select').value);
  if (!viaturaId) { showToast('Selecione uma viatura.', 'error'); return; }
  try {
    await request('POST', `/viaturas/${viaturaId}/equipamentos`, { equipamento_id: equipamentoId, quantidade: 1 });
    showToast('Equipamento associado à viatura!', 'success');
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

function abrirModalNovaManutencao() {
  openModal('Nova manutenção', `
    <div class="form-group">
      <label>Tipo</label>
      <select id="manut-tipo">
        <option value="preventiva">Preventiva</option>
        <option value="corretiva">Corretiva</option>
      </select>
    </div>
    <div class="form-group">
      <label>Descrição</label>
      <textarea id="manut-descricao" rows="3" placeholder="Descreva a manutenção..."></textarea>
    </div>
    <p class="text-muted" style="font-size:12px;margin:8px 0;">
      Busque a viatura pela placa <strong>ou</strong> o equipamento pelo nome. Ao menos um é obrigatório.
    </p>
    <div class="form-group">
      <label>Placa da viatura</label>
      <div style="display:flex;gap:8px;">
        <input type="text" id="manut-placa" placeholder="Ex: DF-001-AB" style="flex:1" />
        <button class="btn-secondary" onclick="buscarViaturaParaManutencao()">Buscar</button>
      </div>
      <span id="manut-viatura-info" class="text-muted" style="font-size:12px;"></span>
      <input type="hidden" id="manut-viatura-id" />
    </div>
    <div class="form-group">
      <label>Nome do equipamento</label>
      <div style="display:flex;gap:8px;">
        <input type="text" id="manut-eq-nome" placeholder="Ex: Mangueira de Ataque" style="flex:1" />
        <button class="btn-secondary" onclick="buscarEquipamentoParaManutencao()">Buscar</button>
      </div>
      <span id="manut-eq-info" class="text-muted" style="font-size:12px;"></span>
      <input type="hidden" id="manut-equipamento-id" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Data de início</label>
        <input type="date" id="manut-inicio" />
      </div>
      <div class="form-group">
        <label>Custo (R$)</label>
        <input type="number" id="manut-custo" step="0.01" min="0" placeholder="0.00" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="criarManutencao()">Criar</button>
    </div>
  `);
}

async function buscarViaturaParaManutencao() {
  const placa = document.getElementById('manut-placa').value.trim();
  if (!placa) { showToast('Informe a placa.', 'error'); return; }
  try {
    const viaturas = await Viaturas.listar();
    const v = viaturas.find((x) => x.placa.toLowerCase() === placa.toLowerCase());
    if (v) {
      document.getElementById('manut-viatura-id').value = v.id;
      document.getElementById('manut-viatura-info').textContent = `✓ ${v.modelo} encontrada (ID: ${v.id})`;
      document.getElementById('manut-viatura-info').style.color = 'var(--color-encerrada)';
    } else {
      document.getElementById('manut-viatura-id').value = '';
      document.getElementById('manut-viatura-info').textContent = '✗ Viatura não encontrada';
      document.getElementById('manut-viatura-info').style.color = 'var(--color-critica)';
    }
  } catch (erro) { showToast('Erro ao buscar viatura.', 'error'); }
}

async function buscarEquipamentoParaManutencao() {
  const nome = document.getElementById('manut-eq-nome').value.trim();
  if (!nome) { showToast('Informe o nome.', 'error'); return; }
  try {
    const equipamentos = await Equipamentos.listar();
    const e = equipamentos.find((x) => x.nome.toLowerCase().includes(nome.toLowerCase()));
    if (e) {
      document.getElementById('manut-equipamento-id').value = e.id;
      document.getElementById('manut-eq-info').textContent = `✓ ${e.nome} encontrado (ID: ${e.id})`;
      document.getElementById('manut-eq-info').style.color = 'var(--color-encerrada)';
    } else {
      document.getElementById('manut-equipamento-id').value = '';
      document.getElementById('manut-eq-info').textContent = '✗ Equipamento não encontrado';
      document.getElementById('manut-eq-info').style.color = 'var(--color-critica)';
    }
  } catch (erro) { showToast('Erro ao buscar equipamento.', 'error'); }
}

async function criarManutencao() {
  const viaturaId     = parseInt(document.getElementById('manut-viatura-id').value) || null;
  const equipamentoId = parseInt(document.getElementById('manut-equipamento-id').value) || null;
  if (!viaturaId && !equipamentoId) {
    showToast('Busque e selecione uma viatura ou equipamento antes de criar.', 'error');
    return;
  }
  const dados = {
    tipo:           document.getElementById('manut-tipo').value,
    descricao:      document.getElementById('manut-descricao').value,
    viatura_id:     viaturaId,
    equipamento_id: equipamentoId,
    data_inicio:    document.getElementById('manut-inicio').value || null,
    custo:          parseFloat(document.getElementById('manut-custo').value) || null,
  };
  if (!dados.descricao) { showToast('Informe a descrição.', 'error'); return; }
  try {
    await Manutencoes.criar(dados);
    closeModal();
    showToast('Manutenção criada!', 'success');
    await carregarKanbanManutencoes();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// VIEW: BOMBEIRO
// FIX #2: participação só confirma inscrição
// FIX #4: ocorrência só vai para em_andamento
// FIX #4: só registra ocorrência se houver denúncia aprovada
// =============================================

async function carregarViewBombeiro() {
  const container = document.getElementById('bombeiro-content');
  if (!container) return;

  // FIX #4: verifica se há denúncias aprovadas
  let temDenunciaAprovada = false;
  try {
    const denuncias = await Denuncias.listar();
    temDenunciaAprovada = denuncias.some((d) => d.status === 'aprovada');
  } catch (e) {}

  container.innerHTML = `
    <div class="resources-grid">

      <div class="resource-card">
        <div class="resource-card-header">
          <span class="resource-card-title">📢 Denúncias — base para ocorrências</span>
        </div>
        <div id="tabela-denuncias-bombeiro" style="padding:8px;">
          <div class="empty-state">Carregando...</div>
        </div>
      </div>

      <div class="resource-card">
        <div class="resource-card-header">
          <span class="resource-card-title">🚨 Registrar ocorrência</span>
          ${temDenunciaAprovada
            ? `<button class="btn-primary" onclick="abrirModalRegistrarOcorrencia()">+ Nova</button>`
            : `<span class="badge badge-muted" title="Aguarde uma denúncia aprovada pelo Comandante">
                 Aguardando aprovação
               </span>`}
        </div>
        <div style="padding:16px;color:var(--color-text-muted);font-size:13px;">
          ${temDenunciaAprovada
            ? 'Há denúncias aprovadas. Registre a ocorrência com endereço e prioridade.'
            : '⚠ O Comandante deve aprovar uma denúncia antes de registrar a ocorrência.'}
        </div>
      </div>

      <div class="resource-card">
        <div class="resource-card-header">
          <span class="resource-card-title">🔄 Atualizar status de ocorrência</span>
        </div>
        <div id="tabela-ocorrencias-bombeiro" style="padding:8px;">
          <div class="empty-state">Carregando...</div>
        </div>
      </div>

      <div class="resource-card" style="min-height:320px;">
        <div class="resource-card-header">
          <span class="resource-card-title">🎓 Participar de treinamento</span>
        </div>
        <div id="tabela-treinamentos-bombeiro" style="padding:8px;">
          <div class="empty-state">Carregando...</div>
        </div>
      </div>

    </div>
  `;

  await carregarDenunciasBombeiro();
  await carregarTabelaOcorrenciasBombeiro();
  await carregarTabelaTreinamentosBombeiro();
}

async function carregarDenunciasBombeiro() {
  const container = document.getElementById('tabela-denuncias-bombeiro');
  if (!container) return;
  try {
    const denuncias = await Denuncias.listar();
    const tabela = criarTabela(
      [
        { label: 'Solicitante', key: 'solicitante' },
        { label: 'Tipo',        key: 'tipo' },
        { label: 'Endereço',    key: 'endereco_informado' },
        { label: 'Descrição',   key: 'descricao' },
        {
          label: 'Status',
          render: (d) => {
            const mapa = {
              pendente:   { classe: 'badge-warning', label: 'Pendente' },
              em_analise: { classe: 'badge-info',    label: 'Em análise' },
              aprovada:   { classe: 'badge-success', label: 'Aprovada' },
              arquivada:  { classe: 'badge-muted',   label: 'Arquivada' },
            };
            const { classe, label } = mapa[d.status] ?? { classe: 'badge-muted', label: d.status };
            return `<span class="badge ${classe}">${label}</span>`;
          },
        },
      ],
      denuncias
    );
    container.innerHTML = '';
    container.appendChild(tabela);
  } catch (erro) {
    container.innerHTML = '<div class="empty-state">Erro ao carregar denúncias.</div>';
  }
}

async function carregarTabelaOcorrenciasBombeiro() {
  const container = document.getElementById('tabela-ocorrencias-bombeiro');
  if (!container) return;
  try {
    const ocorrencias = await Ocorrencias.listar();
    const tabela = criarTabela(
      [
        { label: 'Tipo',  key: 'tipo' },
        { label: 'Local', render: (oc) => oc.endereco?.bairro ?? '—' },
        {
          label: 'Status',
          render: (oc) => {
            const mapa = {
              aberta:       { classe: 'badge-warning', label: 'Aberta' },
              em_andamento: { classe: 'badge-info',    label: 'Em andamento' },
              encerrada:    { classe: 'badge-success', label: 'Encerrada' },
            };
            const { classe, label } = mapa[oc.status] ?? { classe: 'badge-muted', label: oc.status };
            return `<span class="badge ${classe}">${label}</span>`;
          },
        },
        {
          label: 'Prioridade',
          render: (oc) => {
            const mapa = {
              critica: { classe: 'badge-critica', label: 'Crítica' },
              alta:    { classe: 'badge-alta',    label: 'Alta' },
              media:   { classe: 'badge-media',   label: 'Média' },
              baixa:   { classe: 'badge-baixa',   label: 'Baixa' },
            };
            const { classe, label } = mapa[oc.prioridade] ?? { classe: 'badge-muted', label: oc.prioridade };
            return `<span class="badge ${classe}">${label}</span>`;
          },
        },
      ],
      // FIX #4: só mostra ocorrências abertas ou em andamento para o bombeiro atualizar
      ocorrencias.filter((oc) => oc.status !== 'encerrada'),
      { onEditar: (oc) => abrirModalAtualizarStatusOcorrencia(oc) }
    );
    container.innerHTML = '';
    container.appendChild(tabela);
  } catch (erro) {
    container.innerHTML = '<div class="empty-state">Erro ao carregar ocorrências.</div>';
  }
}

async function carregarTabelaTreinamentosBombeiro() {
  const container = document.getElementById('tabela-treinamentos-bombeiro');
  if (!container) return;
  try {
    const treinamentos = await Treinamentos.listar();
    const tabela = criarTabela(
      [
        { label: 'Título',    key: 'titulo' },
        { label: 'Tipo',      key: 'tipo' },
        { label: 'Status',    render: badgeStatusTreinamento },
        { label: 'Instrutor', key: 'instrutor' },
        { label: 'Carga (h)', key: 'carga_horaria' },
      ],
      treinamentos,
      { onEditar: (t) => abrirModalParticiparTreinamento(t) }
    );
    container.innerHTML = '';
    container.appendChild(tabela);
  } catch (erro) {
    container.innerHTML = '<div class="empty-state">Erro ao carregar treinamentos.</div>';
  }
}

function abrirModalRegistrarOcorrencia() {
  openModal('Registrar ocorrência', `
    <div class="form-group">
      <label>Tipo</label>
      <select id="oc-tipo">
        <option value="incendio">Incêndio</option>
        <option value="acidente">Acidente</option>
        <option value="resgate">Resgate</option>
        <option value="inundacao">Inundação</option>
        <option value="outros">Outros</option>
      </select>
    </div>
    <div class="form-group">
      <label>Descrição</label>
      <textarea id="oc-descricao" rows="3" placeholder="Descreva a ocorrência..."></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Prioridade</label>
        <select id="oc-prioridade">
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>
      <div class="form-group">
        <label>Nº de vítimas</label>
        <input type="number" id="oc-vitimas" min="0" value="0" />
      </div>
    </div>
    <div class="form-group">
      <label>Logradouro</label>
      <input type="text" id="oc-logradouro" placeholder="Ex: Eixo Monumental, s/n" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Bairro</label>
        <input type="text" id="oc-bairro" placeholder="Ex: Asa Norte" />
      </div>
      <div class="form-group">
        <label>Cidade</label>
        <input type="text" id="oc-cidade" value="Brasília" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="registrarOcorrenciaBombeiro()">Registrar</button>
    </div>
  `);
}

async function registrarOcorrenciaBombeiro() {
  const dados = {
    tipo:        document.getElementById('oc-tipo').value,
    descricao:   document.getElementById('oc-descricao').value,
    prioridade:  document.getElementById('oc-prioridade').value,
    num_vitimas: parseInt(document.getElementById('oc-vitimas').value) || 0,
    endereco: {
      logradouro: document.getElementById('oc-logradouro').value,
      bairro:     document.getElementById('oc-bairro').value,
      cidade:     document.getElementById('oc-cidade').value,
    },
  };
  if (!dados.descricao) { showToast('Informe a descrição.', 'error'); return; }
  try {
    await Ocorrencias.criar(dados);
    closeModal();
    showToast('Ocorrência registrada!', 'success');
    await carregarTabelaOcorrenciasBombeiro();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// FIX #4: Bombeiro só pode mover para em_andamento
function abrirModalAtualizarStatusOcorrencia(oc) {
  openModal(`Ocorrência #${oc.id} — ${oc.tipo}`, `
    <div class="form-group">
      <label>Descrição</label>
      <textarea id="oc-edit-descricao" rows="3">${oc.descricao}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Status</label>
        <select id="oc-edit-status">
          <option value="aberta"       ${oc.status==='aberta'       ?'selected':''}>Aberta</option>
          <option value="em_andamento" ${oc.status==='em_andamento' ?'selected':''}>Em andamento</option>
        </select>
      </div>
      <div class="form-group">
        <label>Nº de vítimas</label>
        <input type="number" id="oc-edit-vitimas" min="0" value="${oc.num_vitimas??0}" />
      </div>
    </div>
    <p class="text-muted" style="font-size:12px;margin-top:4px;">
      ⚠ Para encerrar a ocorrência, solicite ao Comandante.
    </p>
    <div class="form-group">
      <label>Vincular bombeiro (matrícula)</label>
      <div style="display:flex;gap:8px;">
        <input type="text" id="oc-bombeiro-matricula" placeholder="Ex: CB-001" style="flex:1" />
        <button class="btn-secondary" onclick="vincularBombeiroOcorrencia(${oc.id})">Vincular</button>
      </div>
    </div>
    <div class="form-group">
      <label>Adicionar viatura (placa)</label>
      <div style="display:flex;gap:8px;">
        <input type="text" id="oc-viatura-placa" placeholder="Ex: DF-001-AB" style="flex:1" />
        <button class="btn-secondary" onclick="adicionarViaturaOcorrencia(${oc.id})">Adicionar</button>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="atualizarStatusOcorrencia(${oc.id})">Salvar</button>
    </div>
  `);
}

async function atualizarStatusOcorrencia(id) {
  const dados = {
    status:      document.getElementById('oc-edit-status').value,
    descricao:   document.getElementById('oc-edit-descricao').value,
    num_vitimas: parseInt(document.getElementById('oc-edit-vitimas').value) || 0,
  };
  try {
    await Ocorrencias.atualizar(id, dados);
    closeModal();
    showToast('Ocorrência atualizada!', 'success');
    await carregarTabelaOcorrenciasBombeiro();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function vincularBombeiroOcorrencia(ocorrenciaId) {
  const matricula = document.getElementById('oc-bombeiro-matricula').value.trim();
  if (!matricula) { showToast('Informe a matrícula.', 'error'); return; }
  try {
    const bombeiros = await Bombeiros.listar();
    const b = bombeiros.find((x) => x.matricula.toLowerCase() === matricula.toLowerCase());
    if (!b) { showToast('Bombeiro não encontrado.', 'error'); return; }
    await request('POST', `/ocorrencias/${ocorrenciaId}/bombeiros`, { bombeiro_id: b.id });
    showToast(`${b.nome} vinculado!`, 'success');
    document.getElementById('oc-bombeiro-matricula').value = '';
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function adicionarViaturaOcorrencia(ocorrenciaId) {
  const placa = document.getElementById('oc-viatura-placa').value.trim();
  if (!placa) { showToast('Informe a placa.', 'error'); return; }
  try {
    const viaturas = await Viaturas.listar();
    const v = viaturas.find((x) => x.placa.toLowerCase() === placa.toLowerCase());
    if (!v) { showToast('Viatura não encontrada.', 'error'); return; }
    await request('POST', `/ocorrencias/${ocorrenciaId}/viaturas`, { viatura_id: v.id });
    showToast(`Viatura ${v.placa} adicionada!`, 'success');
    document.getElementById('oc-viatura-placa').value = '';
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// FIX #2: Bombeiro só confirma inscrição — sem escolher status
function abrirModalParticiparTreinamento(t) {
  openModal(`Participar — ${t.titulo}`, `
    <div class="form-group">
      <label>Tipo de treinamento</label>
      <input type="text" value="${t.tipo==='pratico'?'Prático':'Teórico'}" disabled />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Instrutor</label>
        <input type="text" value="${t.instrutor??'—'}" disabled />
      </div>
      <div class="form-group">
        <label>Carga horária</label>
        <input type="text" value="${t.carga_horaria?t.carga_horaria+'h':'—'}" disabled />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Data de início</label>
        <input type="text" value="${t.data_inicio??'—'}" disabled />
      </div>
      <div class="form-group">
        <label>Data de fim</label>
        <input type="text" value="${t.data_fim??'—'}" disabled />
      </div>
    </div>
    ${t.descricao ? `
      <div class="form-group">
        <label>Descrição</label>
        <textarea rows="2" disabled>${t.descricao}</textarea>
      </div>` : ''}
    <div class="form-group">
      <label>Sua matrícula</label>
      <input type="text" id="part-matricula" placeholder="Ex: CB-001" />
    </div>
    <p class="text-muted" style="font-size:12px;">
      Ao confirmar, sua inscrição será registrada com status <strong>Inscrito</strong>.
      O Comandante atualizará após o treinamento.
    </p>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="participarTreinamento(${t.id})">Confirmar inscrição</button>
    </div>
  `);
}

// FIX #2: status fixo = inscrito
async function participarTreinamento(treinamentoId) {
  const matricula = document.getElementById('part-matricula').value.trim();
  if (!matricula) { showToast('Informe sua matrícula.', 'error'); return; }
  try {
    const bombeiros = await Bombeiros.listar();
    const b = bombeiros.find((x) => x.matricula.toLowerCase() === matricula.toLowerCase());
    if (!b) { showToast('Matrícula não encontrada.', 'error'); return; }
    await request('POST', `/treinamentos/${treinamentoId}/bombeiros`, {
      bombeiro_id:         b.id,
      status_participacao: 'inscrito',
    });
    closeModal();
    showToast(`${b.nome} inscrito no treinamento!`, 'success');
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// VIEW: CIDADÃO
// =============================================

async function carregarViewCidadao() {
  const container = document.getElementById('cidadao-content');
  if (!container) return;
  container.innerHTML = `
    <div class="cidadao-layout">
      <div class="cidadao-form-card">
        <h2>📢 Registrar denúncia</h2>
        <p>Informe uma situação de risco para análise dos bombeiros.</p>
        <div class="form-group">
          <label>Seu nome</label>
          <input type="text" id="den-nome" placeholder="Nome completo" />
        </div>
        <div class="form-group">
          <label>Telefone</label>
          <input type="text" id="den-telefone" placeholder="61999990000" />
        </div>
        <div class="form-group">
          <label>Tipo de ocorrência</label>
          <select id="den-tipo">
            <option value="incendio">Incêndio</option>
            <option value="acidente">Acidente</option>
            <option value="inundacao">Inundação</option>
            <option value="outros">Outros</option>
          </select>
        </div>
        <div class="form-group">
          <label>Endereço</label>
          <input type="text" id="den-endereco" placeholder="Ex: SQN 210, Bloco B, Asa Norte" />
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea id="den-descricao" rows="3" placeholder="Descreva o que está acontecendo..."></textarea>
        </div>
        <button class="btn-primary" style="width:100%" onclick="enviarDenuncia()">
          Enviar denúncia
        </button>
      </div>
      <div class="cidadao-form-card">
        <h2>🗂 Ocorrências recentes</h2>
        <p>Acompanhe o status das ocorrências em Brasília.</p>
        <div id="cidadao-ocorrencias">
          <div class="empty-state">Carregando...</div>
        </div>
      </div>
    </div>
  `;
  await carregarOcorrenciasCidadao();
}

async function carregarOcorrenciasCidadao() {
  const container = document.getElementById('cidadao-ocorrencias');
  if (!container) return;
  try {
    const ocorrencias = await Ocorrencias.listar();
    const tabela = criarTabela(
      [
        { label: 'Tipo',  key: 'tipo' },
        { label: 'Local', render: (oc) => oc.endereco?.bairro ?? '—' },
        {
          label: 'Status',
          render: (oc) => {
            const mapa = {
              aberta:       { classe: 'badge-warning', label: 'Aberta' },
              em_andamento: { classe: 'badge-info',    label: 'Em andamento' },
              encerrada:    { classe: 'badge-success', label: 'Encerrada' },
            };
            const { classe, label } = mapa[oc.status] ?? { classe: 'badge-muted', label: oc.status };
            return `<span class="badge ${classe}">${label}</span>`;
          },
        },
        {
          label: 'Prioridade',
          render: (oc) => {
            const mapa = {
              critica: { classe: 'badge-critica', label: 'Crítica' },
              alta:    { classe: 'badge-alta',    label: 'Alta' },
              media:   { classe: 'badge-media',   label: 'Média' },
              baixa:   { classe: 'badge-baixa',   label: 'Baixa' },
            };
            const { classe, label } = mapa[oc.prioridade] ?? { classe: 'badge-muted', label: oc.prioridade };
            return `<span class="badge ${classe}">${label}</span>`;
          },
        },
      ],
      ocorrencias
    );
    container.innerHTML = '';
    container.appendChild(tabela);
  } catch (erro) {
    container.innerHTML = '<div class="empty-state">Erro ao carregar ocorrências.</div>';
  }
}

async function enviarDenuncia() {
  const dados = {
    solicitante:        document.getElementById('den-nome').value,
    telefone:           document.getElementById('den-telefone').value,
    tipo:               document.getElementById('den-tipo').value,
    endereco_informado: document.getElementById('den-endereco').value,
    descricao:          document.getElementById('den-descricao').value,
  };
  if (!dados.solicitante || !dados.descricao || !dados.endereco_informado) {
    showToast('Preencha nome, endereço e descrição.', 'error'); return;
  }
  try {
    await Denuncias.criar(dados);
    showToast('Denúncia enviada com sucesso!', 'success');
    ['den-nome','den-telefone','den-endereco','den-descricao'].forEach((id) => {
      document.getElementById(id).value = '';
    });
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// INICIALIZAÇÃO GERAL
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-nova-ocorrencia')
    .addEventListener('click', abrirModalNovaOcorrencia);
  inicializarSeletorPerfil();
  inicializarMapa();
  carregarViewComandante();
});
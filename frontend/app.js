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
    });
  });
}

// Abre o portal do cidadão (topbar e view separados)
function abrirPortalCidadao() {
  document.getElementById('topbar-interno').classList.add('hidden');
  document.getElementById('topbar-cidadao').classList.remove('hidden');
  document.getElementById('views-interno').classList.add('hidden');
  document.getElementById('view-cidadao').classList.remove('hidden');
  carregarViewCidadao();
}

// Volta ao sistema interno
function voltarSistema() {
  document.getElementById('topbar-cidadao').classList.add('hidden');
  document.getElementById('topbar-interno').classList.remove('hidden');
  document.getElementById('view-cidadao').classList.add('hidden');
  document.getElementById('views-interno').classList.remove('hidden');
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
      Bombeiros.listar(), Viaturas.listar(), Equipamentos.listar(), Equipes.listar(),
    ]);

    grid.appendChild(criarResourceCard('Bombeiros', bombeiros,
      [
        { label: 'Nome',    key: 'nome' },
        { label: 'Patente', render: badgePatente },
        { label: 'Status',  render: badgeStatusBombeiro },
      ],
      { onEditar: (b) => abrirModalEditarBombeiro(b), btnExtra: { label: '+ Novo', onClick: abrirModalNovoBombeiro } }
    ));

    grid.appendChild(criarResourceCard('Viaturas', viaturas,
      [
        { label: 'Placa',  key: 'placa' },
        { label: 'Modelo', key: 'modelo' },
        { label: 'Status', render: badgeStatusViatura },
      ],
      { onEditar: (v) => abrirModalComandanteViatura(v), btnExtra: { label: '+ Nova', onClick: abrirModalNovaViatura } }
    ));

    grid.appendChild(criarResourceCard('Equipamentos', equipamentos,
      [
        { label: 'ID', key: 'id' }, { label: 'Nome', key: 'nome' },
        { label: 'Tipo', key: 'tipo' }, { label: 'Status', render: badgeStatusEquipamento },
      ],
      { onEditar: (e) => abrirModalComandanteEquipamento(e) }
    ));

    grid.appendChild(criarResourceCard('Equipes', equipes,
      [{ label: 'Nome', key: 'nome' }, { label: 'Tipo', key: 'tipo' }],
      { onEditar: (eq) => abrirModalEditarEquipe(eq), btnExtra: { label: '+ Nova', onClick: abrirModalNovaEquipe } }
    ));

    const treinamentos = await Treinamentos.listar();
    grid.appendChild(criarResourceCard('Treinamentos', treinamentos,
      [
        { label: 'Titulo', key: 'titulo' }, { label: 'Tipo', key: 'tipo' },
        { label: 'Status', render: badgeStatusTreinamento }, { label: 'Instrutor', key: 'instrutor' },
      ],
      { onEditar: (t) => abrirModalComandanteTreinamento(t), btnExtra: { label: '+ Novo', onClick: abrirModalNovoTreinamento } }
    ));

    const [todasDen, todasSol] = await Promise.all([Denuncias.listar(), Solicitacoes.listar()]);
    const denuncias = todasDen.filter((d) => !['aprovada','arquivada','convertida'].includes(d.status));
    const solicitacoes = todasSol.filter((s) => !['convertida','arquivada'].includes(s.status) && !s.arquivada);

    grid.appendChild(criarResourceCard('Denuncias recebidas', denuncias,
      [
        { label: 'Solicitante', key: 'solicitante' }, { label: 'Tipo', key: 'tipo' },
        { label: 'Status', render: (d) => {
          const m = { pendente:{c:'badge-warning',l:'Pendente'}, em_analise:{c:'badge-info',l:'Em analise'},
            aprovada:{c:'badge-success',l:'Aprovada'}, arquivada:{c:'badge-muted',l:'Arquivada'} };
          const {c,l} = m[d.status] ?? {c:'badge-muted',l:d.status};
          return `<span class="badge ${c}">${l}</span>`;
        }},
      ],
      { onEditar: (d) => abrirModalVerificarDenuncia(d) }
    ));

    grid.appendChild(criarResourceCard('Solicitacoes', solicitacoes,
      [
        { label: 'Tipo', key: 'tipo' }, { label: 'Prioridade', key: 'prioridade' },
        { label: 'Status', render: (s) => {
          const m = { recebida:{c:'badge-info',l:'Recebida'}, verificada:{c:'badge-warning',l:'Verificada'},
            arquivada:{c:'badge-muted',l:'Arquivada'}, convertida:{c:'badge-success',l:'Convertida'} };
          const {c,l} = m[s.status] ?? {c:'badge-muted',l:s.status};
          return `<span class="badge ${c}">${l}</span>`;
        }},
        { label: 'Arquivada', render: (s) => s.arquivada
          ? '<span class="badge badge-muted">Sim</span>'
          : '<span class="badge badge-info">Nao</span>' },
      ],
      { onEditar: (s) => abrirModalAvaliarSolicitacao(s) }
    ));

  } catch (erro) {
    console.error('Erro:', erro);
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
// MODAIS COMANDANTE — Bombeiro
// =============================================

function abrirModalNovoBombeiro() {
  openModal('Novo bombeiro', `
    <div class="form-row">
      <div class="form-group"><label>Nome</label><input type="text" id="b-nome" placeholder="Ex: Joao Silva" /></div>
      <div class="form-group"><label>Matricula</label><input type="text" id="b-matricula" placeholder="Ex: CB-007" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Patente</label>
        <select id="b-patente">
          <option value="soldado">Soldado</option><option value="cabo">Cabo</option>
          <option value="sargento">Sargento</option><option value="tenente">Tenente</option>
          <option value="capitao">Capitao</option><option value="major">Major</option>
          <option value="tenente_coronel">Tenente Coronel</option><option value="coronel">Coronel</option>
        </select>
      </div>
      <div class="form-group"><label>Especialidade</label><input type="text" id="b-especialidade" placeholder="Ex: Combate" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Telefone</label><input type="text" id="b-telefone" placeholder="61999990007" /></div>
      <div class="form-group"><label>Email</label><input type="email" id="b-email" placeholder="nome@bombeiros.df.gov.br" /></div>
    </div>
    <div class="form-group"><label>Data de admissao</label><input type="date" id="b-admissao" /></div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="criarBombeiro()">Criar</button>
    </div>`);
}

function abrirModalEditarBombeiro(b) {
  openModal(`Bombeiro - ${b.nome}`, `
    <div class="form-row">
      <div class="form-group"><label>Nome</label><input type="text" id="b-nome" value="${b.nome}" /></div>
      <div class="form-group"><label>Matricula</label><input type="text" value="${b.matricula}" disabled /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Patente</label>
        <select id="b-patente">
          <option value="soldado" ${b.patente==='soldado'?'selected':''}>Soldado</option>
          <option value="cabo" ${b.patente==='cabo'?'selected':''}>Cabo</option>
          <option value="sargento" ${b.patente==='sargento'?'selected':''}>Sargento</option>
          <option value="tenente" ${b.patente==='tenente'?'selected':''}>Tenente</option>
          <option value="capitao" ${b.patente==='capitao'?'selected':''}>Capitao</option>
          <option value="major" ${b.patente==='major'?'selected':''}>Major</option>
          <option value="tenente_coronel" ${b.patente==='tenente_coronel'?'selected':''}>Tenente Coronel</option>
          <option value="coronel" ${b.patente==='coronel'?'selected':''}>Coronel</option>
        </select>
      </div>
      <div class="form-group"><label>Status</label>
        <select id="b-status">
          <option value="ativo" ${b.status==='ativo'?'selected':''}>Ativo</option>
          <option value="de_folga" ${b.status==='de_folga'?'selected':''}>De folga</option>
          <option value="inativo" ${b.status==='inativo'?'selected':''}>Inativo</option>
        </select>
      </div>
    </div>
    <div class="form-group"><label>Especialidade</label><input type="text" id="b-especialidade" value="${b.especialidade??''}" /></div>
    <div class="form-actions">
      <button class="btn-danger" onclick="deletarBombeiro(${b.id})">Excluir</button>
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="salvarBombeiro(${b.id})">Salvar</button>
    </div>`);
}

async function criarBombeiro() {
  const dados = {
    nome: document.getElementById('b-nome').value,
    matricula: document.getElementById('b-matricula').value,
    patente: document.getElementById('b-patente').value,
    especialidade: document.getElementById('b-especialidade').value,
    telefone: document.getElementById('b-telefone').value,
    email: document.getElementById('b-email').value,
    data_admissao: document.getElementById('b-admissao').value || null,
  };
  try {
    await Bombeiros.criar(dados); closeModal();
    showToast('Bombeiro cadastrado!', 'success'); await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function salvarBombeiro(id) {
  const dados = {
    nome: document.getElementById('b-nome').value,
    patente: document.getElementById('b-patente').value,
    status: document.getElementById('b-status').value,
    especialidade: document.getElementById('b-especialidade').value,
  };
  try {
    await Bombeiros.atualizar(id, dados); closeModal();
    showToast('Bombeiro atualizado!', 'success'); await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function deletarBombeiro(id) {
  if (!confirm('Excluir este bombeiro?')) return;
  try {
    await Bombeiros.deletar(id); closeModal();
    showToast('Bombeiro excluido.', 'info'); await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// MODAIS COMANDANTE — Viatura
// =============================================

function abrirModalNovaViatura() {
  openModal('Nova viatura', `
    <div class="form-row">
      <div class="form-group"><label>Placa</label><input type="text" id="v-placa" placeholder="Ex: DF-005-AB" /></div>
      <div class="form-group"><label>Modelo</label><input type="text" id="v-modelo" placeholder="Ex: Scania P360" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Tipo</label>
        <select id="v-tipo">
          <option value="auto_bomba">Auto Bomba</option><option value="auto_escada">Auto Escada</option>
          <option value="ambulancia">Ambulancia</option><option value="veiculo_leve">Veiculo Leve</option>
        </select>
      </div>
      <div class="form-group"><label>Ano</label><input type="number" id="v-ano" placeholder="Ex: 2023" /></div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="criarViatura()">Criar</button>
    </div>`);
}

async function criarViatura() {
  const dados = {
    placa: document.getElementById('v-placa').value,
    modelo: document.getElementById('v-modelo').value,
    tipo: document.getElementById('v-tipo').value,
    ano_fabricacao: parseInt(document.getElementById('v-ano').value) || null,
    status: 'disponivel',
  };
  if (!dados.placa || !dados.modelo) { showToast('Informe placa e modelo.', 'error'); return; }
  try {
    await Viaturas.criar(dados); closeModal();
    showToast('Viatura criada!', 'success'); await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

function abrirModalComandanteViatura(v) {
  const statusLabel = { disponivel:'Disponivel', em_manutencao:'Em manutencao', em_atendimento:'Em atendimento', inativa:'Inativa' }[v.status] ?? v.status;
  const podeSolicitar = v.status === 'disponivel';
  openModal(`Viatura - ${v.placa}`, `
    <div class="form-row">
      <div class="form-group"><label>Placa</label><input type="text" value="${v.placa}" disabled /></div>
      <div class="form-group"><label>Modelo</label><input type="text" value="${v.modelo}" disabled /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Tipo</label><input type="text" value="${v.tipo}" disabled /></div>
      <div class="form-group"><label>Status (definido pelo Tecnico)</label>
        <input type="text" value="${statusLabel}" disabled
          style="color:${v.status==='disponivel'?'var(--color-encerrada)':v.status==='em_manutencao'?'var(--color-alta)':'var(--color-text-muted)'}" />
      </div>
    </div>
    ${!podeSolicitar ? '<p class="text-muted" style="font-size:12px;">Viatura indisponivel para manutencao.</p>' : ''}
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Fechar</button>
      ${v.status === 'inativa' ? `<button class="btn-danger" onclick="excluirViaturaInativa(${v.id})">Excluir viatura</button>` : ''}
      ${podeSolicitar ? `<button class="btn-primary" style="background:var(--color-alta);"
        onclick="solicitarManutencaoViatura(${v.id},'${v.placa}')">Solicitar manutencao</button>` : ''}
    </div>`);
}

async function excluirViaturaInativa(id) {
  if (!confirm('Excluir esta viatura permanentemente?')) return;
  try {
    await Viaturas.deletar(id); closeModal();
    showToast('Viatura excluida.', 'info'); await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function solicitarManutencaoViatura(viaturaId, placa) {
  openModal(`Solicitar manutencao - ${placa}`, `
    <div class="form-group"><label>Tipo</label>
      <select id="sol-manut-tipo"><option value="preventiva">Preventiva</option><option value="corretiva">Corretiva</option></select>
    </div>
    <div class="form-group"><label>Descricao</label>
      <textarea id="sol-manut-desc" rows="3" placeholder="Descreva o motivo..."></textarea>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="confirmarSolicitacaoManutencao(${viaturaId})">Solicitar</button>
    </div>`);
}

async function confirmarSolicitacaoManutencao(viaturaId) {
  const tipo = document.getElementById('sol-manut-tipo').value;
  const descricao = document.getElementById('sol-manut-desc').value;
  if (!descricao) { showToast('Informe a descricao.', 'error'); return; }
  try {
    // Cria a manutencao e ja marca a viatura como em_manutencao
    await Manutencoes.criar({ tipo, descricao, viatura_id: viaturaId, data_inicio: new Date().toISOString().split('T')[0] });
    await Viaturas.atualizar(viaturaId, { status: 'em_manutencao' });
    closeModal();
    showToast('Manutencao solicitada! Viatura marcada como em manutencao.', 'success');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// MODAIS COMANDANTE — Equipamento
// =============================================

function abrirModalComandanteEquipamento(e) {
  const statusLabel = {
    disponivel: 'Disponivel', em_uso: 'Em uso',
    em_manutencao: 'Em manutencao', inativo: 'Inativo',
  }[e.status] ?? e.status;
  const corStatus = {
    disponivel: 'var(--color-encerrada)',
    em_uso: 'var(--color-info)',
    em_manutencao: 'var(--color-alta)',
    inativo: 'var(--color-text-muted)',
  }[e.status] ?? 'var(--color-text-muted)';
  const podeSolicitar = e.status === 'disponivel';

  openModal(`Equipamento #${e.id} — ${e.nome}`, `
    <div class="form-row">
      <div class="form-group"><label>Nome</label><input type="text" value="${e.nome}" disabled /></div>
      <div class="form-group"><label>Tipo</label><input type="text" value="${e.tipo}" disabled /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Numero de serie</label>
        <input type="text" value="${e.numero_serie ?? '--'}" disabled />
      </div>
      <div class="form-group"><label>Status (definido pelo Tecnico)</label>
        <input type="text" value="${statusLabel}" disabled style="color:${corStatus};font-weight:600;" />
      </div>
    </div>
    ${!podeSolicitar ? `<p class="text-muted" style="font-size:12px;">Equipamento indisponivel para manutencao (status: ${statusLabel}).</p>` : ''}
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Fechar</button>
      ${podeSolicitar ? `<button class="btn-primary" style="background:var(--color-alta);"
        onclick="solicitarManutencaoEquipamento(${e.id},'${e.nome.replace(/'/g, "\'")}')">Solicitar manutencao</button>` : ''}
    </div>`);
}

async function solicitarManutencaoEquipamento(equipamentoId, nome) {
  openModal(`Solicitar manutencao — ${nome}`, `
    <div class="form-group"><label>Tipo</label>
      <select id="sol-eq-tipo">
        <option value="preventiva">Preventiva</option>
        <option value="corretiva">Corretiva</option>
      </select>
    </div>
    <div class="form-group"><label>Descricao</label>
      <textarea id="sol-eq-desc" rows="3" placeholder="Descreva o motivo..."></textarea>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="confirmarSolicitacaoManutencaoEquipamento(${equipamentoId})">Solicitar</button>
    </div>`);
}

async function confirmarSolicitacaoManutencaoEquipamento(equipamentoId) {
  const tipo = document.getElementById('sol-eq-tipo').value;
  const descricao = document.getElementById('sol-eq-desc').value;
  if (!descricao) { showToast('Informe a descricao.', 'error'); return; }
  try {
    await Manutencoes.criar({
      tipo, descricao,
      equipamento_id: equipamentoId,
      data_inicio: new Date().toISOString().split('T')[0],
    });
    await Equipamentos.atualizar(equipamentoId, { status: 'em_manutencao' });
    closeModal();
    showToast('Manutencao solicitada! Equipamento marcado como em manutencao.', 'success');
    await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// MODAIS COMANDANTE — Equipe
// =============================================

function abrirModalNovaEquipe() {
  openModal('Nova equipe', `
    <div class="form-group"><label>Nome</label><input type="text" id="eq-nome-equipe" placeholder="Ex: Equipe Alpha" /></div>
    <div class="form-group"><label>Tipo</label><input type="text" id="eq-tipo-equipe" placeholder="Ex: combate" /></div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="criarEquipe()">Criar</button>
    </div>`);
}

async function criarEquipe() {
  const dados = { nome: document.getElementById('eq-nome-equipe').value, tipo: document.getElementById('eq-tipo-equipe').value };
  if (!dados.nome || !dados.tipo) { showToast('Informe nome e tipo.', 'error'); return; }
  try {
    await Equipes.criar(dados); closeModal(); showToast('Equipe criada!', 'success'); await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

function abrirModalEditarEquipe(eq) {
  openModal(`Equipe - ${eq.nome}`, `
    <div class="form-group"><label>Nome</label><input type="text" id="eq-nome-equipe" value="${eq.nome}" /></div>
    <div class="form-group"><label>Tipo</label><input type="text" id="eq-tipo-equipe" value="${eq.tipo??''}" /></div>
    <div class="form-actions">
      <button class="btn-danger" onclick="deletarEquipe(${eq.id})">Excluir</button>
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-secondary" onclick="abrirModalMembros(${eq.id},'${eq.nome}')">Membros</button>
      <button class="btn-primary" onclick="salvarEquipe(${eq.id})">Salvar</button>
    </div>`);
}

async function salvarEquipe(id) {
  const dados = { nome: document.getElementById('eq-nome-equipe').value, tipo: document.getElementById('eq-tipo-equipe').value };
  try {
    await Equipes.atualizar(id, dados); closeModal(); showToast('Equipe atualizada!', 'success'); await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function deletarEquipe(id) {
  if (!confirm('Excluir esta equipe?')) return;
  try {
    await Equipes.deletar(id); closeModal(); showToast('Equipe excluida.', 'info'); await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function abrirModalMembros(equipeId, equipeNome) {
  openModal(`Membros - ${equipeNome}`, '<div class="empty-state">Carregando...</div>');
  try {
    const [membros, bombeiros] = await Promise.all([
      Equipes.listarBombeiros(equipeId), Bombeiros.listar(),
    ]);
    const idsAlocados = membros.map((m) => m.bombeiro_id);
    const disponiveis = bombeiros.filter((b) => !idsAlocados.includes(b.id));
    const listaMembros = membros.length > 0
      ? membros.map((m) => {
          const b = bombeiros.find((x) => x.id === m.bombeiro_id);
          const nome = b ? b.nome : `Bombeiro #${m.bombeiro_id}`;
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--color-border);">
            <span>${nome}</span>
            <button class="btn-danger" style="padding:4px 10px;font-size:12px"
              onclick="removerMembroEquipe(${equipeId},${m.bombeiro_id},'${equipeNome}')">Remover</button></div>`;
        }).join('')
      : '<div class="empty-state">Nenhum membro alocado.</div>';
    const selectOpcoes = disponiveis.length > 0
      ? disponiveis.map((b) => `<option value="${b.id}">${b.nome} - ${b.patente}</option>`).join('')
      : '<option disabled>Todos ja alocados</option>';
    document.getElementById('modal-body').innerHTML = `
      <div class="form-group"><label>Membros atuais</label>
        <div style="max-height:200px;overflow-y:auto;">${listaMembros}</div></div>
      <div class="form-group" style="margin-top:16px"><label>Adicionar bombeiro</label>
        <select id="select-bombeiro-equipe">${selectOpcoes}</select></div>
      <div class="form-group"><label>Funcao (opcional)</label>
        <input type="text" id="funcao-membro" placeholder="Ex: Comandante de equipe" /></div>
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
    await Equipes.adicionarBombeiro(equipeId, { bombeiro_id: bombeiroId, funcao });
    showToast('Bombeiro adicionado!', 'success'); await abrirModalMembros(equipeId, equipeNome);
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function removerMembroEquipe(equipeId, bombeiroId, equipeNome) {
  if (!confirm('Remover este bombeiro da equipe?')) return;
  try {
    await Equipes.removerBombeiro(equipeId, bombeiroId);
    showToast('Membro removido.', 'info'); await abrirModalMembros(equipeId, equipeNome);
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// MODAIS COMANDANTE — Treinamentos
// =============================================

function abrirModalNovoTreinamento() {
  openModal('Novo treinamento', `
    <div class="form-group"><label>Titulo</label><input type="text" id="tr-titulo" placeholder="Ex: Combate a Incendio" /></div>
    <div class="form-row">
      <div class="form-group"><label>Tipo</label>
        <select id="tr-tipo"><option value="teorico">Teorico</option><option value="pratico">Pratico</option></select>
      </div>
      <div class="form-group"><label>Status</label>
        <select id="tr-status">
          <option value="agendado">Agendado</option><option value="em_andamento">Em andamento</option>
          <option value="concluido">Concluido</option><option value="cancelado">Cancelado</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Instrutor</label><input type="text" id="tr-instrutor" placeholder="Ex: Cel. Jose" /></div>
      <div class="form-group"><label>Carga horaria (h)</label><input type="number" id="tr-carga" min="1" placeholder="Ex: 40" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Data inicio</label><input type="date" id="tr-inicio" /></div>
      <div class="form-group"><label>Data fim</label><input type="date" id="tr-fim" /></div>
    </div>
    <div class="form-group"><label>Descricao</label><textarea id="tr-descricao" rows="3" placeholder="Descreva..."></textarea></div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="criarTreinamento()">Criar</button>
    </div>`);
}

async function abrirModalComandanteTreinamento(t) {
  openModal(`Treinamento - ${t.titulo}`, '<div class="empty-state">Carregando participantes...</div>');
  try {
    const [participantes, bombeiros] = await Promise.all([
      Treinamentos.listarInscritos(t.id), Bombeiros.listar(),
    ]);
    const listaParticipantes = participantes.length > 0
      ? participantes.map((p) => {
          const b = bombeiros.find((x) => x.id === p.bombeiro_id);
          const nome = b ? `${b.nome} (${b.matricula})` : `Bombeiro #${p.bombeiro_id}`;
          const badge = { inscrito:'<span class="badge badge-info">Inscrito</span>',
            concluido:'<span class="badge badge-success">Concluido</span>',
            reprovado:'<span class="badge badge-danger">Reprovado</span>',
            desistiu:'<span class="badge badge-muted">Desistiu</span>' }[p.status_participacao]
            ?? `<span class="badge badge-muted">${p.status_participacao}</span>`;
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--color-border);gap:8px;">
            <span style="flex:1">${nome}</span>${badge}
            <select onchange="atualizarParticipacao(${t.id},${p.bombeiro_id},this.value)"
              style="background:var(--color-bg);color:var(--color-text);border:1px solid var(--color-border);border-radius:6px;padding:4px 8px;font-size:12px;">
              <option value="inscrito" ${p.status_participacao==='inscrito'?'selected':''}>Inscrito</option>
              <option value="concluido" ${p.status_participacao==='concluido'?'selected':''}>Concluido</option>
              <option value="reprovado" ${p.status_participacao==='reprovado'?'selected':''}>Reprovado</option>
              <option value="desistiu" ${p.status_participacao==='desistiu'?'selected':''}>Desistiu</option>
            </select></div>`;
        }).join('')
      : '<div class="empty-state">Nenhum bombeiro inscrito ainda.</div>';

    document.getElementById('modal-body').innerHTML = `
      <div class="form-group"><label>Titulo</label><input type="text" id="tr-titulo" value="${t.titulo}" /></div>
      <div class="form-row">
        <div class="form-group"><label>Tipo</label>
          <select id="tr-tipo">
            <option value="teorico" ${t.tipo==='teorico'?'selected':''}>Teorico</option>
            <option value="pratico" ${t.tipo==='pratico'?'selected':''}>Pratico</option>
          </select>
        </div>
        <div class="form-group"><label>Status</label>
          <select id="tr-status">
            <option value="agendado" ${t.status==='agendado'?'selected':''}>Agendado</option>
            <option value="em_andamento" ${t.status==='em_andamento'?'selected':''}>Em andamento</option>
            <option value="concluido" ${t.status==='concluido'?'selected':''}>Concluido</option>
            <option value="cancelado" ${t.status==='cancelado'?'selected':''}>Cancelado</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Instrutor</label><input type="text" id="tr-instrutor" value="${t.instrutor??''}" /></div>
        <div class="form-group"><label>Carga (h)</label><input type="number" id="tr-carga" value="${t.carga_horaria??''}" /></div>
      </div>
      <div class="form-group"><label>Participantes inscritos</label>
        <div style="max-height:200px;overflow-y:auto;border:1px solid var(--color-border);border-radius:8px;padding:8px;">
          ${listaParticipantes}</div></div>
      <div class="form-actions">
        <button class="btn-danger" onclick="deletarTreinamento(${t.id})">Excluir</button>
        <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="salvarTreinamento(${t.id})">Salvar</button>
      </div>`;
  } catch (erro) {
    document.getElementById('modal-body').innerHTML = '<div class="empty-state">Erro ao carregar participantes.</div>';
  }
}

async function atualizarParticipacao(treinamentoId, bombeiroId, novoStatus) {
  try {
    await Treinamentos.atualizarInscricao(treinamentoId, bombeiroId, { status_participacao: novoStatus });
    showToast('Participacao atualizada!', 'success');
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function criarTreinamento() {
  const dados = {
    titulo: document.getElementById('tr-titulo').value,
    tipo: document.getElementById('tr-tipo').value,
    status: document.getElementById('tr-status').value,
    instrutor: document.getElementById('tr-instrutor').value || null,
    carga_horaria: parseInt(document.getElementById('tr-carga').value) || null,
    data_inicio: document.getElementById('tr-inicio').value || null,
    data_fim: document.getElementById('tr-fim').value || null,
    descricao: document.getElementById('tr-descricao').value || null,
  };
  if (!dados.titulo) { showToast('Informe o titulo.', 'error'); return; }
  try {
    await Treinamentos.criar(dados); closeModal(); showToast('Treinamento criado!', 'success'); await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function salvarTreinamento(id) {
  const dados = {
    titulo: document.getElementById('tr-titulo').value,
    tipo: document.getElementById('tr-tipo').value,
    status: document.getElementById('tr-status').value,
    instrutor: document.getElementById('tr-instrutor')?.value || null,
    carga_horaria: parseInt(document.getElementById('tr-carga')?.value) || null,
  };
  try {
    await Treinamentos.atualizar(id, dados); closeModal(); showToast('Treinamento atualizado!', 'success'); await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function deletarTreinamento(id) {
  if (!confirm('Excluir este treinamento?')) return;
  try {
    await Treinamentos.deletar(id); closeModal(); showToast('Treinamento excluido.', 'info'); await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// MODAIS COMANDANTE — Denuncias e Solicitacoes
// =============================================

function abrirModalVerificarDenuncia(d) {
  openModal(`Denuncia - ${d.solicitante}`, `
    <div class="form-group"><label>Solicitante</label><input type="text" value="${d.solicitante}" disabled /></div>
    <div class="form-row">
      <div class="form-group"><label>Telefone</label><input type="text" value="${d.telefone??'--'}" disabled /></div>
      <div class="form-group"><label>Tipo</label><input type="text" value="${d.tipo}" disabled /></div>
    </div>
    <div class="form-group"><label>Endereco</label><input type="text" value="${d.endereco_informado??'--'}" disabled /></div>
    <div class="form-group"><label>Descricao</label><textarea rows="3" disabled>${d.descricao}</textarea></div>
    <div class="form-group"><label>Status</label>
      <select id="den-status">
        <option value="pendente" ${d.status==='pendente'?'selected':''}>Pendente</option>
        <option value="em_analise" ${d.status==='em_analise'?'selected':''}>Em analise</option>
        <option value="aprovada" ${d.status==='aprovada'?'selected':''}>Aprovada</option>
        <option value="arquivada" ${d.status==='arquivada'?'selected':''}>Arquivada</option>
      </select>
    </div>
    <p class="text-muted" style="font-size:12px;">Ao marcar como Aprovada, uma solicitacao sera criada para o Bombeiro.</p>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="atualizarDenuncia(${d.id})">Atualizar</button>
    </div>`);
}

async function atualizarDenuncia(id) {
  const novoStatus = document.getElementById('den-status').value;
  try {
    await Denuncias.atualizar(id, { status: novoStatus });
    if (novoStatus === 'aprovada') {
      await Solicitacoes.criar({
        denuncia_id: id, comandante_id: 1, tipo: 'ocorrencia', prioridade: 'alta',
        observacao: 'Denuncia aprovada pelo Comandante. Aguardando registro de ocorrencia.',
      });
      showToast('Denuncia aprovada! Bombeiro pode registrar a ocorrencia.', 'success');
      closeModal(); await carregarRecursosComandante();
    } else if (novoStatus === 'arquivada') {
      showToast('Denuncia arquivada!', 'success');
      closeModal(); await carregarRecursosComandante();
    } else {
      showToast('Denuncia atualizada!', 'success');
      closeModal(); await carregarRecursosComandante();
    }
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

function abrirModalAvaliarSolicitacao(s) {
  openModal(`Solicitacao #${s.id}`, `
    <div class="form-row">
      <div class="form-group"><label>Tipo</label><input type="text" value="${s.tipo}" disabled /></div>
      <div class="form-group"><label>Prioridade</label><input type="text" value="${s.prioridade??'--'}" disabled /></div>
    </div>
    <div class="form-group"><label>Observacao</label><input type="text" value="${s.observacao??'--'}" disabled /></div>
    <div class="form-group"><label>Status</label>
      <select id="sol-status">
        <option value="recebida" ${s.status==='recebida'?'selected':''}>Recebida</option>
        <option value="verificada" ${s.status==='verificada'?'selected':''}>Verificada</option>
        <option value="arquivada" ${s.status==='arquivada'?'selected':''}>Arquivada</option>
        <option value="convertida" ${s.status==='convertida'?'selected':''}>Convertida</option>
      </select>
    </div>
    <div class="form-group"><label>Arquivar?</label>
      <select id="sol-arquivada">
        <option value="false" ${!s.arquivada?'selected':''}>Nao</option>
        <option value="true" ${s.arquivada?'selected':''}>Sim</option>
      </select>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="avaliarSolicitacao(${s.id})">Salvar</button>
    </div>`);
}

async function avaliarSolicitacao(id) {
  const dados = { status: document.getElementById('sol-status').value, arquivada: document.getElementById('sol-arquivada').value === 'true' };
  try {
    await Solicitacoes.atualizar(id, dados);
    showToast('Solicitacao atualizada!', 'success');
    closeModal(); await carregarRecursosComandante();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// VIEW: TECNICO
// =============================================

async function carregarViewTecnico() {
  const container = document.getElementById('tecnico-content');
  if (!container) return;
  container.innerHTML = `
    <div class="tecnico-layout">
      <div class="kanban-panel kanban-manutencao">
        <div class="panel-header">
          <span class="panel-title">Kanban de manutencoes</span>
          <button class="btn-primary" onclick="abrirModalNovaManutencao()">+ Nova</button>
        </div>
        <div class="kanban-board" style="grid-template-columns: repeat(4, 1fr);">
          <div class="kanban-col">
            <div class="kanban-col-header status-pendente">Pendente <span class="col-count" id="count-manut-pendente">0</span></div>
            <div class="kanban-cards" id="col-manut-pendente"></div>
          </div>
          <div class="kanban-col">
            <div class="kanban-col-header status-em-andamento">Em andamento <span class="col-count" id="count-manut-em-andamento">0</span></div>
            <div class="kanban-cards" id="col-manut-em-andamento"></div>
          </div>
          <div class="kanban-col">
            <div class="kanban-col-header status-concluida">Concluida <span class="col-count" id="count-manut-concluida">0</span></div>
            <div class="kanban-cards" id="col-manut-concluida"></div>
          </div>
          <div class="kanban-col">
            <div class="kanban-col-header status-inativa">Inativa <span class="col-count" id="count-manut-inativa">0</span></div>
            <div class="kanban-cards" id="col-manut-inativa"></div>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:20px;">
        <div class="resource-card" id="card-viaturas-tecnico"></div>
        <div class="resource-card" id="card-equipamentos-tecnico"></div>
      </div>
    </div>`;
  await carregarKanbanManutencoes();
  await carregarTabelasTecnico();
}

async function carregarTabelasTecnico() {
  try {
    const [viaturas, equipamentos] = await Promise.all([Viaturas.listar(), Equipamentos.listar()]);
    const cardV = document.getElementById('card-viaturas-tecnico');
    cardV.innerHTML = `<div class="resource-card-header"><span class="resource-card-title">Viaturas</span></div>`;
    cardV.appendChild(criarTabela(
      [{ label:'Placa',key:'placa'},{label:'Modelo',key:'modelo'},{label:'Status',render:badgeStatusViatura}],
      viaturas,
      // Tecnico pode clicar para ver detalhes mas status muda automaticamente pelo kanban
      { onEditar: (v) => abrirModalTecnicoViatura(v) }
    ));
    const cardE = document.getElementById('card-equipamentos-tecnico');
    cardE.innerHTML = `<div class="resource-card-header"><span class="resource-card-title">Equipamentos</span>
      <button class="btn-primary" onclick="abrirModalNovoEquipamento()">+ Novo</button></div>`;
    cardE.appendChild(criarTabela(
      [{ label:'ID',key:'id'},{label:'Nome',key:'nome'},{label:'Tipo',key:'tipo'},{label:'Status',render:badgeStatusEquipamento}],
      equipamentos, { onEditar: (e) => abrirModalTecnicoEquipamento(e) }
    ));
  } catch (erro) { showToast('Erro ao carregar dados do tecnico.', 'error'); }
}

// Viatura: tecnico ve status (somente leitura) — status muda automaticamente via kanban de manutencoes
function abrirModalTecnicoViatura(v) {
  const statusLabel = {
    disponivel: 'Disponivel',
    em_manutencao: 'Em manutencao',
    em_atendimento: 'Em atendimento',
    inativa: 'Inativa',
  }[v.status] ?? v.status;
  const corStatus = {
    disponivel: 'var(--color-encerrada)',
    em_manutencao: 'var(--color-alta)',
    inativa: 'var(--color-text-muted)',
  }[v.status] ?? 'var(--color-text-muted)';

  openModal(`Viatura - ${v.placa}`, `
    <div class="form-group"><label>Modelo</label><input type="text" value="${v.modelo}" disabled /></div>
    <div class="form-group"><label>Status atual</label>
      <input type="text" value="${statusLabel}" disabled style="color:${corStatus};font-weight:600;" />
    </div>
    <p class="text-muted" style="font-size:12px;">
      O status da viatura e alterado automaticamente:<br>
      &bull; <strong>Em manutencao</strong> ao criar manutencao para ela no kanban<br>
      &bull; <strong>Disponivel</strong> ao marcar manutencao como Concluida ou Inativa
    </p>
    <div class="form-actions">
      <button class="btn-primary" onclick="closeModal()">Fechar</button>
    </div>`);
}

function abrirModalNovoEquipamento() {
  openModal('Novo equipamento', `
    <div class="form-group"><label>Nome</label><input type="text" id="teq-nome" placeholder="Ex: Mangueira 40mm" /></div>
    <div class="form-row">
      <div class="form-group"><label>Tipo</label>
        <select id="teq-tipo">
          <option value="combate">Combate</option><option value="resgate">Resgate</option>
          <option value="medico">Medico</option><option value="outros">Outros</option>
        </select>
      </div>
      <div class="form-group"><label>Numero de serie</label><input type="text" id="teq-serie" placeholder="Ex: MNG-001" /></div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="criarEquipamentoTecnico()">Criar</button>
    </div>`);
}

async function criarEquipamentoTecnico() {
  const dados = { nome: document.getElementById('teq-nome').value, tipo: document.getElementById('teq-tipo').value,
    numero_serie: document.getElementById('teq-serie').value || null, status: 'disponivel' };
  if (!dados.nome) { showToast('Informe o nome.', 'error'); return; }
  try {
    await Equipamentos.criar(dados); closeModal(); showToast('Equipamento criado!', 'success'); await carregarTabelasTecnico();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// Equipamento: status muda automaticamente. Tecnico so pode associar a viatura ou excluir (se inativo)
async function abrirModalTecnicoEquipamento(e) {
  // Apenas viaturas disponiveis ou em atendimento podem receber equipamentos
  const viaturas = await Viaturas.listar();
  const viaturasPossiveis = viaturas.filter((v) => ['disponivel','em_atendimento'].includes(v.status));
  const opcoesViaturas = viaturasPossiveis.length > 0
    ? viaturasPossiveis.map((v) => `<option value="${v.id}">${v.placa} - ${v.modelo}</option>`).join('')
    : '<option disabled value="">Nenhuma viatura disponivel</option>';

  const statusLabel = { disponivel:'Disponivel', em_uso:'Em uso', em_manutencao:'Em manutencao', inativo:'Inativo' }[e.status] ?? e.status;
  const corStatus = { disponivel:'var(--color-encerrada)', em_uso:'var(--color-info)', em_manutencao:'var(--color-alta)', inativo:'var(--color-text-muted)' }[e.status] ?? 'var(--color-text-muted)';

  openModal(`Equipamento #${e.id} - ${e.nome}`, `
    <div class="form-group"><label>Nome</label><input type="text" value="${e.nome}" disabled /></div>
    <div class="form-row">
      <div class="form-group"><label>Tipo</label><input type="text" value="${e.tipo}" disabled /></div>
      <div class="form-group"><label>Status atual</label>
        <input type="text" value="${statusLabel}" disabled style="color:${corStatus};font-weight:600;" />
      </div>
    </div>
    <p class="text-muted" style="font-size:12px;">
      O status muda automaticamente:<br>
      &bull; <strong>Em uso</strong> ao associar a uma viatura<br>
      &bull; <strong>Em manutencao</strong> ao criar manutencao no kanban (desvincula da viatura)<br>
      &bull; <strong>Disponivel</strong> ao concluir/inativar a manutencao no kanban
    </p>
    ${e.status === 'disponivel' ? `
    <div class="form-group" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border)">
      <label>Associar a uma viatura</label>
      <div style="display:flex;gap:8px;">
        <select id="teq-viatura-select" style="flex:1">${opcoesViaturas}</select>
        <button class="btn-primary" onclick="associarEquipamentoViatura(${e.id})">Confirmar associacao</button>
      </div>
      <span class="text-muted" style="font-size:11px;margin-top:4px;display:block;">
        Ao confirmar, o status do equipamento mudara para <strong>Em uso</strong> automaticamente.
      </span>
    </div>` : e.status === 'em_uso' ? `
    <div style="margin-top:12px;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--color-border);">
      <p class="text-muted" style="font-size:12px;margin:0;">
        Equipamento em uso. Para desvincula-lo, crie uma manutencao para ele no kanban acima.
      </p>
    </div>` : e.status === 'inativo' ? `
    <div style="margin-top:12px;padding:10px;background:rgba(231,76,60,0.08);border-radius:8px;border:1px solid var(--color-critica);">
      <p style="font-size:12px;color:var(--color-critica);margin:0 0 10px 0;">
        Equipamento inativo. Como tecnico responsavel, voce pode excluir este equipamento permanentemente.
      </p>
      <button class="btn-danger" style="width:100%;" onclick="excluirEquipamentoInativo(${e.id})">
        Excluir equipamento permanentemente
      </button>
    </div>` : ''}
    <div class="form-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">Fechar</button>
    </div>`);
}

async function excluirEquipamentoInativo(id) {
  if (!confirm('Excluir este equipamento permanentemente?')) return;
  try {
    await Equipamentos.deletar(id); closeModal();
    showToast('Equipamento excluido.', 'info'); await carregarTabelasTecnico();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// Associar equipamento a viatura: muda status para em_uso automaticamente
async function associarEquipamentoViatura(equipamentoId) {
  const viaturaId = parseInt(document.getElementById('teq-viatura-select').value);
  if (!viaturaId) { showToast('Selecione uma viatura.', 'error'); return; }
  if (!confirm('Confirmar associacao deste equipamento a viatura selecionada?')) return;
  try {
    await Viaturas.associarEquipamento(viaturaId, { equipamento_id: equipamentoId, quantidade: 1 });
    // Status muda automaticamente para em_uso
    await Equipamentos.atualizar(equipamentoId, { status: 'em_uso' });
    closeModal();
    showToast('Equipamento associado e marcado como Em uso!', 'success');
    await carregarTabelasTecnico();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function abrirModalNovaManutencao() {
  await preencherDropdownsManutencao();
  openModal('Nova manutencao', `
    <div class="form-group"><label>Tipo</label>
      <select id="manut-tipo"><option value="preventiva">Preventiva</option><option value="corretiva">Corretiva</option></select>
    </div>
    <div class="form-group"><label>Descricao</label><textarea id="manut-descricao" rows="3" placeholder="Descreva..."></textarea></div>
    <p class="text-muted" style="font-size:12px;margin:8px 0;">
      Selecione uma viatura OU um equipamento. Ao criar, o recurso sera marcado como <strong>Em manutencao</strong> automaticamente.
    </p>
    <div class="form-group"><label>Viatura</label>
      <select id="manut-viatura-id">
        <option value="">Nenhuma (selecione equipamento abaixo)</option>
      </select>
    </div>
    <div class="form-group"><label>Equipamento</label>
      <select id="manut-equipamento-id">
        <option value="">Nenhum (selecione viatura acima)</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Data de inicio</label><input type="date" id="manut-inicio" /></div>
      <div class="form-group"><label>Custo (R$)</label><input type="number" id="manut-custo" step="0.01" min="0" placeholder="0.00" /></div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="criarManutencao()">Criar</button>
    </div>`);
  setTimeout(preencherSelectsManutencao, 50);
}

async function preencherDropdownsManutencao() {
  try {
    const [viaturas, equipamentos] = await Promise.all([Viaturas.listar(), Equipamentos.listar()]);
    // Qualquer viatura ou equipamento pode entrar em manutencao (exceto os ja em manutencao)
    window._manutViaturas = viaturas.filter((v) => v.status !== 'em_manutencao');
    window._manutEquipamentos = equipamentos.filter((e) => e.status !== 'em_manutencao');
  } catch (e) { console.error('Erro ao carregar dados manutencao:', e); }
}

async function preencherSelectsManutencao() {
  const selV = document.getElementById('manut-viatura-id');
  const selE = document.getElementById('manut-equipamento-id');
  if (selV && window._manutViaturas) {
    selV.innerHTML = '<option value="">Nenhuma</option>' +
      window._manutViaturas.map((v) => `<option value="${v.id}">${v.placa} — ${v.modelo} (${v.status})</option>`).join('');
  }
  if (selE && window._manutEquipamentos) {
    selE.innerHTML = '<option value="">Nenhum</option>' +
      window._manutEquipamentos.map((e) => `<option value="${e.id}">#${e.id} ${e.nome} (${e.status})</option>`).join('');
  }
}

async function criarManutencao() {
  const viaturaId = parseInt(document.getElementById('manut-viatura-id')?.value) || null;
  const equipamentoId = parseInt(document.getElementById('manut-equipamento-id')?.value) || null;
  if (!viaturaId && !equipamentoId) { showToast('Selecione uma viatura ou equipamento.', 'error'); return; }
  const dados = {
    tipo: document.getElementById('manut-tipo').value,
    descricao: document.getElementById('manut-descricao').value,
    viatura_id: viaturaId, equipamento_id: equipamentoId,
    data_inicio: document.getElementById('manut-inicio').value || null,
    custo: parseFloat(document.getElementById('manut-custo').value) || null,
  };
  if (!dados.descricao) { showToast('Informe a descricao.', 'error'); return; }
  try {
    await Manutencoes.criar(dados);

    // Marca o recurso como em_manutencao automaticamente
    if (viaturaId) {
      await Viaturas.atualizar(viaturaId, { status: 'em_manutencao' });
    }
    if (equipamentoId) {
      // Se equipamento estava em_uso, a manutencao o desvincula implicitamente
      await Equipamentos.atualizar(equipamentoId, { status: 'em_manutencao' });
    }

    closeModal();
    showToast('Manutencao criada! Recurso marcado como em manutencao.', 'success');
    await carregarKanbanManutencoes();
    await carregarTabelasTecnico();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// VIEW: BOMBEIRO
// =============================================

async function carregarViewBombeiro() {
  const container = document.getElementById('bombeiro-content');
  if (!container) return;
  let temDenunciaAprovada = false;
  try {
    const denuncias = await Denuncias.listar();
    temDenunciaAprovada = denuncias.some((d) => d.status === 'aprovada');
  } catch (e) {}

  container.innerHTML = `
    <div class="resources-grid">
      <div class="resource-card">
        <div class="resource-card-header"><span class="resource-card-title">Denuncias - base para ocorrencias</span></div>
        <div id="tabela-denuncias-bombeiro" style="padding:8px;"><div class="empty-state">Carregando...</div></div>
      </div>
      <div class="resource-card">
        <div class="resource-card-header">
          <span class="resource-card-title">Registrar ocorrencia</span>
          ${temDenunciaAprovada
            ? '<button class="btn-primary" onclick="abrirModalRegistrarOcorrencia()">+ Nova</button>'
            : '<span class="badge badge-muted">Aguardando aprovacao</span>'}
        </div>
        <div style="padding:16px;color:var(--color-text-muted);font-size:13px;">
          ${temDenunciaAprovada
            ? 'Ha denuncias aprovadas. Registre a ocorrencia com endereco e prioridade.'
            : 'O Comandante deve aprovar uma denuncia antes de registrar a ocorrencia.'}
        </div>
      </div>
      <div class="resource-card">
        <div class="resource-card-header"><span class="resource-card-title">Atualizar status de ocorrencia</span></div>
        <div id="tabela-ocorrencias-bombeiro" style="padding:8px;"><div class="empty-state">Carregando...</div></div>
      </div>
      <div class="resource-card">
        <div class="resource-card-header"><span class="resource-card-title">Viaturas disponiveis</span></div>
        <div id="tabela-viaturas-bombeiro" style="padding:8px;"><div class="empty-state">Carregando...</div></div>
      </div>
      <div class="resource-card" style="min-height:400px;">
        <div class="resource-card-header"><span class="resource-card-title">Participar de treinamento</span></div>
        <div id="tabela-treinamentos-bombeiro" style="padding:8px;"><div class="empty-state">Carregando...</div></div>
      </div>
    </div>`;

  await carregarDenunciasBombeiro();
  await carregarTabelaOcorrenciasBombeiro();
  await carregarViaturasBombeiro();
  await carregarTabelaTreinamentosBombeiro();
}

async function carregarDenunciasBombeiro() {
  const container = document.getElementById('tabela-denuncias-bombeiro');
  if (!container) return;
  try {
    const todasDenuncias = await Denuncias.listar();
    const denuncias = todasDenuncias.filter((d) =>
      ['pendente', 'em_analise', 'aprovada'].includes(d.status)
    );
    const tabela = criarTabela(
      [
        { label:'Solicitante',key:'solicitante' }, { label:'Tipo',key:'tipo' },
        { label:'Endereco',key:'endereco_informado' }, { label:'Descricao',key:'descricao' },
        { label:'Status', render:(d)=>{
          const m={pendente:{c:'badge-warning',l:'Pendente'},em_analise:{c:'badge-info',l:'Em analise'},
            aprovada:{c:'badge-success',l:'Aprovada'},arquivada:{c:'badge-muted',l:'Arquivada'}};
          const {c,l}=m[d.status]??{c:'badge-muted',l:d.status};
          return `<span class="badge ${c}">${l}</span>`;
        }},
      ], denuncias
    );
    container.innerHTML = ''; container.appendChild(tabela);
  } catch (erro) { container.innerHTML = '<div class="empty-state">Erro ao carregar denuncias.</div>'; }
}

async function carregarTabelaOcorrenciasBombeiro() {
  const container = document.getElementById('tabela-ocorrencias-bombeiro');
  if (!container) return;
  try {
    const ocorrencias = await Ocorrencias.listar();
    const tabela = criarTabela(
      [
        { label:'Tipo',key:'tipo' },
        { label:'Local', render:(oc)=>oc.endereco?.bairro??'--' },
        { label:'Status', render:(oc)=>{
          const m={aberta:{c:'badge-warning',l:'Aberta'},em_andamento:{c:'badge-info',l:'Em andamento'},encerrada:{c:'badge-success',l:'Encerrada'}};
          const {c,l}=m[oc.status]??{c:'badge-muted',l:oc.status};
          return `<span class="badge ${c}">${l}</span>`;
        }},
        { label:'Prioridade', render:(oc)=>{
          const m={critica:{c:'badge-critica',l:'Critica'},alta:{c:'badge-alta',l:'Alta'},media:{c:'badge-media',l:'Media'},baixa:{c:'badge-baixa',l:'Baixa'}};
          const {c,l}=m[oc.prioridade]??{c:'badge-muted',l:oc.prioridade};
          return `<span class="badge ${c}">${l}</span>`;
        }},
      ],
      ocorrencias.filter((oc) => oc.status !== 'encerrada'),
      { onEditar: (oc) => abrirModalAtualizarStatusOcorrencia(oc) }
    );
    container.innerHTML = ''; container.appendChild(tabela);
  } catch (erro) { container.innerHTML = '<div class="empty-state">Erro ao carregar ocorrencias.</div>'; }
}

async function carregarViaturasBombeiro() {
  const container = document.getElementById('tabela-viaturas-bombeiro');
  if (!container) return;
  try {
    const viaturas = await Viaturas.listar();
    // Bombeiro so ve viaturas disponiveis (nao em manutencao, nao inativas)
    const disponiveis = viaturas.filter((v) => v.status === 'disponivel');
    if (disponiveis.length === 0) {
      container.innerHTML = '<div class="empty-state">Nenhuma viatura disponivel no momento.</div>'; return;
    }
    const viaturaComEquip = await Promise.all(
      disponiveis.map(async (v) => {
        try {
          const equips = await Viaturas.listarEquipamentos(v.id);
          // Filtra equipamentos em manutencao — bombeiro nao ve
          const equipsDisponiveis = equips.filter((e) => e.status !== 'em_manutencao');
          return { ...v, equipamentos: equipsDisponiveis };
        }
        catch { return { ...v, equipamentos: [] }; }
      })
    );
    container.innerHTML = viaturaComEquip.map((v) => {
      const equipsHtml = v.equipamentos.length > 0
        ? v.equipamentos.map((e) => `<span class="badge badge-muted" style="margin:2px;">${e.nome??`Equip #${e.equipamento_id}`}</span>`).join('')
        : '<span class="text-muted" style="font-size:12px;">Sem equipamentos alocados</span>';
      return `<div style="padding:12px 0;border-bottom:1px solid var(--color-border);cursor:pointer;transition:background 0.15s;"
        onclick="abrirModalViaturaBombeiro(${v.id})"
        onmouseover="this.style.background='var(--color-surface-2)'"
        onmouseout="this.style.background='transparent'">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong>${v.placa}</strong>
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="badge badge-success">Disponivel</span>
            <span style="font-size:11px;color:var(--color-text-muted);">Ver detalhes →</span>
          </div>
        </div>
        <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:4px;">${v.modelo}</div>
        <div style="font-size:12px;">${equipsHtml}</div>
      </div>`;
    }).join('');
  } catch (erro) { container.innerHTML = '<div class="empty-state">Erro ao carregar viaturas.</div>'; }
}

// Modal de detalhes da viatura para o Bombeiro (somente leitura)
async function abrirModalViaturaBombeiro(viaturaId) {
  openModal('Detalhes da viatura', '<div class="empty-state">Carregando...</div>');
  try {
    const [viaturas, equipsViatura, todosEquipamentos] = await Promise.all([
      Viaturas.listar(),
      Viaturas.listarEquipamentos(viaturaId).catch(() => []),
      Equipamentos.listar().catch(() => []),
    ]);
    const v = viaturas.find((x) => x.id === viaturaId);
    if (!v) { document.getElementById('modal-body').innerHTML = '<div class="empty-state">Viatura nao encontrada.</div>'; return; }

    const tipoLabel = {
      auto_bomba: 'Auto Bomba', auto_escada: 'Auto Escada',
      ambulancia: 'Ambulancia', veiculo_leve: 'Veiculo Leve',
    }[v.tipo] ?? v.tipo;

    // Enriquecer com nome real buscando em todosEquipamentos pelo equipamento_id
    const equipsEnriquecidos = equipsViatura.map((ve) => {
      const detalhes = todosEquipamentos.find((eq) => eq.id === ve.equipamento_id);
      return { ...ve, nome: detalhes?.nome ?? null, tipo: detalhes?.tipo ?? null, status: detalhes?.status ?? ve.status };
    });
    const equipsDisponiveis = equipsEnriquecidos.filter((e) => e.status !== 'em_manutencao');
    const listaEquipamentos = equipsDisponiveis.length > 0
      ? equipsDisponiveis.map((e) => `
          <div style="display:flex;justify-content:space-between;align-items:center;
            padding:8px 0;border-bottom:1px solid var(--color-border);">
            <div>
              <span style="font-weight:600;">${e.nome ?? 'Equipamento #' + e.equipamento_id}</span>
              ${e.tipo ? `<span class="badge badge-muted" style="margin-left:8px;">${e.tipo}</span>` : ''}
            </div>
            <span class="badge badge-info">Em uso</span>
          </div>`).join('')
      : '<div class="empty-state" style="padding:16px;">Nenhum equipamento alocado nesta viatura.</div>';

    document.getElementById('modal-title').textContent = `Viatura — ${v.placa}`;
    document.getElementById('modal-body').innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>Placa</label>
          <input type="text" value="${v.placa}" disabled />
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <input type="text" value="${tipoLabel}" disabled />
        </div>
      </div>
      <div class="form-group">
        <label>Modelo</label>
        <input type="text" value="${v.modelo}" disabled />
      </div>
      ${v.ano_fabricacao ? `<div class="form-group"><label>Ano de fabricacao</label><input type="text" value="${v.ano_fabricacao}" disabled /></div>` : ''}
      <div class="form-group" style="margin-top:16px;">
        <label>Equipamentos alocados (${equipsDisponiveis.length})</label>
        <div style="border:1px solid var(--color-border);border-radius:8px;max-height:200px;overflow-y:auto;">
          ${listaEquipamentos}
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" onclick="closeModal()">Fechar</button>
      </div>`;
  } catch (erro) {
    document.getElementById('modal-body').innerHTML = '<div class="empty-state">Erro ao carregar detalhes.</div>';
  }
}

async function carregarTabelaTreinamentosBombeiro() {
  const container = document.getElementById('tabela-treinamentos-bombeiro');
  if (!container) return;
  try {
    const treinamentos = await Treinamentos.listar();
    const tabela = criarTabela(
      [
        { label:'Titulo',key:'titulo' }, { label:'Tipo',key:'tipo' },
        { label:'Status',render:badgeStatusTreinamento },
        { label:'Instrutor',key:'instrutor' }, { label:'Carga (h)',key:'carga_horaria' },
      ],
      treinamentos, { onEditar: (t) => abrirModalParticiparTreinamento(t) }
    );
    container.innerHTML = ''; container.appendChild(tabela);
  } catch (erro) { container.innerHTML = '<div class="empty-state">Erro ao carregar treinamentos.</div>'; }
}

async function buscarCoordenadas(logradouro, bairro, cidade) {
  const query = encodeURIComponent(`${logradouro}, ${bairro}, ${cidade}, Brasil`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
  try {
    const resp = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
    const data = await resp.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (e) {}
  return null;
}

async function abrirModalRegistrarOcorrencia() {
  let denunciasAprovadas = [];
  try {
    const todas = await Denuncias.listar();
    denunciasAprovadas = todas.filter((d) => d.status === 'aprovada');
  } catch (e) {}

  const opcoesDenuncias = denunciasAprovadas.length > 0
    ? denunciasAprovadas.map((d) =>
        `<option value="${d.id}">${d.solicitante} — ${d.tipo} — ${d.endereco_informado??''}</option>`
      ).join('')
    : '<option disabled>Nenhuma denuncia aprovada</option>';

  openModal('Registrar ocorrencia', `
    <div class="form-group">
      <label>Denuncia base (obrigatoria)</label>
      <select id="oc-denuncia-id" style="border:1px solid var(--color-alta);">
        <option value="">Selecione a denuncia aprovada...</option>
        ${opcoesDenuncias}
      </select>
      <span class="text-muted" style="font-size:11px;">
        Ao registrar, a denuncia sera marcada como convertida e sumira desta lista.
      </span>
    </div>
    <div class="form-group"><label>Tipo</label>
      <select id="oc-tipo">
        <option value="incendio">Incendio</option><option value="acidente">Acidente</option>
        <option value="resgate">Resgate</option><option value="inundacao">Inundacao</option>
        <option value="outros">Outros</option>
      </select>
    </div>
    <div class="form-group"><label>Descricao</label><textarea id="oc-descricao" rows="3" placeholder="Descreva a ocorrencia..."></textarea></div>
    <div class="form-group"><label>Prioridade</label>
      <select id="oc-prioridade">
        <option value="baixa">Baixa</option><option value="media">Media</option>
        <option value="alta">Alta</option><option value="critica">Critica</option>
      </select>
    </div>
    <div class="form-group"><label>Logradouro</label><input type="text" id="oc-logradouro" placeholder="Ex: Eixo Monumental, s/n" /></div>
    <div class="form-row">
      <div class="form-group"><label>Bairro</label><input type="text" id="oc-bairro" placeholder="Ex: Asa Norte" /></div>
      <div class="form-group"><label>Cidade</label><input type="text" id="oc-cidade" value="Brasilia" /></div>
    </div>
    <div class="form-group">
      <button class="btn-secondary" style="width:100%" onclick="geocodificarEndereco()">Buscar localizacao automaticamente</button>
      <span id="geo-info" class="text-muted" style="font-size:12px;margin-top:4px;display:block;"></span>
      <input type="hidden" id="oc-lat" /><input type="hidden" id="oc-lng" />
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="registrarOcorrenciaBombeiro()">Registrar</button>
    </div>`);
}

const COORDS_BAIRROS_BSB = {
  'asa norte':              { lat: -15.7500, lng: -47.8900 },
  'asa sul':                { lat: -15.8200, lng: -47.8900 },
  'lago norte':             { lat: -15.7300, lng: -47.8400 },
  'lago sul':               { lat: -15.8600, lng: -47.8700 },
  'taguatinga':             { lat: -15.8300, lng: -48.0500 },
  'taguatinga centro':      { lat: -15.8300, lng: -48.0500 },
  'ceilandia':              { lat: -15.8100, lng: -48.1100 },
  'ceilandia norte':        { lat: -15.7900, lng: -48.1000 },
  'sobradinho':             { lat: -15.6500, lng: -47.7900 },
  'planaltina':             { lat: -15.6200, lng: -47.6500 },
  'gama':                   { lat: -16.0100, lng: -48.0600 },
  'samambaia':              { lat: -15.8700, lng: -48.0900 },
  'guara':                  { lat: -15.8100, lng: -47.9800 },
  'cruzeiro':               { lat: -15.7900, lng: -47.9400 },
  'setor hospitalar sul':   { lat: -15.7900, lng: -47.8900 },
  'riacho fundo':           { lat: -15.9000, lng: -48.0300 },
  'recanto das emas':       { lat: -15.9100, lng: -48.0700 },
  'santa maria':            { lat: -16.0000, lng: -48.0000 },
  'sao sebastiao':          { lat: -15.9000, lng: -47.8000 },
  'paranoa':                { lat: -15.7700, lng: -47.7700 },
  'itapoa':                 { lat: -15.6800, lng: -47.7600 },
};

const CENTRO_BSB = { lat: -15.7998, lng: -47.8645 };

async function geocodificarEndereco() {
  const logradouro = document.getElementById('oc-logradouro').value;
  const bairro = document.getElementById('oc-bairro').value;
  const cidade = document.getElementById('oc-cidade').value;
  const info = document.getElementById('geo-info');
  if (!logradouro && !bairro) { showToast('Informe o logradouro e bairro primeiro.', 'error'); return; }
  info.textContent = 'Buscando localizacao...';
  info.style.color = 'var(--color-text-muted)';

  let coords = await buscarCoordenadas(logradouro, bairro, cidade);
  if (!coords && bairro) coords = await buscarCoordenadas('', bairro, cidade);
  if (!coords && bairro) {
    const chave = bairro.toLowerCase().trim();
    if (COORDS_BAIRROS_BSB[chave]) coords = COORDS_BAIRROS_BSB[chave];
  }
  if (!coords) {
    coords = CENTRO_BSB;
    info.textContent = 'Endereco nao encontrado. Usando centro de Brasilia como localizacao aproximada.';
    info.style.color = 'var(--color-alta)';
  } else {
    info.textContent = `Localizacao encontrada: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    info.style.color = 'var(--color-encerrada)';
  }
  document.getElementById('oc-lat').value = coords.lat;
  document.getElementById('oc-lng').value = coords.lng;
}

async function registrarOcorrenciaBombeiro() {
  const lat = parseFloat(document.getElementById('oc-lat').value) || null;
  const lng = parseFloat(document.getElementById('oc-lng').value) || null;
  const dados = {
    tipo: document.getElementById('oc-tipo').value,
    descricao: document.getElementById('oc-descricao').value,
    prioridade: document.getElementById('oc-prioridade').value,
    num_vitimas: 0,
    endereco: {
      logradouro: document.getElementById('oc-logradouro').value,
      bairro: document.getElementById('oc-bairro').value,
      cidade: document.getElementById('oc-cidade').value,
      latitude: lat, longitude: lng,
    },
  };
  const denunciaIdCheck = parseInt(document.getElementById('oc-denuncia-id')?.value) || null;
  if (!denunciaIdCheck) { showToast('Selecione a denuncia base para a ocorrencia.', 'error'); return; }
  if (!dados.descricao) { showToast('Informe a descricao.', 'error'); return; }
  try {
    await Ocorrencias.criar(dados);
    const denunciaId = parseInt(document.getElementById('oc-denuncia-id')?.value) || null;
    if (denunciaId) {
      try { await Denuncias.atualizar(denunciaId, { status: 'convertida' }); }
      catch (e) { console.error('Erro ao converter denuncia:', e); }
    }
    closeModal();
    showToast('Ocorrencia registrada! Aparece no Kanban do Comandante.', 'success');
    await carregarTabelaOcorrenciasBombeiro();
    await carregarDenunciasBombeiro();
    if (mapaOcorrencias) {
      mapaOcorrencias.eachLayer((l) => { if (l instanceof L.Marker) mapaOcorrencias.removeLayer(l); });
      await carregarPinsOcorrencias();
    }
    if (document.getElementById('col-aberta')) await carregarKanbanOcorrencias();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function abrirModalAtualizarStatusOcorrencia(oc) {
  // Carregar alocacoes atuais para mostrar no modal e validar regras
  let bombeiroAlocados = [], viaturaAlocadas = [];
  try {
    [bombeiroAlocados, viaturaAlocadas] = await Promise.all([
      Ocorrencias.listarBombeiros(oc.id).catch(() => []),
      Ocorrencias.listarViaturas(oc.id).catch(() => []),
    ]);
  } catch (e) {}

  const qtdBombeiros = bombeiroAlocados.length;
  const qtdViaturas  = viaturaAlocadas.length;

  // Regra: so pode ir para em_andamento com >= 1 viatura e >= 2 bombeiros
  const podeAvancar = qtdViaturas >= 1 && qtdBombeiros >= 2;

  // Instrucao de progresso baseada no status atual
  let instrucao = '';
  if (oc.status === 'aberta') {
    const faltaBombeiros = Math.max(0, 2 - qtdBombeiros);
    const faltaViatura   = qtdViaturas < 1;
    instrucao = `
      <div style="background:rgba(255,193,7,0.08);border:1px solid var(--color-alta);border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;">
        <strong style="color:var(--color-alta);">Requisitos para iniciar operacao:</strong>
        <div style="margin-top:6px;display:flex;gap:16px;">
          <span style="color:${qtdBombeiros>=2?'var(--color-encerrada)':'var(--color-alta)'};">
            ${qtdBombeiros>=2?'✓':'✗'} Bombeiros: ${qtdBombeiros}/2 minimo
          </span>
          <span style="color:${qtdViaturas>=1?'var(--color-encerrada)':'var(--color-alta)'};">
            ${qtdViaturas>=1?'✓':'✗'} Viaturas: ${qtdViaturas}/1 minimo
          </span>
        </div>
        ${!podeAvancar ? '<div style="margin-top:6px;color:var(--color-alta);">Aloque os recursos necessarios antes de iniciar.</div>' : ''}
      </div>`;
  } else if (oc.status === 'em_andamento') {
    instrucao = `
      <div style="background:rgba(52,152,219,0.08);border:1px solid var(--color-info);border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;">
        <strong style="color:var(--color-info);">Operacao em andamento</strong><br>
        Quando finalizar, solicite o encerramento ao Comandante.
      </div>`;
  }

  // Select de status: aberta so mostra em_andamento se podeAvancar
  const opcoesStatus = oc.status === 'aberta'
    ? `<option value="aberta" selected>Aberta</option>
       <option value="em_andamento" ${!podeAvancar ? 'disabled' : ''}>Em andamento${!podeAvancar ? ' (aloque recursos primeiro)' : ''}</option>`
    : `<option value="em_andamento" selected>Em andamento</option>`;

  openModal(`Ocorrencia #${oc.id} - ${oc.tipo}`, `
    ${instrucao}
    <div class="form-group"><label>Descricao</label><textarea id="oc-edit-descricao" rows="3">${oc.descricao}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Status</label>
        <select id="oc-edit-status">${opcoesStatus}</select>
      </div>
      <div class="form-group"><label>Nr de vitimas</label>
        <input type="number" id="oc-edit-vitimas" min="0" value="${oc.num_vitimas??0}" />
      </div>
    </div>
    <div class="form-group">
      <label>Vincular bombeiro</label>
      <div style="display:flex;gap:8px;">
        <select id="oc-bombeiro-select" style="flex:1"><option value="">Carregando...</option></select>
        <button class="btn-secondary" onclick="vincularBombeiroOcorrencia(${oc.id})">Vincular</button>
      </div>
    </div>
    <div class="form-group">
      <label>Adicionar viatura</label>
      <div style="display:flex;gap:8px;">
        <select id="oc-viatura-select" style="flex:1"><option value="">Carregando...</option></select>
        <button class="btn-secondary" onclick="adicionarViaturaOcorrencia(${oc.id})">Adicionar</button>
      </div>
    </div>
    ${oc.status === 'em_andamento' ? `
    <div style="border-top:1px solid var(--color-border);margin-top:12px;padding-top:12px;">
      <div class="form-group"><label>Motivo do encerramento</label>
        <input type="text" id="oc-motivo-encerramento" placeholder="Ex: Situacao controlada." />
      </div>
      <button class="btn-secondary" style="width:100%;margin-bottom:8px;" onclick="solicitarEncerramentoOcorrencia(${oc.id})">
        Solicitar encerramento ao Comandante
      </button>
    </div>` : ''}
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="atualizarStatusOcorrencia(${oc.id})">Salvar</button>
    </div>`);

  try {
    const [bombeiros, viaturas, todasOcorrencias] = await Promise.all([
      Bombeiros.listar(), Viaturas.listar(), Ocorrencias.listar(),
    ]);
    const idsAlocadosNesta   = bombeiroAlocados.map((b) => b.bombeiro_id);
    const idsViaturasAlocadas = viaturaAlocadas.map((v) => v.viatura_id);
    const outrasOcorrencias  = todasOcorrencias.filter((o) =>
      o.id !== oc.id && ['aberta','em_andamento'].includes(o.status)
    );
    const idsEmOutras = [];
    for (const outra of outrasOcorrencias) {
      try {
        const al = await Ocorrencias.listarBombeiros(outra.id);
        al.forEach((a) => idsEmOutras.push(a.bombeiro_id));
      } catch (e) {}
    }
    const bombeirosFiltrados = bombeiros.filter((b) =>
      b.status === 'ativo' && !idsAlocadosNesta.includes(b.id) && !idsEmOutras.includes(b.id)
    );
    const viaturasFiltradas = viaturas.filter((v) =>
      v.status === 'disponivel' && !idsViaturasAlocadas.includes(v.id)
    );
    const selB = document.getElementById('oc-bombeiro-select');
    if (selB) {
      selB.innerHTML = `<option value="">+ Adicionar bombeiro (${bombeirosFiltrados.length} disp.)...</option>` +
        bombeirosFiltrados.map((b) => `<option value="${b.id}">${b.nome} (${b.matricula})</option>`).join('');
    }
    const selV = document.getElementById('oc-viatura-select');
    if (selV) {
      selV.innerHTML = `<option value="">+ Adicionar viatura (${viaturasFiltradas.length} disp.)...</option>` +
        viaturasFiltradas.map((v) => `<option value="${v.id}">${v.placa} — ${v.modelo}</option>`).join('');
    }
  } catch (e) { console.error('Erro ao carregar dropdowns:', e); }
}

async function solicitarEncerramentoOcorrencia(id) {
  // Verificar requisitos minimos (redundante mas seguro)
  let bombeiros = [], viaturas = [];
  try {
    [bombeiros, viaturas] = await Promise.all([
      Ocorrencias.listarBombeiros(id).catch(() => []),
      Ocorrencias.listarViaturas(id).catch(() => []),
    ]);
  } catch (e) { showToast('Erro ao verificar alocacoes.', 'error'); return; }

  if (bombeiros.length < 2) { showToast('Necessario ao menos 2 bombeiros alocados para solicitar encerramento.', 'error'); return; }
  if (viaturas.length < 1)  { showToast('Necessario ao menos 1 viatura alocada para solicitar encerramento.', 'error'); return; }

  // Dialogo de confirmacao antes de enviar
  const confirmado = await confirmarEncerramento();
  if (!confirmado) return;

  const motivo = document.getElementById('oc-motivo-encerramento').value || 'Bombeiro solicita encerramento.';
  try {
    await Ocorrencias.atualizar(id, { descricao: `[SOLICITACAO DE ENCERRAMENTO] ${motivo}` });
    showToast('Solicitacao de encerramento enviada ao Comandante!', 'success');
    closeModal();
    await carregarTabelaOcorrenciasBombeiro();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// Dialogo de confirmacao de encerramento — retorna Promise<boolean>
function confirmarEncerramento() {
  return new Promise((resolve) => {
    document.getElementById('dialogo-encerramento')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'dialogo-encerramento';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.6);`;
    overlay.innerHTML = `
      <div style="background:var(--color-surface);border:1px solid var(--color-border);
        border-radius:12px;padding:24px;max-width:360px;width:90%;text-align:center;">
        <div style="font-size:18px;font-weight:600;margin-bottom:8px;">Confirmar encerramento</div>
        <p style="color:var(--color-text-muted);font-size:13px;margin-bottom:20px;">
          Tem certeza que deseja solicitar o encerramento desta operacao ao Comandante?
        </p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button id="enc-nao" class="btn-secondary" style="min-width:80px;">Nao</button>
          <button id="enc-sim" class="btn-primary"   style="min-width:80px;">Sim</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('enc-sim').onclick = () => { overlay.remove(); resolve(true); };
    document.getElementById('enc-nao').onclick = () => { overlay.remove(); resolve(false); };
  });
}

async function atualizarStatusOcorrencia(id) {
  const novoStatus = document.getElementById('oc-edit-status').value;

  // Bloquear avanco para em_andamento sem requisitos minimos
  if (novoStatus === 'em_andamento') {
    let bombeiros = [], viaturas = [];
    try {
      [bombeiros, viaturas] = await Promise.all([
        Ocorrencias.listarBombeiros(id).catch(() => []),
        Ocorrencias.listarViaturas(id).catch(() => []),
      ]);
    } catch (e) {}
    if (bombeiros.length < 2) {
      showToast('Aloque ao menos 2 bombeiros antes de iniciar a operacao.', 'error'); return;
    }
    if (viaturas.length < 1) {
      showToast('Aloque ao menos 1 viatura antes de iniciar a operacao.', 'error'); return;
    }
  }

  const dados = {
    status:      novoStatus,
    descricao:   document.getElementById('oc-edit-descricao').value,
    num_vitimas: parseInt(document.getElementById('oc-edit-vitimas').value) || 0,
  };
  try {
    await Ocorrencias.atualizar(id, dados);
    closeModal();
    showToast('Ocorrencia atualizada!', 'success');
    await carregarTabelaOcorrenciasBombeiro();
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function vincularBombeiroOcorrencia(ocorrenciaId) {
  const sel = document.getElementById('oc-bombeiro-select');
  const bombeiroId = parseInt(sel?.value);
  if (!bombeiroId) { showToast('Selecione um bombeiro.', 'error'); return; }
  const nomeSelecionado = sel.options[sel.selectedIndex]?.text ?? '';
  try {
    await Ocorrencias.alocarBombeiro(ocorrenciaId, { bombeiro_id: bombeiroId });
    showToast(`${nomeSelecionado} vinculado!`, 'success');
    sel.remove(sel.selectedIndex);
    sel.value = '';
    const disponiveis = sel.options.length - 1;
    sel.options[0].text = `+ Adicionar bombeiro (${disponiveis} disp.)...`;
    const listaBombeiros = document.querySelector('.lista-bombeiros-alocados');
    if (listaBombeiros) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-info';
      badge.style.margin = '2px';
      badge.textContent = nomeSelecionado;
      const vazio = listaBombeiros.querySelector('.text-muted');
      if (vazio) vazio.remove();
      listaBombeiros.appendChild(badge);
    }
    const contadorB = document.getElementById('contador-bombeiros');
    if (contadorB) {
      const atual = parseInt(contadorB.dataset.count || '0') + 1;
      contadorB.dataset.count = atual;
      contadorB.textContent = `${atual}/2 minimo`;
      contadorB.style.color = atual >= 2 ? 'var(--color-encerrada)' : 'var(--color-alta)';
    }
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

async function adicionarViaturaOcorrencia(ocorrenciaId) {
  const sel = document.getElementById('oc-viatura-select');
  const viaturaId = parseInt(sel?.value);
  if (!viaturaId) { showToast('Selecione uma viatura.', 'error'); return; }
  const placaSelecionada = sel.options[sel.selectedIndex]?.text.split(' —')[0] ?? '';
  try {
    await Ocorrencias.alocarViatura(ocorrenciaId, { viatura_id: viaturaId });
    showToast(`Viatura ${placaSelecionada} adicionada!`, 'success');
    const ocorrencias = await Ocorrencias.listar();
    const oc = ocorrencias.find((x) => x.id === ocorrenciaId);
    if (oc) await abrirModalAtualizarStatusOcorrencia(oc);
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

function abrirModalParticiparTreinamento(t) {
  openModal(`Participar - ${t.titulo}`, `
    <div class="form-group"><label>Tipo</label><input type="text" value="${t.tipo==='pratico'?'Pratico':'Teorico'}" disabled /></div>
    <div class="form-row">
      <div class="form-group"><label>Instrutor</label><input type="text" value="${t.instrutor??'--'}" disabled /></div>
      <div class="form-group"><label>Carga horaria</label><input type="text" value="${t.carga_horaria?t.carga_horaria+'h':'--'}" disabled /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Data inicio</label><input type="text" value="${t.data_inicio??'--'}" disabled /></div>
      <div class="form-group"><label>Data fim</label><input type="text" value="${t.data_fim??'--'}" disabled /></div>
    </div>
    ${t.descricao?`<div class="form-group"><label>Descricao</label><textarea rows="2" disabled>${t.descricao}</textarea></div>`:''}
    <div class="form-group"><label>Sua matricula</label><input type="text" id="part-matricula" placeholder="Ex: CB-001" /></div>
    <p class="text-muted" style="font-size:12px;">Ao confirmar, sua inscricao sera registrada. O Comandante atualizara apos o treinamento.</p>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary" onclick="participarTreinamento(${t.id})">Confirmar inscricao</button>
    </div>`);
}

async function participarTreinamento(treinamentoId) {
  const matricula = document.getElementById('part-matricula').value.trim();
  if (!matricula) { showToast('Informe sua matricula.', 'error'); return; }
  try {
    const bombeiros = await Bombeiros.listar();
    const b = bombeiros.find((x) => x.matricula.toLowerCase() === matricula.toLowerCase());
    if (!b) { showToast('Matricula nao encontrada.', 'error'); return; }
    await Treinamentos.inscreverBombeiro(treinamentoId, { bombeiro_id: b.id, status_participacao: 'inscrito' });
    closeModal(); showToast(`${b.nome} inscrito!`, 'success');
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// VIEW: CIDADAO
// =============================================

async function carregarViewCidadao() {
  const container = document.getElementById('cidadao-content');
  if (!container) return;
  container.innerHTML = `
    <div class="cidadao-form-card">
      <h2>Registrar denuncia</h2>
      <p>Preencha o formulario abaixo para enviar uma denuncia aos bombeiros. Nossa equipe ira analisa-la o mais breve possivel.</p>
      <div class="form-group"><label>Seu nome</label><input type="text" id="den-nome" placeholder="Nome completo" /></div>
      <div class="form-group"><label>Telefone</label><input type="text" id="den-telefone" placeholder="61999990000" /></div>
      <div class="form-group"><label>Tipo de ocorrencia</label>
        <select id="den-tipo">
          <option value="incendio">Incendio</option>
          <option value="acidente">Acidente</option>
          <option value="inundacao">Inundacao</option>
          <option value="outros">Outros</option>
        </select>
      </div>
      <div class="form-group"><label>Endereco</label><input type="text" id="den-endereco" placeholder="Ex: SQN 210, Bloco B" /></div>
      <div class="form-group"><label>Descricao</label><textarea id="den-descricao" rows="4" placeholder="Descreva a situacao de risco com o maximo de detalhes possivel..."></textarea></div>
      <button class="btn-primary" style="width:100%;padding:12px;font-size:15px;" onclick="enviarDenuncia()">Enviar denuncia</button>
    </div>`;
}

async function enviarDenuncia() {
  const dados = {
    solicitante: document.getElementById('den-nome').value,
    telefone: document.getElementById('den-telefone').value,
    tipo: document.getElementById('den-tipo').value,
    endereco_informado: document.getElementById('den-endereco').value,
    descricao: document.getElementById('den-descricao').value,
  };
  if (!dados.solicitante || !dados.descricao || !dados.endereco_informado) {
    showToast('Preencha nome, endereco e descricao.', 'error'); return;
  }
  try {
    await Denuncias.criar(dados);
    // Exibe mensagem de sucesso no lugar do formulario
    const container = document.getElementById('cidadao-content');
    container.innerHTML = `
      <div class="cidadao-sucesso">
        <span class="cidadao-sucesso-icon">✅</span>
        <h2>Denuncia enviada com sucesso!</h2>
        <p>
          Obrigado, <strong>${dados.solicitante}</strong>. Sua denuncia foi registrada e sera analisada
          pela equipe do Corpo de Bombeiros DF em breve.<br><br>
          Caso a situacao seja de emergencia imediata, ligue <strong>193</strong>.
        </p>
        <button class="btn-primary" style="padding:10px 32px;font-size:14px;" onclick="carregarViewCidadao()">
          Registrar outra denuncia
        </button>
      </div>`;
  } catch (erro) { showToast(`Erro: ${erro.message}`, 'error'); }
}

// =============================================
// INICIALIZACAO GERAL
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-nova-ocorrencia').addEventListener('click', abrirModalNovaOcorrencia);
  inicializarSeletorPerfil();
  inicializarMapa();
  carregarViewComandante();
});
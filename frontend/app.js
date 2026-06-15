// =============================================
// APP.JS — inicialização e controle de perfis
// =============================================

// =============================================
// TROCA DE PERFIL
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

    // Card de Bombeiros
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

    // Card de Viaturas
    grid.appendChild(criarResourceCard('🚒 Viaturas', viaturas,
      [
        { label: 'Placa',  key: 'placa' },
        { label: 'Modelo', key: 'modelo' },
        { label: 'Status', render: badgeStatusViatura },
      ],
      { onEditar: (v) => abrirModalEditarViatura(v) }
    ));

    // Card de Equipamentos
    grid.appendChild(criarResourceCard('🧰 Equipamentos', equipamentos,
      [
        { label: 'Nome',   key: 'nome' },
        { label: 'Tipo',   key: 'tipo' },
        { label: 'Status', render: badgeStatusEquipamento },
      ],
      { onEditar: (e) => abrirModalEditarEquipamento(e) }
    ));

    // Card de Equipes
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

    // Card de Treinamentos
    const treinamentos = await Treinamentos.listar();
    grid.appendChild(criarResourceCard('🎓 Treinamentos', treinamentos,
      [
        { label: 'Título',    key: 'titulo' },
        { label: 'Tipo',      key: 'tipo' },
        { label: 'Status',    render: badgeStatusTreinamento },
        { label: 'Instrutor', key: 'instrutor' },
      ],
      {
        onEditar: (t) => abrirModalEditarTreinamento(t),
        btnExtra: { label: '+ Novo', onClick: abrirModalNovoTreinamento },
      }
    ));

  } catch (erro) {
    console.error('Erro carregarRecursosComandante:', erro);
    showToast('Erro ao carregar recursos.', 'error');
  }
}

// Monta um resource card com tabela dentro
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
        <input type="text" id="b-matricula" value="${b.matricula}" disabled />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Patente</label>
        <select id="b-patente">
          <option value="soldado"         ${b.patente === 'soldado'         ? 'selected':''}>Soldado</option>
          <option value="cabo"            ${b.patente === 'cabo'            ? 'selected':''}>Cabo</option>
          <option value="sargento"        ${b.patente === 'sargento'        ? 'selected':''}>Sargento</option>
          <option value="tenente"         ${b.patente === 'tenente'         ? 'selected':''}>Tenente</option>
          <option value="capitao"         ${b.patente === 'capitao'         ? 'selected':''}>Capitão</option>
          <option value="major"           ${b.patente === 'major'           ? 'selected':''}>Major</option>
          <option value="tenente_coronel" ${b.patente === 'tenente_coronel' ? 'selected':''}>Tenente Coronel</option>
          <option value="coronel"         ${b.patente === 'coronel'         ? 'selected':''}>Coronel</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="b-status">
          <option value="ativo"    ${b.status === 'ativo'    ? 'selected':''}>Ativo</option>
          <option value="de_folga" ${b.status === 'de_folga' ? 'selected':''}>De folga</option>
          <option value="inativo"  ${b.status === 'inativo'  ? 'selected':''}>Inativo</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Especialidade</label>
      <input type="text" id="b-especialidade" value="${b.especialidade ?? ''}" />
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
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
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
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

async function deletarBombeiro(id) {
  if (!confirm('Excluir este bombeiro?')) return;
  try {
    await Bombeiros.deletar(id);
    closeModal();
    showToast('Bombeiro excluído.', 'info');
    await carregarRecursosComandante();
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

// =============================================
// MODAIS DO COMANDANTE — Viatura
// =============================================

function abrirModalEditarViatura(v) {
  openModal(`Viatura — ${v.placa}`, `
    <div class="form-group">
      <label>Modelo</label>
      <input type="text" id="v-modelo" value="${v.modelo}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipo</label>
        <select id="v-tipo">
          <option value="auto_bomba"   ${v.tipo === 'auto_bomba'   ? 'selected':''}>Auto Bomba</option>
          <option value="auto_escada"  ${v.tipo === 'auto_escada'  ? 'selected':''}>Auto Escada</option>
          <option value="ambulancia"   ${v.tipo === 'ambulancia'   ? 'selected':''}>Ambulância</option>
          <option value="veiculo_leve" ${v.tipo === 'veiculo_leve' ? 'selected':''}>Veículo Leve</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="v-status">
          <option value="disponivel"    ${v.status === 'disponivel'    ? 'selected':''}>Disponível</option>
          <option value="em_manutencao" ${v.status === 'em_manutencao' ? 'selected':''}>Em manutenção</option>
          <option value="inativa"       ${v.status === 'inativa'       ? 'selected':''}>Inativa</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="salvarViatura(${v.id})">Salvar</button>
    </div>
  `);
}

async function salvarViatura(id) {
  const dados = {
    modelo: document.getElementById('v-modelo').value,
    tipo:   document.getElementById('v-tipo').value,
    status: document.getElementById('v-status').value,
  };
  try {
    await Viaturas.atualizar(id, dados);
    closeModal();
    showToast('Viatura atualizada!', 'success');
    await carregarRecursosComandante();
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

// =============================================
// MODAIS DO COMANDANTE — Equipamento
// =============================================

function abrirModalEditarEquipamento(e) {
  openModal(`Equipamento — ${e.nome}`, `
    <div class="form-group">
      <label>Nome</label>
      <input type="text" id="eq-nome" value="${e.nome}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipo</label>
        <select id="eq-tipo">
          <option value="combate" ${e.tipo === 'combate' ? 'selected':''}>Combate</option>
          <option value="resgate" ${e.tipo === 'resgate' ? 'selected':''}>Resgate</option>
          <option value="medico"  ${e.tipo === 'medico'  ? 'selected':''}>Médico</option>
          <option value="outros"  ${e.tipo === 'outros'  ? 'selected':''}>Outros</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="eq-status">
          <option value="disponivel"    ${e.status === 'disponivel'    ? 'selected':''}>Disponível</option>
          <option value="em_uso"        ${e.status === 'em_uso'        ? 'selected':''}>Em uso</option>
          <option value="em_manutencao" ${e.status === 'em_manutencao' ? 'selected':''}>Em manutenção</option>
          <option value="inativo"       ${e.status === 'inativo'       ? 'selected':''}>Inativo</option>
        </select>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="salvarEquipamento(${e.id})">Salvar</button>
    </div>
  `);
}

async function salvarEquipamento(id) {
  const dados = {
    nome:   document.getElementById('eq-nome').value,
    tipo:   document.getElementById('eq-tipo').value,
    status: document.getElementById('eq-status').value,
  };
  try {
    await Equipamentos.atualizar(id, dados);
    closeModal();
    showToast('Equipamento atualizado!', 'success');
    await carregarRecursosComandante();
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
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
  if (!dados.nome || !dados.tipo) {
    showToast('Informe o nome e o tipo da equipe.', 'error');
    return;
  }
  try {
    await Equipes.criar(dados);
    closeModal();
    showToast('Equipe criada!', 'success');
    await carregarRecursosComandante();
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

function abrirModalEditarEquipe(eq) {
  openModal(`Equipe — ${eq.nome}`, `
    <div class="form-group">
      <label>Nome</label>
      <input type="text" id="eq-nome-equipe" value="${eq.nome}" />
    </div>
    <div class="form-group">
      <label>Tipo</label>
      <input type="text" id="eq-tipo-equipe" value="${eq.tipo ?? ''}" />
    </div>
    <div class="form-actions">
      <button class="btn-danger"    onclick="deletarEquipe(${eq.id})">Excluir</button>
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-secondary" onclick="abrirModalMembros(${eq.id}, '${eq.nome}')">👥 Membros</button>
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
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

async function deletarEquipe(id) {
  if (!confirm('Excluir esta equipe?')) return;
  try {
    await Equipes.deletar(id);
    closeModal();
    showToast('Equipe excluída.', 'info');
    await carregarRecursosComandante();
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
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
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:8px 0;border-bottom:1px solid var(--color-border);">
              <span>${nome}</span>
              <button class="btn-danger" style="padding:4px 10px;font-size:12px"
                onclick="removerMembroEquipe(${equipeId}, ${m.bombeiro_id}, '${equipeNome}')">
                Remover
              </button>
            </div>
          `;
        }).join('')
      : '<div class="empty-state">Nenhum membro alocado.</div>';

    const selectOpcoes = disponiveis.length > 0
      ? disponiveis.map((b) => `<option value="${b.id}">${b.nome} — ${b.patente}</option>`).join('')
      : '<option disabled>Todos os bombeiros já estão alocados</option>';

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
        <button class="btn-primary"   onclick="adicionarMembroEquipe(${equipeId}, '${equipeNome}')">
          Adicionar
        </button>
      </div>
    `;

  } catch (erro) {
    document.getElementById('modal-body').innerHTML =
      '<div class="empty-state">Erro ao carregar membros.</div>';
  }
}

async function adicionarMembroEquipe(equipeId, equipeNome) {
  const bombeiroId = parseInt(document.getElementById('select-bombeiro-equipe').value);
  const funcao     = document.getElementById('funcao-membro').value || null;

  if (!bombeiroId) {
    showToast('Selecione um bombeiro.', 'error');
    return;
  }

  try {
    await request('POST', `/equipes/${equipeId}/bombeiros`, {
      bombeiro_id: bombeiroId,
      funcao,
    });
    showToast('Bombeiro adicionado!', 'success');
    await abrirModalMembros(equipeId, equipeNome);
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

async function removerMembroEquipe(equipeId, bombeiroId, equipeNome) {
  if (!confirm('Remover este bombeiro da equipe?')) return;
  try {
    await request('DELETE', `/equipes/${equipeId}/bombeiros/${bombeiroId}`);
    showToast('Membro removido.', 'info');
    await abrirModalMembros(equipeId, equipeNome);
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

// =============================================
// MODAIS DO COMANDANTE — Treinamentos
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

function abrirModalEditarTreinamento(t) {
  openModal(`Treinamento — ${t.titulo}`, `
    <div class="form-group">
      <label>Título</label>
      <input type="text" id="tr-titulo" value="${t.titulo}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipo</label>
        <select id="tr-tipo">
          <option value="teorico" ${t.tipo === 'teorico' ? 'selected':''}>Teórico</option>
          <option value="pratico" ${t.tipo === 'pratico' ? 'selected':''}>Prático</option>
        </select>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="tr-status">
          <option value="agendado"     ${t.status === 'agendado'     ? 'selected':''}>Agendado</option>
          <option value="em_andamento" ${t.status === 'em_andamento' ? 'selected':''}>Em andamento</option>
          <option value="concluido"    ${t.status === 'concluido'    ? 'selected':''}>Concluído</option>
          <option value="cancelado"    ${t.status === 'cancelado'    ? 'selected':''}>Cancelado</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Instrutor</label>
        <input type="text" id="tr-instrutor" value="${t.instrutor ?? ''}" />
      </div>
      <div class="form-group">
        <label>Carga horária (h)</label>
        <input type="number" id="tr-carga" min="1" value="${t.carga_horaria ?? ''}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Data de início</label>
        <input type="date" id="tr-inicio" value="${t.data_inicio ?? ''}" />
      </div>
      <div class="form-group">
        <label>Data de fim</label>
        <input type="date" id="tr-fim" value="${t.data_fim ?? ''}" />
      </div>
    </div>
    <div class="form-group">
      <label>Descrição</label>
      <textarea id="tr-descricao" rows="3">${t.descricao ?? ''}</textarea>
    </div>
    <div class="form-actions">
      <button class="btn-danger"    onclick="deletarTreinamento(${t.id})">Excluir</button>
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="salvarTreinamento(${t.id})">Salvar</button>
    </div>
  `);
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
  if (!dados.titulo) {
    showToast('Informe o título do treinamento.', 'error');
    return;
  }
  try {
    await Treinamentos.criar(dados);
    closeModal();
    showToast('Treinamento criado!', 'success');
    await carregarRecursosComandante();
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

async function salvarTreinamento(id) {
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
  try {
    await Treinamentos.atualizar(id, dados);
    closeModal();
    showToast('Treinamento atualizado!', 'success');
    await carregarRecursosComandante();
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
}

async function deletarTreinamento(id) {
  if (!confirm('Excluir este treinamento?')) return;
  try {
    await Treinamentos.deletar(id);
    closeModal();
    showToast('Treinamento excluído.', 'info');
    await carregarRecursosComandante();
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
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
        <div class="kanban-board">
          <div class="kanban-col">
            <div class="kanban-col-header status-pendente">
              Pendente
              <span class="col-count" id="count-manut-pendente">0</span>
            </div>
            <div class="kanban-cards" id="col-manut-pendente"></div>
          </div>
          <div class="kanban-col">
            <div class="kanban-col-header status-em-andamento">
              Em andamento
              <span class="col-count" id="count-manut-em-andamento">0</span>
            </div>
            <div class="kanban-cards" id="col-manut-em-andamento"></div>
          </div>
          <div class="kanban-col">
            <div class="kanban-col-header status-concluida">
              Concluída
              <span class="col-count" id="count-manut-concluida">0</span>
            </div>
            <div class="kanban-cards" id="col-manut-concluida"></div>
          </div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 20px;">
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
    cardV.innerHTML = `<div class="resource-card-header"><span class="resource-card-title">🚒 Viaturas</span></div>`;
    cardV.appendChild(criarTabela(
      [
        { label: 'Placa',  key: 'placa' },
        { label: 'Modelo', key: 'modelo' },
        { label: 'Status', render: badgeStatusViatura },
      ],
      viaturas
    ));

    const cardE = document.getElementById('card-equipamentos-tecnico');
    cardE.innerHTML = `<div class="resource-card-header"><span class="resource-card-title">🧰 Equipamentos</span></div>`;
    cardE.appendChild(criarTabela(
      [
        { label: 'Nome',   key: 'nome' },
        { label: 'Tipo',   key: 'tipo' },
        { label: 'Status', render: badgeStatusEquipamento },
      ],
      equipamentos
    ));

  } catch (erro) {
    showToast('Erro ao carregar dados do técnico.', 'error');
  }
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
    <div class="form-row">
      <div class="form-group">
        <label>ID da viatura (opcional)</label>
        <input type="number" id="manut-viatura" min="1" placeholder="Ex: 1" />
      </div>
      <div class="form-group">
        <label>ID do equipamento (opcional)</label>
        <input type="number" id="manut-equipamento" min="1" placeholder="Ex: 2" />
      </div>
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

async function criarManutencao() {
  const dados = {
    tipo:           document.getElementById('manut-tipo').value,
    descricao:      document.getElementById('manut-descricao').value,
    viatura_id:     parseInt(document.getElementById('manut-viatura').value) || null,
    equipamento_id: parseInt(document.getElementById('manut-equipamento').value) || null,
    data_inicio:    document.getElementById('manut-inicio').value || null,
    custo:          parseFloat(document.getElementById('manut-custo').value) || null,
  };
  try {
    await Manutencoes.criar(dados);
    closeModal();
    showToast('Manutenção criada!', 'success');
    await carregarKanbanManutencoes();
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
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
    showToast('Preencha nome, endereço e descrição.', 'error');
    return;
  }
  try {
    await Denuncias.criar(dados);
    showToast('Denúncia enviada com sucesso!', 'success');
    ['den-nome','den-telefone','den-endereco','den-descricao'].forEach((id) => {
      document.getElementById(id).value = '';
    });
  } catch (erro) {
    showToast(`Erro: ${erro.message}`, 'error');
  }
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
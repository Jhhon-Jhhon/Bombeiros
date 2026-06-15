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

      // Atualiza botões
      botoes.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Atualiza views
      views.forEach((v) => v.classList.remove('active'));
      document.getElementById(`view-${perfil}`).classList.add('active');

      // Recarrega conteúdo da view ativada
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

  // Atualiza pins do mapa sem recriar o mapa inteiro
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
        { label: 'Nome',     key: 'nome' },
        { label: 'Patente',  render: badgePatente },
        { label: 'Status',   render: badgeStatusBombeiro },
      ],
      {
        onEditar:  (b) => abrirModalEditarBombeiro(b),
        btnExtra: {
          label: '+ Novo',
          onClick: abrirModalNovoBombeiro,
        },
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
        { label: 'Nome',        key: 'nome' },
        { label: 'Especialidade', key: 'especialidade' },
      ],
      { onEditar: (eq) => abrirModalEditarEquipe(eq) }
    ));

  } catch (erro) {
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
          <option value="ativo"     ${b.status === 'ativo'     ? 'selected':''}>Ativo</option>
          <option value="de_folga"  ${b.status === 'de_folga'  ? 'selected':''}>De folga</option>
          <option value="inativo"   ${b.status === 'inativo'   ? 'selected':''}>Inativo</option>
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
    patente:       document.getElementById('b-patente').value,
    status:        document.getElementById('b-status').value,
    especialidade: document.getElementById('b-especialidade').value,
    nome:          document.getElementById('b-nome').value,
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
          <option value="disponivel"     ${v.status === 'disponivel'     ? 'selected':''}>Disponível</option>
          <option value="em_manutencao"  ${v.status === 'em_manutencao'  ? 'selected':''}>Em manutenção</option>
          <option value="inativa"        ${v.status === 'inativa'        ? 'selected':''}>Inativa</option>
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

function abrirModalEditarEquipe(eq) {
  openModal(`Equipe — ${eq.nome}`, `
    <div class="form-group">
      <label>Nome</label>
      <input type="text" id="eq-nome-equipe" value="${eq.nome}" />
    </div>
    <div class="form-group">
      <label>Especialidade</label>
      <input type="text" id="eq-especialidade" value="${eq.especialidade ?? ''}" />
    </div>
    <div class="form-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-primary"   onclick="salvarEquipe(${eq.id})">Salvar</button>
    </div>
  `);
}

async function salvarEquipe(id) {
  const dados = {
    nome:          document.getElementById('eq-nome-equipe').value,
    especialidade: document.getElementById('eq-especialidade').value,
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

// =============================================
// VIEW: TÉCNICO
// =============================================

async function carregarViewTecnico() {
  const container = document.getElementById('tecnico-content');
  if (!container) return;

  container.innerHTML = `
    <div class="tecnico-layout">

      <!-- Kanban de manutenções -->
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

      <!-- Tabelas de viaturas e equipamentos -->
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

    // Card de viaturas
    const cardV = document.getElementById('card-viaturas-tecnico');
    cardV.innerHTML = `
      <div class="resource-card-header">
        <span class="resource-card-title">🚒 Viaturas</span>
      </div>
    `;
    cardV.appendChild(criarTabela(
      [
        { label: 'Placa',  key: 'placa' },
        { label: 'Modelo', key: 'modelo' },
        { label: 'Status', render: badgeStatusViatura },
      ],
      viaturas
    ));

    // Card de equipamentos
    const cardE = document.getElementById('card-equipamentos-tecnico');
    cardE.innerHTML = `
      <div class="resource-card-header">
        <span class="resource-card-title">🧰 Equipamentos</span>
      </div>
    `;
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

// Modal de nova manutenção
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

      <!-- Formulário de denúncia -->
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

      <!-- Listagem de ocorrências públicas -->
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
        { label: 'Tipo',   key: 'tipo' },
        {
          label: 'Local',
          render: (oc) => oc.endereco?.bairro ?? '—',
        },
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
    solicitante:       document.getElementById('den-nome').value,
    telefone:          document.getElementById('den-telefone').value,
    tipo:              document.getElementById('den-tipo').value,
    endereco_informado: document.getElementById('den-endereco').value,
    descricao:         document.getElementById('den-descricao').value,
  };

  if (!dados.solicitante || !dados.descricao || !dados.endereco_informado) {
    showToast('Preencha nome, endereço e descrição.', 'error');
    return;
  }

  try {
    await Denuncias.criar(dados);
    showToast('Denúncia enviada com sucesso!', 'success');

    // Limpa o formulário
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
  // Botão nova ocorrência
  document.getElementById('btn-nova-ocorrencia')
    .addEventListener('click', abrirModalNovaOcorrencia);

  // Inicializa seletor de perfil
  inicializarSeletorPerfil();

  // Inicializa mapa
  inicializarMapa();

  // Carrega view inicial (Comandante)
  carregarViewComandante();
});
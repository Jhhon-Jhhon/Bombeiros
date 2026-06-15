// =============================================
// TABLE — tabelas de listagem reutilizáveis
// =============================================

/**
 * Cria uma tabela HTML a partir de colunas e dados.
 *
 * @param {Array} colunas  — [{ label, key, render }]
 * @param {Array} dados    — array de objetos da API
 * @param {Object} opcoes  — { onEditar, onDeletar }
 * @returns {HTMLElement}  — elemento <table> pronto
 */
function criarTabela(colunas, dados, opcoes = {}) {
  // Estado vazio
  if (!dados || dados.length === 0) {
    const vazio = document.createElement('div');
    vazio.className = 'empty-state';
    vazio.textContent = 'Nenhum registro encontrado.';
    return vazio;
  }

  const tabela = document.createElement('table');
  tabela.className = 'data-table';

  // ---- CABEÇALHO ----
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');

  colunas.forEach((col) => {
    const th = document.createElement('th');
    th.textContent = col.label;
    trHead.appendChild(th);
  });

  // Coluna de ações se houver callbacks
  if (opcoes.onEditar || opcoes.onDeletar) {
    const thAcoes = document.createElement('th');
    thAcoes.textContent = 'Ações';
    trHead.appendChild(thAcoes);
  }

  thead.appendChild(trHead);
  tabela.appendChild(thead);

  // ---- CORPO ----
  const tbody = document.createElement('tbody');

  dados.forEach((item) => {
    const tr = document.createElement('tr');

    colunas.forEach((col) => {
      const td = document.createElement('td');

      // Se a coluna tem render customizado, usa ele
      if (col.render) {
        const conteudo = col.render(item);
        if (typeof conteudo === 'string') {
          td.innerHTML = conteudo;
        } else {
          td.appendChild(conteudo);
        }
      } else {
        // Valor direto do objeto
        td.textContent = item[col.key] ?? '—';
      }

      tr.appendChild(td);
    });

    // Célula de ações
    if (opcoes.onEditar || opcoes.onDeletar) {
      const tdAcoes = document.createElement('td');
      tdAcoes.style.whiteSpace = 'nowrap';

      if (opcoes.onEditar) {
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-secondary';
        btnEditar.textContent = 'Editar';
        btnEditar.style.marginRight = '6px';
        btnEditar.addEventListener('click', (e) => {
          e.stopPropagation();
          opcoes.onEditar(item);
        });
        tdAcoes.appendChild(btnEditar);
      }

      if (opcoes.onDeletar) {
        const btnDeletar = document.createElement('button');
        btnDeletar.className = 'btn-danger';
        btnDeletar.textContent = 'Excluir';
        btnDeletar.addEventListener('click', (e) => {
          e.stopPropagation();
          opcoes.onDeletar(item);
        });
        tdAcoes.appendChild(btnDeletar);
      }

      tr.appendChild(tdAcoes);
    }

    tbody.appendChild(tr);
  });

  tabela.appendChild(tbody);
  return tabela;
}

// =============================================
// HELPERS DE RENDER — badges prontos para usar
// =============================================

// Badge de status de bombeiro
function badgeStatusBombeiro(item) {
  const mapa = {
    ativo:      { classe: 'badge-success', label: 'Ativo' },
    de_folga:   { classe: 'badge-warning', label: 'De folga' },
    inativo:    { classe: 'badge-muted',   label: 'Inativo' },
  };
  const { classe, label } = mapa[item.status] ?? { classe: 'badge-muted', label: item.status };
  return `<span class="badge ${classe}">${label}</span>`;
}

// Badge de status de viatura
function badgeStatusViatura(item) {
  const mapa = {
    disponivel:     { classe: 'badge-success', label: 'Disponível' },
    em_atendimento: { classe: 'badge-danger',  label: 'Em atendimento' },
    em_manutencao:  { classe: 'badge-warning', label: 'Em manutenção' },
    inativa:        { classe: 'badge-muted',   label: 'Inativa' },
  };
  const { classe, label } = mapa[item.status] ?? { classe: 'badge-muted', label: item.status };
  return `<span class="badge ${classe}">${label}</span>`;
}

// Badge de status de equipamento
function badgeStatusEquipamento(item) {
  const mapa = {
    disponivel:    { classe: 'badge-success', label: 'Disponível' },
    em_uso:        { classe: 'badge-info',    label: 'Em uso' },
    em_manutencao: { classe: 'badge-warning', label: 'Em manutenção' },
    inativo:       { classe: 'badge-muted',   label: 'Inativo' },
  };
  const { classe, label } = mapa[item.status] ?? { classe: 'badge-muted', label: item.status };
  return `<span class="badge ${classe}">${label}</span>`;
}

// Badge de patente do bombeiro
function badgePatente(item) {
  const mapa = {
    coronel:        'badge-danger',
    tenente_coronel:'badge-danger',
    major:          'badge-warning',
    capitao:        'badge-warning',
    tenente:        'badge-info',
    sargento:       'badge-info',
    cabo:           'badge-muted',
    soldado:        'badge-muted',
  };
  const classe = mapa[item.patente] ?? 'badge-muted';
  const label  = item.patente?.replace('_', ' ') ?? '—';
  return `<span class="badge ${classe}" style="text-transform:capitalize">${label}</span>`;
}
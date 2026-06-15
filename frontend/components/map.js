// =============================================
// MAPA DE OCORRÊNCIAS — Leaflet.js
// =============================================

// Instância do mapa (exportada para outros módulos poderem recentrar)
let mapaOcorrencias = null;

// Cores dos pins por prioridade
const COR_PRIORIDADE = {
  critica: '#e74c3c',
  alta:    '#e67e22',
  media:   '#f1c40f',
  baixa:   '#2ecc71',
};

// Rótulos legíveis para exibir no popup
const LABEL_TIPO = {
  incendio:  '🔥 Incêndio',
  acidente:  '🚗 Acidente',
  resgate:   '🚁 Resgate',
  inundacao: '🌊 Inundação',
  outros:    '📋 Outros',
};

const LABEL_PRIORIDADE = {
  critica: 'Crítica',
  alta:    'Alta',
  media:   'Média',
  baixa:   'Baixa',
};

const LABEL_STATUS = {
  aberta:       'Aberta',
  em_andamento: 'Em andamento',
  encerrada:    'Encerrada',
};

// =============================================
// INICIALIZAÇÃO DO MAPA
// =============================================

function inicializarMapa() {
  // Centro em Brasília — Esplanada dos Ministérios
  mapaOcorrencias = L.map('map').setView([-15.7998, -47.8645], 11);

  // Tile layer — OpenStreetMap (gratuito, sem API key)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(mapaOcorrencias);

  // Carrega os pins
  carregarPinsOcorrencias();
}

// =============================================
// PINS DAS OCORRÊNCIAS
// =============================================

async function carregarPinsOcorrencias() {
  try {
    const ocorrencias = await Ocorrencias.listar();

    // Filtra apenas as que têm coordenadas no endereço
    const comCoordenadas = ocorrencias.filter(
      (oc) => oc.endereco?.latitude && oc.endereco?.longitude
    );

    // Atualiza o contador no painel
    const mapCount = document.getElementById('map-count');
    if (mapCount) {
      mapCount.textContent = `${comCoordenadas.length} ocorrência(s)`;
    }

    // Plota cada ocorrência no mapa
    comCoordenadas.forEach((oc) => adicionarPin(oc));

  } catch (erro) {
    showToast('Erro ao carregar ocorrências no mapa.', 'error');
  }
}

// =============================================
// PIN INDIVIDUAL
// =============================================

function adicionarPin(ocorrencia) {
  const { latitude, longitude } = ocorrencia.endereco;
  const cor = COR_PRIORIDADE[ocorrencia.prioridade] ?? '#8b90a0';

  // Ícone circular colorido por prioridade
  const icone = L.divIcon({
    className: '',
    html: `
      <div style="
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: ${cor};
        border: 2px solid #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,0.5);
      "></div>
    `,
    iconSize:   [16, 16],
    iconAnchor: [8, 8],
  });

  const marker = L.marker([latitude, longitude], { icon: icone });

  // Popup com detalhes da ocorrência
  marker.bindPopup(montarPopup(ocorrencia));

  marker.addTo(mapaOcorrencias);
}

// =============================================
// POPUP HTML
// =============================================

function montarPopup(oc) {
  const tipo       = LABEL_TIPO[oc.tipo]             ?? oc.tipo;
  const prioridade = LABEL_PRIORIDADE[oc.prioridade] ?? oc.prioridade;
  const status     = LABEL_STATUS[oc.status]         ?? oc.status;
  const endereco   = oc.endereco;

  const badgeStatusCor = {
    aberta:       '#e67e22',
    em_andamento: '#2980b9',
    encerrada:    '#27ae60',
  }[oc.status] ?? '#8b90a0';

  return `
    <div class="popup-tipo">${tipo}</div>
    <div class="popup-desc">${oc.descricao}</div>
    <div class="popup-meta">
      <span class="badge badge-${oc.prioridade === 'critica' ? 'critica' : oc.prioridade}">
        ${prioridade}
      </span>
      <span style="
        display: inline-block;
        padding: 2px 8px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        background: ${badgeStatusCor}22;
        color: ${badgeStatusCor};
      ">${status}</span>
    </div>
    ${endereco ? `
      <div style="margin-top: 8px; font-size: 11px; color: #8b90a0;">
        📍 ${endereco.logradouro}, ${endereco.bairro}
      </div>
    ` : ''}
    ${oc.num_vitimas > 0 ? `
      <div style="margin-top: 4px; font-size: 11px; color: #e74c3c;">
        ⚠ ${oc.num_vitimas} vítima(s)
      </div>
    ` : ''}
  `;
}
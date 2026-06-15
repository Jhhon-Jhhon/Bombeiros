// =============================================
// MODAL — janela de formulários
// =============================================

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle   = document.getElementById('modal-title');
const modalBody    = document.getElementById('modal-body');
const modalClose   = document.getElementById('modal-close');

// Abre o modal com título e conteúdo HTML dinâmico
function openModal(titulo, htmlConteudo) {
  modalTitle.textContent = titulo;
  modalBody.innerHTML    = htmlConteudo;
  modalOverlay.classList.remove('hidden');
}

// Fecha o modal e limpa o conteúdo
function closeModal() {
  modalOverlay.classList.add('hidden');
  modalTitle.textContent = '';
  modalBody.innerHTML    = '';
}

// Fecha ao clicar no botão ×
modalClose.addEventListener('click', closeModal);

// Fecha ao clicar fora do modal (no overlay escuro)
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Fecha ao pressionar Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
// =============================================
// TOAST — notificações temporárias
// =============================================

function showToast(mensagem, tipo = 'info') {
  const container = document.getElementById('toast-container');

  // Cria o elemento do toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;

  // Ícone de acordo com o tipo
  const icones = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
  };

  toast.innerHTML = `
    <span class="toast-icon">${icones[tipo] ?? 'ℹ'}</span>
    <span class="toast-msg">${mensagem}</span>
  `;

  // Adiciona ao container
  container.appendChild(toast);

  // Remove após 3 segundos com fade
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
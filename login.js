
document.getElementById('loginForm').addEventListener('submit', function(event) {
  event.preventDefault();
  
  const usuario = document.getElementById('usuario').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const errorDiv = document.getElementById('loginError');
  const loading = document.getElementById('loadingOverlay');
  
  errorDiv.classList.add('hidden');
  loading.classList.remove('hidden');

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ acao: 'login', usuario: usuario, senha: senha })
  })
  .then(response => response.json())
  .then(resposta => {
    loading.classList.add('hidden');
    if (resposta.success) {
      // Salva os dados e Redireciona para o painel
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(resposta.user));
      window.location.href = 'guapuasys.html';
    } else {
      errorDiv.textContent = resposta.message;
      errorDiv.classList.remove('hidden');
    }
  })
  .catch(erro => {
    loading.classList.add('hidden');
    errorDiv.textContent = 'Erro ao conectar ao servidor.';
    errorDiv.classList.remove('hidden');
  });
});
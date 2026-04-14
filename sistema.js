// --- INICIALIZAÇÃO E SESSÃO ---
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(sessionStorage.getItem(SESSION_KEY));
  document.getElementById('userNameDisplay').textContent = user.usuario;
  document.getElementById('userProfileDisplay').textContent = user.perfil;
});

function showLoading() { document.getElementById('loadingOverlay').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.add('hidden'); }

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = 'loginguapua.html';
}

// --- NAVEGAÇÃO ENTRE ABAS ---
function navigate(pageName, element) {
  document.querySelectorAll('#menuList li').forEach(i => i.classList.remove('active'));
  element.classList.add('active');
  document.getElementById('pageTitle').textContent = element.textContent.trim();
  document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
  document.getElementById('content-' + pageName).classList.remove('hidden');

  // Se entrou na aba de Pedidos, busca os dados da planilha
  if (pageName === 'Pedidos') { carregarDadosPedido(); }
  if (pageName === 'Clientes') { carregarListaCRM(); voltarListaCRM(); }
  if (pageName === 'Compras') { carregarFornecedor(); }  

}

// --- MÓDULO DE PEDIDOS ---
let listaProdutosMemoria = [];
let carrinhoItens = [];

function carregarDadosPedido() {
  showLoading();
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'getDadosPedido' }) })
    .then(r => r.json()).then(res => {
      hideLoading();
      if(res.success) {
        document.getElementById('listaClientes').innerHTML = res.clientes.map(c => `<option value="${c}">`).join('');
        document.getElementById('listaProdutos').innerHTML = res.produtos.map(p => `<option value="${p.nome}">`).join('');
        listaProdutosMemoria = res.produtos;
      }
    }).catch(() => hideLoading());
}

function buscarPrecoProduto() {
  const nome = document.getElementById('pedProdutoNome').value;
  const prod = listaProdutosMemoria.find(p => p.nome === nome);
  document.getElementById('pedProdutoPreco').value = prod ? prod.preco.toFixed(2) : '';
}

function adicionarItem() {
  const nome = document.getElementById('pedProdutoNome').value;
  const qtd = parseFloat(document.getElementById('pedProdutoQtd').value) || 1;
  const preco = parseFloat(document.getElementById('pedProdutoPreco').value);

  if (!nome || !preco) return alert('Selecione um produto válido.');

  carrinhoItens.push({ nome, qtd, preco, subtotal: qtd * preco });
  
  document.getElementById('pedProdutoNome').value = '';
  document.getElementById('pedProdutoQtd').value = '1';
  document.getElementById('pedProdutoPreco').value = '';
  
  atualizarTabela();
}

function removerItem(index) {
  carrinhoItens.splice(index, 1);
  atualizarTabela();
}

function atualizarTabela() {
  const tbody = document.getElementById('tabelaCorpo');
  tbody.innerHTML = carrinhoItens.map((i, idx) => `
    <tr>
      <td>${i.nome}</td><td>${i.qtd}</td>
      <td>R$ ${i.preco.toFixed(2)}</td><td>R$ ${i.subtotal.toFixed(2)}</td>
      <td><button class="btn-remover" onclick="removerItem(${idx})">X</button></td>
    </tr>
  `).join('');
  calcularTotal();
}

function calcularTotal() {
  let somaItens = carrinhoItens.reduce((acc, i) => acc + i.subtotal, 0);
  let desconto = parseFloat(document.getElementById('pedDesconto').value) || 0;
  let frete = parseFloat(document.getElementById('pedFrete').value) || 0;
  
  let total = somaItens - desconto + frete;
  document.getElementById('pedTotalValor').innerText = total.toFixed(2);
  return total;
}

function gerarResumo() {
  if(carrinhoItens.length === 0) return alert('Adicione produtos primeiro.');
  const cliente = document.getElementById('pedCliente').value || 'Cliente não informado';
  const total = calcularTotal();
  const pagto = document.getElementById('pedPagamento').value;
  const envio = document.getElementById('pedEnvio').value;
  
  let texto = `*Resumo do Pedido - Guapuã Sys*\nData: ${new Date().toLocaleDateString('pt-BR')}\nCliente: *${cliente}*\n\n*Itens:*\n`;
  carrinhoItens.forEach(i => { texto += `- ${i.qtd}x ${i.nome} (R$ ${i.subtotal.toFixed(2)})\n`; });
  
  texto += `\nSubtotal: R$ ${carrinhoItens.reduce((a, b) => a + b.subtotal, 0).toFixed(2)}`;
  texto += `\nDesconto: R$ ${document.getElementById('pedDesconto').value || '0.00'}`;
  texto += `\nFrete (${envio}): R$ ${document.getElementById('pedFrete').value || '0.00'}`;
  texto += `\n\n*TOTAL: R$ ${total.toFixed(2)}*\nPagamento: ${pagto}`;
  
  document.getElementById('textoResumo').value = texto;
  document.getElementById('modalResumo').classList.remove('hidden');
}

function fecharModal() { document.getElementById('modalResumo').classList.add('hidden'); }
function copiarResumo() {
  const textarea = document.getElementById('textoResumo');
  textarea.select();
  document.execCommand('copy');
  alert('Resumo copiado!');
}

function salvarPedidoCompleto() {
  if(carrinhoItens.length === 0) return alert('Adicione produtos ao pedido.');
  if(!document.getElementById('pedCliente').value) return alert('Informe o cliente.');

  showLoading();
  const pedido = {
    cliente: document.getElementById('pedCliente').value,
    status: document.getElementById('pedStatus').value,
    itens: carrinhoItens,
    desconto: parseFloat(document.getElementById('pedDesconto').value) || 0,
    frete: parseFloat(document.getElementById('pedFrete').value) || 0,
    envio: document.getElementById('pedEnvio').value,
    pagamento: document.getElementById('pedPagamento').value,
    rastreio: document.getElementById('pedRastreio').value,
    obs: document.getElementById('pedObs').value,
    total: calcularTotal()
  };

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ acao: 'salvarPedido', pedido: pedido })
  })
  .then(r => r.json()).then(res => {
    hideLoading();
    if(res.success) {
      alert('Pedido ' + res.numeroPedido + ' salvo com sucesso!');
      window.location.reload(); 
    } else { alert('Erro: ' + res.message); }
  }).catch(() => { hideLoading(); alert('Erro de conexão.'); });
}

// --- MÓDULO CRM: LISTA E FICHA ---

// Atualize sua função navigate() lá em cima para incluir isso:
// if (pageName === 'Clientes') { carregarListaCRM(); voltarListaCRM(); }

let listaCrmOriginal = []; // Guarda a lista para o filtro de busca

function carregarListaCRM() {
  showLoading();
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'getListaClientes' }) })
    .then(r => r.json()).then(res => {
      hideLoading();
      if(res.success) {
        listaCrmOriginal = res.clientes;
        renderizarTabelaCRM(listaCrmOriginal);
      }
    }).catch(() => hideLoading());
}

function renderizarTabelaCRM(lista) {
  const tbody = document.getElementById('crmTabelaCorpo');
  tbody.innerHTML = lista.map(c => `
    <tr>
      <td><strong>${c.nome}</strong></td>
      <td>${c.area}</td>
      <td>${c.cidade}</td>
      <td>${c.ultimaCompra}</td>
      <td>R$ ${c.totalGasto.toFixed(2)}</td>
      <td><button class="btn-secundary" onclick="abrirFichaCliente('${c.nome}')">👁️ Ver Ficha</button></td>
    </tr>
  `).join('');
}

function filtrarTabelaClientes() {
  const termo = document.getElementById('filtroClientes').value.toLowerCase();
  const filtrados = listaCrmOriginal.filter(c => 
    c.nome.toLowerCase().includes(termo) || 
    c.cidade.toLowerCase().includes(termo) ||
    c.area.toLowerCase().includes(termo)
  );
  renderizarTabelaCRM(filtrados);
}

function abrirFichaCliente(nome) {
  showLoading();
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'getFichaCliente', nomeCliente: nome }) })
    .then(r => r.json()).then(res => {
      hideLoading();
      if(res.success) {
        const c = res.cadastro;
        // Preenche Cadastro
        document.getElementById('fichaNome').textContent = c.nome;
        document.getElementById('fichaNasc').textContent = c.nascimento || '-';
        document.getElementById('fichaCpf').textContent = c.cpf || '-';
        document.getElementById('fichaArea').textContent = c.area || '-';
        document.getElementById('fichaEmail').textContent = c.email || '-';
        document.getElementById('fichaFone').textContent = c.fone || '-';
        
        document.getElementById('fichaRua').textContent = c.rua || '-';
        document.getElementById('fichaNum').textContent = c.numero || '-';
        document.getElementById('fichaComp').textContent = c.comp || '';
        document.getElementById('fichaBairroCep').textContent = c.cep || '-';
        document.getElementById('fichaCidade').textContent = c.cidade || '-';
        document.getElementById('fichaUf').textContent = c.uf || '-';
        document.getElementById('fichaObs').value = c.obs || 'Nenhuma observação.';
        
        // Preenche Ranking
        const ulRank = document.getElementById('fichaRanking');
        if (res.ranking.length === 0) {
          ulRank.innerHTML = '<li>Nenhum produto comprado ainda.</li>';
        } else {
          ulRank.innerHTML = res.ranking.map(r => `<li>${r.nome} <span class="qtd">${r.qtd}x</span></li>`).join('');
        }

        // Preenche Histórico
        const tbHist = document.getElementById('fichaHistoricoTabela');
        if (res.historico.length === 0) {
          tbHist.innerHTML = '<tr><td colspan="4">Nenhum pedido encontrado.</td></tr>';
        } else {
          tbHist.innerHTML = res.historico.map(h => `
            <tr>
              <td>${h.data}</td><td>${h.numero}</td>
              <td>R$ ${h.total.toFixed(2)}</td>
              <td><span class="badge" style="background:#fff;border:1px solid #ccc;">${h.status}</span></td>
            </tr>
          `).join('');
        }

        // Troca as telas
        document.getElementById('crm-lista').classList.add('hidden');
        document.getElementById('crm-ficha').classList.remove('hidden');
      }
    }).catch(() => hideLoading());
}

function voltarListaCRM() {
  document.getElementById('crm-ficha').classList.add('hidden');
  document.getElementById('crm-lista').classList.remove('hidden');
}

// Ação Inteligente: Botão "Novo Pedido" direto da Ficha
function criarPedidoParaCliente() {
  const nomeCliente = document.getElementById('fichaNome').textContent;
  
  // Muda para a aba de Pedidos
  const abaPedidos = Array.from(document.querySelectorAll('#menuList li')).find(li => li.textContent.includes('Pedidos'));
  navigate('Pedidos', abaPedidos);
  
  // Aguarda 1 segundo para a API carregar os clientes e então pré-seleciona
  setTimeout(() => {
    document.getElementById('pedCliente').value = nomeCliente;
  }, 1200);
}

// --- MÓDULO FINANCEIRO ---

let listaFinanceiraOriginal = [];

function carregarFinanceiro() {
  showLoading();
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'getFinanceiro' }) })
    .then(r => r.json()).then(res => {
      hideLoading();
      if(res.success) {
        listaFinanceiraOriginal = res.financeiro;
        renderizarFinanceiro(listaFinanceiraOriginal);
        calcularCardsResumo(listaFinanceiraOriginal);
      }
    }).catch(() => hideLoading());
}

function getClasseStatus(status) {
  if (status === 'PAGO') return 'status-pago';
  if (status === 'AGUARDANDO PAGAMENTO') return 'status-aguardando';
  if (status === 'ORÇAMENTO') return 'status-orcamento';
  if (status === 'ENVIADO') return 'status-enviado';
  if (status === 'CANCELADO') return 'status-cancelado';
  return '';
}

function renderizarFinanceiro(lista) {
  const tbody = document.getElementById('tabelaFinanceiroCorpo');
  let dataAnterior = ''; // Para o agrupamento visual por dia

  tbody.innerHTML = lista.map(item => {
    // Pega apenas a parte da data (dd/mm/aaaa) tirando a hora
    const dataCurta = item.data ? item.data.split(' ')[0] : '';
    let separador = '';
    
    // Se mudou o dia, insere uma linha de separação visual cinza claro
    if (dataCurta !== dataAnterior && dataCurta !== '') {
      separador = `<tr style="background-color: var(--off-white);"><td colspan="7" style="padding:4px 12px; font-size:0.8em; color:var(--text-muted); font-weight:bold;">📅 ${dataCurta}</td></tr>`;
      dataAnterior = dataCurta;
    }

    return separador + `
      <tr>
        <td style="font-size:0.9em; color:var(--text-muted);">${item.data}</td>
        <td><strong>${item.numero}</strong></td>
        <td>${item.cliente}</td>
        <td style="font-size:0.9em;">${item.pagamento}</td>
        <td><strong>R$ ${item.total.toFixed(2)}</strong></td>
        <td><span class="badge-status ${getClasseStatus(item.status)}">${item.status}</span></td>
        <td>
          <select class="select-tabela" onchange="alterarStatusPedido('${item.numero}', this.value)">
            <option value="">Alterar...</option>
            <option value="PAGO">Pago</option>
            <option value="AGUARDANDO PAGAMENTO">Aguardando</option>
            <option value="ENVIADO">Enviado</option>
            <option value="CANCELADO">Cancelar</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

// Filtro Combinado (Texto + Select)
function filtrarFinanceiro() {
  const busca = document.getElementById('filtroFinBusca').value.toLowerCase();
  const statusFiltro = document.getElementById('filtroFinStatus').value;

  const filtrados = listaFinanceiraOriginal.filter(item => {
    const matchBusca = item.cliente.toLowerCase().includes(busca) || item.numero.toLowerCase().includes(busca);
    const matchStatus = (statusFiltro === 'TODOS') || (item.status === statusFiltro);
    return matchBusca && matchStatus;
  });

  renderizarFinanceiro(filtrados);
}

// Calcula os totais dos 4 cards superiores
function calcularCardsResumo(lista) {
  let totPago = 0, totAguardando = 0, totOrcamento = 0, totMes = 0;
  
  // Pega o Mês e Ano atual no formato MM/AAAA (ex: 04/2026)
  const dataAtual = new Date();
  const mesAnoAtual = ('0' + (dataAtual.getMonth() + 1)).slice(-2) + '/' + dataAtual.getFullYear();

  lista.forEach(item => {
    if (item.status === 'PAGO' || item.status === 'ENVIADO') totPago += item.total;
    if (item.status === 'AGUARDANDO PAGAMENTO') totAguardando += item.total;
    if (item.status === 'ORÇAMENTO') totOrcamento += item.total;

    // Se o pedido tiver uma data válida e contiver o mês/ano atual, e não for cancelado nem orçamento
    if (item.data && item.data.includes(mesAnoAtual) && item.status !== 'CANCELADO' && item.status !== 'ORÇAMENTO') {
      totMes += item.total;
    }
  });

  document.getElementById('cardPago').textContent = 'R$ ' + totPago.toFixed(2);
  document.getElementById('cardAguardando').textContent = 'R$ ' + totAguardando.toFixed(2);
  document.getElementById('cardOrcamento').textContent = 'R$ ' + totOrcamento.toFixed(2);
  document.getElementById('cardMes').textContent = 'R$ ' + totMes.toFixed(2);
}

// Função para atualizar o status no Google Sheets direto pela tabela
function alterarStatusPedido(numPedido, novoStatus) {
  if (!novoStatus) return; // Se escolheu "Alterar...", não faz nada
  
  if(confirm(`Tem certeza que deseja mudar o pedido ${numPedido} para ${novoStatus}?`)) {
    showLoading();
    
    fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ acao: 'atualizarStatusPedido', numPedido: numPedido, novoStatus: novoStatus })
    })
    .then(r => r.json()).then(res => {
      if(res.success) {
        // Recarrega os dados do Financeiro para atualizar tabela e cards
        carregarFinanceiro();
      } else {
        hideLoading();
        alert('Erro ao atualizar: ' + res.message);
      }
    }).catch(() => {
      hideLoading();
      alert('Erro de conexão ao atualizar status.');
    });
  } else {
    // Se cancelou, volta o select para a posição original ("Alterar...")
    carregarFinanceiro(); 
  }
}
// --- MÓDULO COMPRAS (FORNECEDOR) ---

let listaFornecedorMemoria = [];
let carrinhoCompra = [];

function carregarFornecedor() {
  showLoading();
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'getProdutosFornecedor' }) })
    .then(r => r.json()).then(res => {
      hideLoading();
      if(res.success) {
        listaFornecedorMemoria = res.produtosFornecedor;
        document.getElementById('listaProdutosFornecedor').innerHTML = 
          listaFornecedorMemoria.map(p => `<option value="${p.nome}">`).join('');
      }
    }).catch(() => hideLoading());
}

function buscarPrecoCompra() {
  const nome = document.getElementById('compraProdNome').value;
  const prod = listaFornecedorMemoria.find(p => p.nome === nome);
  document.getElementById('compraProdPreco').value = prod ? prod.valorCompra.toFixed(2) : '';
}

function adicionarItemCompra() {
  const nome = document.getElementById('compraProdNome').value;
  const qtd = parseFloat(document.getElementById('compraProdQtd').value) || 1;
  const preco = parseFloat(document.getElementById('compraProdPreco').value);

  if (!nome || !preco) return alert('Selecione um produto válido da lista de fornecedores.');

  carrinhoCompra.push({ nome, qtd, preco, subtotal: qtd * preco });
  
  document.getElementById('compraProdNome').value = '';
  document.getElementById('compraProdQtd').value = '1';
  document.getElementById('compraProdPreco').value = '';
  
  atualizarTabelaCompra();
}

function removerItemCompra(index) {
  carrinhoCompra.splice(index, 1);
  atualizarTabelaCompra();
}

function atualizarTabelaCompra() {
  const tbody = document.getElementById('tabelaCompraCorpo');
  let total = 0;

  tbody.innerHTML = carrinhoCompra.map((i, idx) => {
    total += i.subtotal;
    return `
      <tr>
        <td>${i.nome}</td><td>${i.qtd}</td>
        <td>R$ ${i.preco.toFixed(2)}</td><td>R$ ${i.subtotal.toFixed(2)}</td>
        <td><button class="btn-remover" onclick="removerItemCompra(${idx})">X</button></td>
      </tr>
    `;
  }).join('');
  
  document.getElementById('compraTotalValor').innerText = total.toFixed(2);
  return total;
}

// Modal Formardado para o Fornecedor
function gerarResumoCompra() {
  if(carrinhoCompra.length === 0) return alert('Adicione produtos à lista de compra.');
  
  const total = carrinhoCompra.reduce((acc, i) => acc + i.subtotal, 0);
  const obs = document.getElementById('compraObs').value;
  
  let texto = `*Pedido de Compra - Guapuã Sys*\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n*Itens Solicitados:*\n`;
  
  carrinhoCompra.forEach(i => {
    texto += `- ${i.qtd}x ${i.nome} (Custo Unit: R$ ${i.preco.toFixed(2)})\n`;
  });
  
  texto += `\n*CUSTO TOTAL: R$ ${total.toFixed(2)}*`;
  if(obs) texto += `\n\nObservações: ${obs}`;
  
  document.getElementById('textoResumoCompra').value = texto;
  document.getElementById('modalCompra').classList.remove('hidden');
}

function fecharModalCompra() { document.getElementById('modalCompra').classList.add('hidden'); }

function copiarResumoCompra() {
  const textarea = document.getElementById('textoResumoCompra');
  textarea.select();
  document.execCommand('copy');
  alert('Lista de Compra copiada! Pode colar no WhatsApp do Fornecedor.');
}

function salvarPedidoCompra() {
  if(carrinhoCompra.length === 0) return alert('A lista de compras está vazia.');

  showLoading();
  const compra = {
    itens: carrinhoCompra,
    obs: document.getElementById('compraObs').value,
    total: carrinhoCompra.reduce((acc, i) => acc + i.subtotal, 0)
  };

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ acao: 'salvarPedidoCompra', compra: compra })
  })
  .then(r => r.json()).then(res => {
    hideLoading();
    if(res.success) {
      alert(`Pedido ${res.numeroCompra} salvo no Histórico de Compras!`);
      // Limpa os dados
      carrinhoCompra = [];
      document.getElementById('compraObs').value = '';
      atualizarTabelaCompra();
    } else { alert('Erro: ' + res.message); }
  }).catch(() => { hideLoading(); alert('Erro de conexão ao salvar compra.'); });
}

// --- MÓDULO ERP ---

let erpProdutosMemoria = [];
let erpMaxQtdRanking = 1;

// Adicione isso no seu navigate() se o pageName for Configuracoes:
// if (pageName === 'Configuracoes') { carregarDadosERP(); }

function mudarTabERP(tabId, btnElement) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  btnElement.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

function carregarDadosERP() {
  showLoading();
  fetch(API_URL, { method: 'POST', body: JSON.stringify({ acao: 'getDadosERP' }) })
    .then(r => r.json()).then(res => {
      hideLoading();
      if(res.success) {
        erpProdutosMemoria = res.produtos;
        erpMaxQtdRanking = res.maxQtd || 1; // Previne divisão por zero
        
        renderizarTabelaProdutosERP(erpProdutosMemoria);
        renderizarRankingERP(res.ranking);
      }
    }).catch(() => hideLoading());
}

function renderizarTabelaProdutosERP(lista) {
  const tbody = document.getElementById('erpTabelaProdutosCorpo');
  tbody.innerHTML = lista.map(p => {
    let badge = p.ativo === 'Sim' ? '<span class="badge-status status-pago">Ativo</span>' : '<span class="badge-status status-cancelado">Inativo</span>';
    return `
      <tr>
        <td>${p.codigo}</td>
        <td><strong>${p.nome}</strong></td>
        <td>${p.categoria}</td>
        <td style="color: var(--blue-dark); font-weight: bold;">R$ ${p.valorProfissional.toFixed(2)}</td>
        <td>R$ ${p.valorFinal.toFixed(2)}</td>
        <td>${badge}</td>
        <td><button class="btn-secundary" onclick="alert('Edição em breve!')">Editar</button></td>
      </tr>
    `;
  }).join('');
}

function filtrarProdutosERP() {
  const termo = document.getElementById('filtroProdutoERP').value.toLowerCase();
  const filtrados = erpProdutosMemoria.filter(p => p.nome.toLowerCase().includes(termo));
  renderizarTabelaProdutosERP(filtrados);
}

function renderizarRankingERP(ranking) {
  const tbody = document.getElementById('erpTabelaRankingCorpo');
  if (ranking.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhuma venda registrada ainda.</td></tr>';
    return;
  }

  tbody.innerHTML = ranking.map(r => {
    // Calcula a % da barra baseada no produto mais vendido
    let porcentagem = (r.qtd / erpMaxQtdRanking) * 100;
    
    return `
      <tr>
        <td><strong>${r.nome}</strong></td>
        <td>
          <div class="barra-fundo">
            <div class="barra-preenchimento" style="width: ${porcentagem}%"></div>
          </div>
        </td>
        <td style="text-align: center;"><span class="badge" style="background:var(--blue-dark); color:#fff;">${r.qtd}x</span></td>
        <td style="text-align: right; color: var(--blue-dark); font-weight: bold;">R$ ${r.receita.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
}

// --- CADASTRO DE CLIENTE (VIACEP) ---
function buscarCep(cep) {
  const limpo = cep.replace(/\D/g, '');
  if (limpo.length !== 8) return;
  
  fetch(`https://viacep.com.br/ws/${limpo}/json/`)
    .then(r => r.json())
    .then(dados => {
      if (!dados.erro) {
        document.getElementById('cadCliRua').value = dados.logradouro;
        document.getElementById('cadCliCidade').value = dados.localidade;
        document.getElementById('cadCliUf').value = dados.uf;
        document.getElementById('cadCliNum').focus(); // Joga o cursor para o número
      }
    });
}

function salvarNovoCliente(event) {
  event.preventDefault();
  showLoading();

  const cliente = {
    nome: document.getElementById('cadCliNome').value,
    cpf: document.getElementById('cadCliCpf').value,
    nascimento: document.getElementById('cadCliNasc').value,
    fone: document.getElementById('cadCliFone').value,
    email: document.getElementById('cadCliEmail').value,
    area: document.getElementById('cadCliArea').value,
    cep: document.getElementById('cadCliCep').value,
    rua: document.getElementById('cadCliRua').value,
    numero: document.getElementById('cadCliNum').value,
    comp: document.getElementById('cadCliComp').value,
    cidade: document.getElementById('cadCliCidade').value,
    uf: document.getElementById('cadCliUf').value,
    obs: document.getElementById('cadCliObs').value
  };

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ acao: 'salvarCliente', cliente: cliente })
  })
  .then(r => r.json()).then(res => {
    hideLoading();
    if(res.success) {
      alert(res.message);
      document.getElementById('formNovoCliente').reset();
      
      // Atualiza a lista de clientes em memória se o usuário for para a aba CRM depois
      if (typeof carregarListaCRM === 'function') carregarListaCRM();
    } else {
      alert('Erro: ' + res.message);
    }
  }).catch(() => { hideLoading(); alert('Erro ao salvar.'); });
}
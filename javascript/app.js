// ---------- FUNÇÃO DE PROTEÇÃO DE PÁGINA ----------
// Chame esta função no topo de dashboard.html, agenda.html e clientes.html.
// Se o usuário não estiver logado, redireciona para login.html.

  new window.VLibras.Widget('https://vlibras.gov.br');

function exigirLogin() {
  const dados = localStorage.getItem('usuarioLogado');
  if (!dados) {
    window.location.href = 'login.html';
    return null;
  }
  return JSON.parse(dados);
}

// ---------- LOGIN ----------
const formLogin = document.getElementById('form-login');

if (formLogin) {
  formLogin.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const erro = document.getElementById('mensagem-erro');
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;

    erro.classList.remove('visivel');

    if (!email || !emailRegex.test(email)) {
      erro.textContent = 'Informe um e-mail válido.';
      erro.classList.add('visivel');
      return;
    }

    if (!senha || !passwordRegex.test(senha)) {
      erro.textContent = 'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula e um número.';
      erro.classList.add('visivel');
      return;
    }

    const usuario = {
      email: email,
      nome: email.split('@')[0]
    };

    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    window.location.href = 'dashboard.html';
  });
}


// ---------- DASHBOARD ----------
const listaAgendamentos = document.getElementById('lista-agendamentos');

if (listaAgendamentos) {
  const usuario = exigirLogin();

  if (usuario) {
    document.getElementById('saudacao').textContent =
      'Bem-vindo de volta, ' + usuario.nome + '.';

    function lerAgendamentosDashboard() {
      const dados = localStorage.getItem('agendamentos');
      if (!dados) return [];

      const agendamentos = JSON.parse(dados);

      return Object.entries(agendamentos).flatMap(([data, itens]) =>
        (itens || []).map(item => ({
          ...item,
          data
        }))
      ).sort((a, b) => {
        const dataA = new Date(`${a.data}T${a.horario || '00:00'}`);
        const dataB = new Date(`${b.data}T${b.horario || '00:00'}`);
        return dataA - dataB;
      });
    }

    function lerClientesDashboard() {
      const dados = localStorage.getItem('clientes');
      return dados ? JSON.parse(dados) : [];
    }

    function renderDashboard() {
      const agendamentos = lerAgendamentosDashboard();
      const clientes = lerClientesDashboard();
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const hojeEmMs = hoje.getTime();
      const semanaEmMs = 7 * 24 * 60 * 60 * 1000;

      const agendamentosHoje = agendamentos.filter(item => {
        const data = new Date(`${item.data}T${item.horario || '00:00'}`);
        return data >= hoje && data <= new Date(hojeEmMs + 24 * 60 * 60 * 1000);
      }).length;

      const agendamentosSemana = agendamentos.filter(item => {
        const data = new Date(`${item.data}T${item.horario || '00:00'}`);
        const diff = data.getTime() - hojeEmMs;
        return diff >= 0 && diff <= semanaEmMs;
      }).length;

      const contadorHoje = document.querySelectorAll('.card-metrica-valor')[0];
      const contadorSemana = document.querySelectorAll('.card-metrica-valor')[1];
      const contadorClientes = document.querySelectorAll('.card-metrica-valor')[3];

      if (contadorHoje) contadorHoje.textContent = String(agendamentosHoje);
      if (contadorSemana) contadorSemana.textContent = String(agendamentosSemana);
      if (contadorClientes) contadorClientes.textContent = String(clientes.length);

      listaAgendamentos.innerHTML = '';

      const proximos = agendamentos.filter(item => {
        const data = new Date(`${item.data}T${item.horario || '00:00'}`);
        return data >= new Date();
      }).slice(0, 5);

      if (proximos.length === 0) {
        const li = document.createElement('li');
        li.className = 'estado-vazio';
        li.textContent = 'Nenhum agendamento próximo cadastrado.';
        listaAgendamentos.appendChild(li);
        return;
      }

      proximos.forEach(item => {
        const li = document.createElement('li');
        li.className = 'item-agendamento';
        li.innerHTML = `
          <div class="item-agendamento-info">
            <span class="item-agendamento-nome">${item.nome}</span>
            <span class="item-agendamento-servico">${item.servico}</span>
          </div>
          <span class="item-agendamento-horario">${item.data.split('-').reverse().join('/')} · ${item.horario}</span>
        `;
        listaAgendamentos.appendChild(li);
      });
    }

    renderDashboard();

    const btnSair = document.getElementById('btn-sair');
    btnSair.addEventListener('click', () => {
      localStorage.removeItem('usuarioLogado');
      window.location.href = 'login.html';
    });
  }
}

// ---------- AGENDA ----------
const calendarioDias = document.getElementById('calendario-dias');

if (calendarioDias) {
  const usuario = exigirLogin();

  if (usuario) {
    const hoje = new Date();
    let mesAtual = hoje.getMonth();
    let anoAtual = hoje.getFullYear();
    let diaSelecionado = hoje.getDate();
    let modoVisualizacao = 'dia';

    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    function lerAgendamentos() {
      const dados = localStorage.getItem('agendamentos');
      return dados ? JSON.parse(dados) : {};
    }

    function salvarAgendamentos(lista) {
      localStorage.setItem('agendamentos', JSON.stringify(lista));
    }

    function lerClientesAgenda() {
      const dados = localStorage.getItem('clientes');
      return dados ? JSON.parse(dados) : [];
    }

    function salvarClientesAgenda(lista) {
      localStorage.setItem('clientes', JSON.stringify(lista));
    }

    function chaveData(dia, mes, ano) {
      return ano + '-' + String(mes + 1).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
    }

    function dataHojeSemHora() {
      const data = new Date();
      data.setHours(0, 0, 0, 0);
      return data;
    }

    function dataPassou(dia, mes, ano) {
      const data = new Date(ano, mes, dia);
      return data < dataHojeSemHora();
    }

    function preencherSelectClientes() {
      const select = document.getElementById('cliente');
      if (!select) return;

      const clientes = lerClientesAgenda();
      const valorAtual = select.value;
      select.innerHTML = '<option value="">Nenhum cliente selecionado</option>';

      clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = String(cliente.id);
        option.textContent = cliente.nome;
        select.appendChild(option);
      });

      if (valorAtual) {
        select.value = valorAtual;
      }
    }

    function criarItemAgendamento(item, chave, indice) {
      const li = document.createElement('li');
      li.className = 'item-agendamento';

      const mostrarData = modoVisualizacao === 'todos' && item.chave;
      const dataFormatada = mostrarData
        ? item.chave.split('-').reverse().join('/')
        : '';

      li.innerHTML = `
        <div class="item-agendamento-info">
          <span class="item-agendamento-nome">${item.nome}</span>
          <span class="item-agendamento-servico">${item.servico}</span>
        </div>
        <div class="item-agendamento-acao">
          <div class="item-agendamento-meta">
            ${mostrarData ? `<span class="item-agendamento-data">${dataFormatada}</span>` : ''}
            <span class="item-agendamento-horario">${item.horario}</span>
          </div>
          <button type="button" class="btn-acao excluir" data-chave="${chave}" data-indice="${indice}">Excluir</button>
        </div>
      `;

      const botaoExcluir = li.querySelector('.btn-acao.excluir');
      botaoExcluir.addEventListener('click', () => {
        removerAgendamento(chave, Number(botaoExcluir.dataset.indice));
      });

      return li;
    }

    function removerAgendamento(chave, indice) {
      const todos = lerAgendamentos();
      if (!todos[chave]) return;

      todos[chave].splice(indice, 1);

      if (todos[chave].length === 0) {
        delete todos[chave];
      }

      salvarAgendamentos(todos);

      if (modoVisualizacao === 'todos') {
        renderTodosAgendamentos();
      } else {
        renderListaDia();
      }
    }

    function renderCalendario() {
      document.getElementById('calendario-titulo').textContent =
        nomesMeses[mesAtual] + ' ' + anoAtual;

      calendarioDias.innerHTML = '';

      const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
      const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
      const diasMesAnterior = new Date(anoAtual, mesAtual, 0).getDate();

      for (let i = primeiroDia - 1; i >= 0; i--) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'calendario-celula fora-do-mes';
        btn.textContent = diasMesAnterior - i;
        btn.disabled = true;
        calendarioDias.appendChild(btn);
      }

      for (let dia = 1; dia <= diasNoMes; dia++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'calendario-celula';
        btn.textContent = dia;

        const ehHoje = dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
        const passou = dataPassou(dia, mesAtual, anoAtual);

        if (ehHoje) btn.classList.add('hoje');
        if (dia === diaSelecionado) btn.classList.add('selecionado');
        if (passou) {
          btn.disabled = true;
          btn.classList.add('passado');
        }

        btn.addEventListener('click', () => {
          if (passou) return;
          diaSelecionado = dia;
          renderCalendario();
          renderListaDia();
        });

        calendarioDias.appendChild(btn);
      }
    }

    function renderTodosAgendamentos() {
      const lista = document.getElementById('lista-dia');
      const titulo = document.getElementById('titulo-dia');
      const botao = document.getElementById('btn-ver-todos');
      const todos = lerAgendamentos();

      titulo.textContent = 'Todos os agendamentos';
      botao.textContent = 'Voltar ao dia';
      modoVisualizacao = 'todos';

      const agendamentos = Object.entries(todos)
        .flatMap(([chave, itens]) => (itens || []).map((item, indice) => ({ ...item, chave, indice })))
        .sort((a, b) => new Date(`${a.chave}T${a.horario || '00:00'}`) - new Date(`${b.chave}T${b.horario || '00:00'}`));

      lista.innerHTML = '';

      if (agendamentos.length === 0) {
        const vazio = document.createElement('li');
        vazio.className = 'estado-vazio';
        vazio.textContent = 'Nenhum agendamento cadastrado.';
        lista.appendChild(vazio);
        return;
      }

      agendamentos.forEach(item => {
        lista.appendChild(criarItemAgendamento(item, item.chave, item.indice));
      });
    }

    function renderListaDia() {
      const lista = document.getElementById('lista-dia');
      const titulo = document.getElementById('titulo-dia');
      const botao = document.getElementById('btn-ver-todos');
      const chave = chaveData(diaSelecionado, mesAtual, anoAtual);

      titulo.textContent = 'Agendamentos de ' + diaSelecionado + ' de ' + nomesMeses[mesAtual];
      botao.textContent = 'Ver todos';
      modoVisualizacao = 'dia';

  const todos = lerAgendamentos();
const doDia = todos[chave] || [];
doDia.sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));

lista.innerHTML = '';

      if (doDia.length === 0) {
        const vazio = document.createElement('li');
        vazio.className = 'estado-vazio';
        vazio.textContent = 'Nenhum agendamento para este dia.';
        lista.appendChild(vazio);
        return;
      }

      doDia.forEach((item, indice) => {
        lista.appendChild(criarItemAgendamento(item, chave, indice));
      });
    }

    document.getElementById('btn-mes-anterior').addEventListener('click', () => {
      mesAtual--;
      if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
      renderCalendario();
      if (modoVisualizacao === 'todos') {
        renderTodosAgendamentos();
      } else {
        renderListaDia();
      }
    });

    document.getElementById('btn-mes-proximo').addEventListener('click', () => {
      mesAtual++;
      if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
      renderCalendario();
      if (modoVisualizacao === 'todos') {
        renderTodosAgendamentos();
      } else {
        renderListaDia();
      }
    });

    const modal = document.getElementById('modal-fundo');
    const form = document.getElementById('form-agendamento');
    const erroModal = document.getElementById('mensagem-erro-modal');

    function abrirModal() {
      erroModal.classList.remove('visivel');
      form.reset();
      document.getElementById('horario').value = '09:00';
      preencherSelectClientes();
      modal.classList.add('aberto');
    }

    function fecharModal() {
      modal.classList.remove('aberto');
    }

    const selectCliente = document.getElementById('cliente');
    if (selectCliente) {
      selectCliente.addEventListener('change', () => {
        const clienteId = Number(selectCliente.value);
        if (!clienteId) return;

        const clientes = lerClientesAgenda();
        const cliente = clientes.find(item => item.id === clienteId);
        if (cliente) {
          document.getElementById('nome').value = cliente.nome;
        }
      });
    }

    document.getElementById('btn-novo').addEventListener('click', abrirModal);
    document.getElementById('btn-fechar').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar').addEventListener('click', fecharModal);
    document.getElementById('btn-ver-todos').addEventListener('click', () => {
      if (modoVisualizacao === 'todos') {
        modoVisualizacao = 'dia';
        renderListaDia();
      } else {
        renderTodosAgendamentos();
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) fecharModal();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nome = document.getElementById('nome').value.trim();
      const servico = document.getElementById('servico').value.trim();
      const horario = document.getElementById('horario').value;
      const clienteId = Number(document.getElementById('cliente').value || 0);

      erroModal.classList.remove('visivel');

      if (!nome || !servico || !horario) {
        erroModal.textContent = 'Preencha todos os campos.';
        erroModal.classList.add('visivel');
        return;
      }

      const chave = chaveData(diaSelecionado, mesAtual, anoAtual);
      const todos = lerAgendamentos();
      const clientes = lerClientesAgenda();

      if (!todos[chave]) todos[chave] = [];

      todos[chave].push({ nome, servico, horario, clienteId: clienteId || null });
      salvarAgendamentos(todos);

      let clienteEncontrado = null;

      if (clienteId) {
        clienteEncontrado = clientes.find(item => item.id === clienteId);
      }

      if (!clienteEncontrado) {
        clienteEncontrado = clientes.find(item => item.nome.toLowerCase() === nome.toLowerCase());
      }

      if (clienteEncontrado) {
        const indice = clientes.findIndex(item => item.id === clienteEncontrado.id);
        clientes[indice].ultimo = chave;
        salvarClientesAgenda(clientes);
      } else {
        const maiorId = clientes.reduce((max, item) => Math.max(max, item.id || 0), 0);
        clientes.push({
          id: maiorId + 1,
          nome,
          telefone: '',
          email: '',
          ultimo: chave
        });
        salvarClientesAgenda(clientes);
      }

      fecharModal();
      if (modoVisualizacao === 'todos') {
        renderTodosAgendamentos();
      } else {
        renderListaDia();
      }
    });

    document.getElementById('btn-sair').addEventListener('click', () => {
      localStorage.removeItem('usuarioLogado');
      window.location.href = 'login.html';
    });

    renderCalendario();
    renderListaDia();
  }
}


// ---------- CLIENTES ----------
const tabelaCorpo = document.getElementById('tabela-corpo');

if (tabelaCorpo) {
  const usuario = exigirLogin();

  if (usuario) {

    let idEmEdicao = null;

    // ---------- PERSISTÊNCIA ----------
    function lerClientes() {
      const dados = localStorage.getItem('clientes');
      if (dados) return JSON.parse(dados);

      // Semente inicial, na primeira visita
      const iniciais = [
        { id: 1, nome: 'Mariana Silva', telefone: '(11) 91234-5678', email: 'mariana@exemplo.com', ultimo: '2024-10-15' },
        { id: 2, nome: 'Carlos Mendes', telefone: '(11) 92345-6789', email: 'carlos@exemplo.com', ultimo: '2024-10-15' },
        { id: 3, nome: 'Juliana Rocha', telefone: '(11) 93456-7890', email: 'juliana@exemplo.com', ultimo: '2024-10-16' },
        { id: 4, nome: 'Pedro Alves', telefone: '(11) 94567-8901', email: 'pedro@exemplo.com', ultimo: '2024-10-16' },
        { id: 5, nome: 'Beatriz Costa', telefone: '(11) 95678-9012', email: 'beatriz@exemplo.com', ultimo: '2024-10-17' }
      ];
      localStorage.setItem('clientes', JSON.stringify(iniciais));
      return iniciais;
    }

    function salvarClientes(lista) {
      localStorage.setItem('clientes', JSON.stringify(lista));
    }

    function formatarData(iso) {
      if (!iso) return '—';
      const [ano, mes, dia] = iso.split('-');
      return dia + '/' + mes + '/' + ano;
    }

    // ---------- RENDER DA TABELA ----------
    function renderTabela(filtro) {
      const clientes = lerClientes();
      const termo = (filtro || '').toLowerCase().trim();

      const filtrados = termo
        ? clientes.filter(c =>
            c.nome.toLowerCase().includes(termo) ||
            c.email.toLowerCase().includes(termo) ||
            c.telefone.toLowerCase().includes(termo)
          )
        : clientes;

      tabelaCorpo.innerHTML = '';
      const estadoVazio = document.getElementById('estado-vazio');

      if (filtrados.length === 0) {
        estadoVazio.textContent = termo
          ? 'Nenhum cliente encontrado para essa busca.'
          : 'Nenhum cliente cadastrado.';
        estadoVazio.style.display = 'block';
        return;
      }

      estadoVazio.style.display = 'none';

      filtrados.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
  <td data-label="Nome">${c.nome}</td>
  <td data-label="Telefone">${c.telefone || '—'}</td>
  <td data-label="E-mail">${c.email || '—'}</td>
  <td data-label="Último agendamento">${formatarData(c.ultimo)}</td>
  <td class="coluna-acoes">
    <div class="acoes-linha">
      <button type="button" class="btn-acao editar" data-id="${c.id}">Editar</button>
      <button type="button" class="btn-acao excluir" data-id="${c.id}">Excluir</button>
    </div>
  </td>
`;
        tabelaCorpo.appendChild(tr);
      });

      // Delegação de eventos para os botões recém-criados
      tabelaCorpo.querySelectorAll('.editar').forEach(btn => {
        btn.addEventListener('click', () => abrirModalEdicao(Number(btn.dataset.id)));
      });

      tabelaCorpo.querySelectorAll('.excluir').forEach(btn => {
        btn.addEventListener('click', () => excluirCliente(Number(btn.dataset.id)));
      });
    }

    // ---------- MODAL ----------
    const modal = document.getElementById('modal-fundo');
    const form = document.getElementById('form-cliente');
    const erroModal = document.getElementById('mensagem-erro-modal');
    const modalTitulo = document.getElementById('modal-titulo');

    function abrirModalNovo() {
      idEmEdicao = null;
      modalTitulo.textContent = 'Novo cliente';
      form.reset();
      erroModal.classList.remove('visivel');
      modal.classList.add('aberto');
    }

    function abrirModalEdicao(id) {
      const clientes = lerClientes();
      const cliente = clientes.find(c => c.id === id);
      if (!cliente) return;

      idEmEdicao = id;
      modalTitulo.textContent = 'Editar cliente';
      document.getElementById('nome').value = cliente.nome;
      document.getElementById('telefone').value = cliente.telefone;
      document.getElementById('email').value = cliente.email;
      erroModal.classList.remove('visivel');
      modal.classList.add('aberto');
    }

    function fecharModal() {
      modal.classList.remove('aberto');
    }

    function excluirCliente(id) {
      const clientes = lerClientes();
      const cliente = clientes.find(c => c.id === id);
      if (!cliente) return;

      const confirmar = confirm('Excluir ' + cliente.nome + '?');
      if (!confirmar) return;

      const atualizados = clientes.filter(c => c.id !== id);
      salvarClientes(atualizados);
      renderTabela(document.getElementById('busca').value);
    }

    document.getElementById('btn-novo').addEventListener('click', abrirModalNovo);
    document.getElementById('btn-fechar').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar').addEventListener('click', fecharModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) fecharModal();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nome = document.getElementById('nome').value.trim();
      const telefone = document.getElementById('telefone').value.trim();
      const email = document.getElementById('email').value.trim();

      erroModal.classList.remove('visivel');

      if (!nome || !telefone || !email) {
        erroModal.textContent = 'Preencha todos os campos.';
        erroModal.classList.add('visivel');
        return;
      }

      if (!email.includes('@')) {
        erroModal.textContent = 'Informe um e-mail válido.';
        erroModal.classList.add('visivel');
        return;
      }

      const clientes = lerClientes();

      if (idEmEdicao !== null) {
        const clienteAntigo = clientes.find(c => c.id === idEmEdicao);
        const atualizados = clientes.map(c =>
          c.id === idEmEdicao
            ? { ...c, nome, telefone, email }
            : c
        );

        if (clienteAntigo && clienteAntigo.nome !== nome) {
          const agendamentos = lerAgendamentos();
          Object.keys(agendamentos).forEach(chave => {
            agendamentos[chave] = (agendamentos[chave] || []).map(item => {
              const ehCliente = item.clienteId === idEmEdicao ||
                (!item.clienteId && item.nome && item.nome.toLowerCase() === clienteAntigo.nome.toLowerCase());

              if (!ehCliente) return item;

              return {
                ...item,
                clienteId: idEmEdicao,
                nome,
                clienteNome: nome
              };
            });
          });
          salvarAgendamentos(agendamentos);
        }

        salvarClientes(atualizados);
      } else {
        const maiorId = clientes.reduce((max, c) => Math.max(max, c.id), 0);
        clientes.push({
          id: maiorId + 1,
          nome,
          telefone,
          email,
          ultimo: new Date().toISOString().slice(0, 10)
        });
        salvarClientes(clientes);
      }

      fecharModal();
      renderTabela(document.getElementById('busca').value);
    });

    // ---------- BUSCA ----------
    document.getElementById('busca').addEventListener('input', (e) => {
      renderTabela(e.target.value);
    });

    // ---------- SAIR ----------
    document.getElementById('btn-sair').addEventListener('click', () => {
      localStorage.removeItem('usuarioLogado');
      window.location.href = 'login.html';
    });

    // ---------- INICIALIZAÇÃO ----------
    renderTabela();
  }
}



// ---------- CADASTRO ----------
const formCadastro = document.getElementById('form-cadastro');

if (formCadastro) {
  formCadastro.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmar = document.getElementById('confirmar').value;
    const erro = document.getElementById('mensagem-erro');
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;

    erro.classList.remove('visivel');

    if (!nome || nome.length < 2) {
      erro.textContent = 'Informe seu nome.';
      erro.classList.add('visivel');
      return;
    }

    if (!email || !emailRegex.test(email)) {
      erro.textContent = 'Informe um e-mail válido.';
      erro.classList.add('visivel');
      return;
    }

    if (!passwordRegex.test(senha)) {
      erro.textContent = 'A senha deve conter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula e um número.';
      erro.classList.add('visivel');
      return;
    }
 

    if (senha !== confirmar) {
      erro.textContent = 'As senhas não coincidem.';
      erro.classList.add('visivel');
      return;
    }

    // Salva o usuário e faz login automático
    const usuario = { nome, email };
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));

    window.location.href = 'dashboard.html';
  });
}


// ============================================
// SUPORTE
// ============================================
const listaTickets = document.getElementById('lista-tickets');

if (listaTickets) {
  const usuarioSup = exigirLogin();

  if (usuarioSup) {

    // ---------- FAQ: expandir / recolher ----------
    document.querySelectorAll('.faq-item').forEach(item => {
      const botao = item.querySelector('.faq-pergunta');
      botao.addEventListener('click', () => {
        item.classList.toggle('aberto');
      });
    });

    // ---------- Persistência de tickets ----------
    function lerTickets() {
      const dados = localStorage.getItem('tickets');
      if (dados) return JSON.parse(dados);

      const iniciais = [
        { id: 1, assunto: 'Dúvida sobre lembretes', categoria: 'duvida', status: 'resolvido', data: '2024-10-05' },
        { id: 2, assunto: 'Erro ao exportar relatório', categoria: 'tecnico', status: 'andamento', data: '2024-10-12' },
        { id: 3, assunto: 'Solicitação de nota fiscal', categoria: 'financeiro', status: 'aberto', data: '2024-10-17' }
      ];
      localStorage.setItem('tickets', JSON.stringify(iniciais));
      return iniciais;
    }

    function salvarTickets(lista) {
      localStorage.setItem('tickets', JSON.stringify(lista));
    }

    function renderTickets() {
      const tickets = lerTickets().sort((a, b) => b.data.localeCompare(a.data));
      listaTickets.innerHTML = '';

      const abertos = tickets.filter(t => t.status !== 'resolvido').length;
      document.getElementById('contador-chamados').textContent =
        abertos + (abertos === 1 ? ' aberto' : ' abertos');

      if (tickets.length === 0) {
        const li = document.createElement('li');
        li.className = 'estado-vazio';
        li.textContent = 'Nenhum chamado aberto.';
        listaTickets.appendChild(li);
        return;
      }

      const rotulos = {
        tecnico: 'Problema técnico',
        financeiro: 'Financeiro',
        duvida: 'Dúvida',
        sugestao: 'Sugestão'
      };

      const rotulosStatus = {
        aberto: 'Aberto',
        andamento: 'Em andamento',
        resolvido: 'Resolvido'
      };

      tickets.forEach(t => {
        const li = document.createElement('li');
        li.className = 'ticket-item';
        li.innerHTML = `
          <div class="ticket-info">
            <span class="ticket-assunto" title="${t.assunto}">${t.assunto}</span>
            <span class="ticket-meta">${rotulos[t.categoria] || t.categoria} · ${t.data.split('-').reverse().join('/')}</span>
          </div>
          <span class="ticket-status ${t.status}">${rotulosStatus[t.status]}</span>
        `;
        listaTickets.appendChild(li);
      });
    }

    // ---------- Formulário de suporte ----------
    const formSuporte = document.getElementById('form-suporte');
    const msgSuporte = document.getElementById('mensagem-suporte');

    formSuporte.addEventListener('submit', (e) => {
      e.preventDefault();
      msgSuporte.classList.remove('visivel');

      const assunto = document.getElementById('assunto').value.trim();
      const categoria = document.getElementById('categoria').value;
      const descricao = document.getElementById('descricao').value.trim();

      if (!assunto || !descricao) {
        msgSuporte.textContent = 'Preencha o assunto e a descrição.';
        msgSuporte.classList.add('visivel');
        return;
      }

      const tickets = lerTickets();
      const maiorId = tickets.reduce((max, t) => Math.max(max, t.id), 0);

      tickets.push({
        id: maiorId + 1,
        assunto,
        categoria,
        status: 'aberto',
        data: new Date().toISOString().slice(0, 10),
        descricao
      });

      salvarTickets(tickets);
      formSuporte.reset();
      renderTickets();
      msgSuporte.classList.remove('visivel');

      alert('Chamado aberto com sucesso. Nossa equipe responderá em breve.');
    });

    // ---------- Botão sair ----------
    document.getElementById('btn-sair').addEventListener('click', () => {
      localStorage.removeItem('usuarioLogado');
      window.location.href = 'login.html';
    });

    // ---------- Inicialização ----------
    renderTickets();
  }
}


// ============================================
// FINANÇAS
// ============================================
const tabelaFaturas = document.getElementById('tabela-faturas');

if (tabelaFaturas) {
  const usuarioFin = exigirLogin();

  if (usuarioFin) {

    // ---------- Persistência ----------
    function lerCartoes() {
      const dados = localStorage.getItem('cartoes');
      if (dados) return JSON.parse(dados);

      const iniciais = [
        { id: 1, bandeira: 'Visa', numero: '4242', validade: '12/26', principal: true },
        { id: 2, bandeira: 'Mastercard', numero: '5555', validade: '08/25', principal: false }
      ];
      localStorage.setItem('cartoes', JSON.stringify(iniciais));
      return iniciais;
    }

    function lerFaturas() {
      const dados = localStorage.getItem('faturas');
      if (dados) return JSON.parse(dados);

      const iniciais = [
        { id: 1, data: '2024-10-15', descricao: 'Assinatura Profissional — Outubro', valor: 49, status: 'pago' },
        { id: 2, data: '2024-09-15', descricao: 'Assinatura Profissional — Setembro', valor: 49, status: 'pago' },
        { id: 3, data: '2024-08-15', descricao: 'Assinatura Profissional — Agosto', valor: 49, status: 'pago' },
        { id: 4, data: '2024-11-15', descricao: 'Assinatura Profissional — Novembro', valor: 49, status: 'pendente' }
      ];
      localStorage.setItem('faturas', JSON.stringify(iniciais));
      return iniciais;
    }

    // ---------- Render de cartões ----------
    function renderCartoes() {
      const grid = document.getElementById('grid-cartoes');
      const cartoes = lerCartoes();
      grid.innerHTML = '';

      cartoes.forEach(c => {
        const div = document.createElement('div');
        div.className = 'card-cartao' + (c.principal ? ' principal' : '');
        div.innerHTML = `
          ${c.principal ? '<span class="cartao-selo">Principal</span>' : ''}
          <span class="cartao-bandeira">${c.bandeira}</span>
          <span class="cartao-numero">•••• •••• •••• ${c.numero}</span>
          <span class="cartao-validade">Validade ${c.validade}</span>
        `;
        grid.appendChild(div);
      });
    }

    // ---------- Render de faturas ----------
    function renderFaturas() {
      const faturas = lerFaturas().sort((a, b) => b.data.localeCompare(a.data));
      tabelaFaturas.innerHTML = '';

      faturas.forEach(f => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td data-label="Data">${f.data.split('-').reverse().join('/')}</td>
          <td data-label="Descrição">${f.descricao}</td>
          <td data-label="Valor">R$ ${f.valor.toFixed(2).replace('.', ',')}</td>
          <td data-label="Status"><span class="status-${f.status}">${f.status === 'pago' ? 'Pago' : 'Pendente'}</span></td>
          <td class="coluna-acoes">
            <div class="acoes-linha">
              <button type="button" class="btn-acao">Baixar</button>
            </div>
          </td>
        `;
        tabelaFaturas.appendChild(tr);
      });

      tabelaFaturas.querySelectorAll('.btn-acao').forEach(btn => {
        btn.addEventListener('click', () => {
          alert('Recurso demonstrativo. Em produção, baixaria o PDF da fatura.');
        });
      });
    }

    // ---------- Ações ----------
    document.getElementById('btn-alterar-plano').addEventListener('click', () => {
      document.querySelector('.grid-planos-app').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('btn-cancelar-assinatura').addEventListener('click', () => {
      const confirmar = confirm('Tem certeza que deseja cancelar a assinatura? Você manterá acesso até o fim do período pago.');
      if (confirmar) {
        alert('Assinatura cancelada. Recurso demonstrativo.');
      }
    });

    document.getElementById('btn-add-cartao').addEventListener('click', () => {
      alert('Recurso demonstrativo. Em produção, abriria um formulário de cartão.');
    });

    document.querySelectorAll('.card-plano-app button[data-plano]').forEach(btn => {
      btn.addEventListener('click', () => {
        const plano = btn.dataset.plano;
        const confirmar = confirm('Deseja mudar para o plano ' + plano + '?');
        if (confirmar) {
          alert('Plano alterado para ' + plano + '. Recurso demonstrativo.');
        }
      });
    });

    // ---------- Botão sair ----------
    document.getElementById('btn-sair').addEventListener('click', () => {
      localStorage.removeItem('usuarioLogado');
      window.location.href = 'login.html';
    });

    // ---------- Inicialização ----------
    renderCartoes();
    renderFaturas();
  }
}

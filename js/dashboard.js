/**
 * Lógica do Painel Operacional Protegido (T1.3, T1.4, T1.5 & T1.6) - NexusPort
 * Renderiza o contexto da sessão e suporte aos dashboards da Visão Estratégica (Diretores).
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Obtenção dos Dados da Sessão via Guard
  const session = window.currentUserSession || NexusAuth.getSession();

  if (!session) {
    NexusAuth.requireAuth();
    return;
  }

  // 2. Elementos da Interface
  const themeToggle = document.getElementById('themeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const logoutBtn = document.getElementById('logoutBtn');

  const headerAvatar = document.getElementById('headerAvatar');
  const headerUserName = document.getElementById('headerUserName');
  const headerUserRole = document.getElementById('headerUserRole');
  const headerUserCode = document.getElementById('headerUserCode');

  const welcomeAvatar = document.getElementById('welcomeAvatar');
  const welcomeName = document.getElementById('welcomeName');
  const welcomeRoleBadge = document.getElementById('welcomeRoleBadge');
  const welcomeContext = document.getElementById('welcomeContext');
  const welcomeCode = document.getElementById('welcomeCode');

  const cardRoleName = document.getElementById('cardRoleName');
  const cardRoleLevel = document.getElementById('cardRoleLevel');
  const cardVisionLayer = document.getElementById('cardVisionLayer');
  const sidebarVisionTag = document.getElementById('sidebarVisionTag');

  const restrictionNoticeBox = document.getElementById('restrictionNoticeBox');
  const estrategicoPanel = document.getElementById('estrategicoPanel');
  const exportHistoricoBtn = document.getElementById('exportHistoricoBtn');

  const tableSectionTitle = document.getElementById('tableSectionTitle');
  const visaoPropriaCountBadge = document.getElementById('visaoPropriaCountBadge');
  const visaoPropriaTableBody = document.getElementById('visaoPropriaTableBody');

  // 3. Iniciais do Usuário
  const nameParts = (session.nome || 'Operador').split(' ');
  const initials = nameParts.length > 1
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : nameParts[0].substring(0, 2).toUpperCase();

  // 4. Preenchimento do Header
  if (headerAvatar) headerAvatar.textContent = initials;
  if (headerUserName) headerUserName.textContent = session.nome || 'Operador Porto';
  if (headerUserRole) headerUserRole.textContent = session.cargo_nome || session.cargo;
  if (headerUserCode) headerUserCode.textContent = session.codigo_individual || session.codigo || '--';

  // 5. Preenchimento do Painel Principal
  if (welcomeAvatar) welcomeAvatar.textContent = initials;
  if (welcomeName) welcomeName.textContent = session.nome || 'Operador Porto';
  if (welcomeRoleBadge) welcomeRoleBadge.textContent = session.cargo_nome || session.cargo;
  if (welcomeContext) welcomeContext.textContent = `Matrícula ${session.matricula} • Terminal STS-01 Santos`;
  if (welcomeCode) welcomeCode.textContent = session.codigo_individual || session.codigo || '--';

  // Determina nível e camada de visão dinamicamente a partir do cargo se não fornecidos na sessão
  const isDiretorRole = ['DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(session.cargo);
  const isOperacionalSupervisorRole = ['INSPETOR', 'SUPERVISOR_GERENTE_OPERACOES'].includes(session.cargo);

  const derivedLevel = session.nivel || (isDiretorRole ? 'Nível Estratégico' : isOperacionalSupervisorRole ? 'Nível Tático/Gestão' : 'Nível Operacional');
  const derivedVision = session.camada_visao || (isDiretorRole ? 'Visão Estratégica' : isOperacionalSupervisorRole ? 'Visão Operacional' : 'Visão Própria');

  if (cardRoleName) cardRoleName.textContent = session.cargo_nome || session.cargo;
  if (cardRoleLevel) cardRoleLevel.textContent = derivedLevel;
  if (cardVisionLayer) cardVisionLayer.textContent = derivedVision;
  if (sidebarVisionTag) sidebarVisionTag.textContent = derivedVision;

  // 6. Tratamento do Painel do Técnico em Portos (T1.8 / RN 15)
  const isTecnico = session.cargo === 'TECNICO_PORTOS';
  const isDiretor = ['DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(session.cargo);

  const tecnicoAccessCodePanel = document.getElementById('tecnicoAccessCodePanel');

  if (isTecnico || isDiretor) {
    if (tecnicoAccessCodePanel) tecnicoAccessCodePanel.classList.remove('hidden');
    initTecnicoCodeManagement();
  }

  if (isDiretor) {
    if (estrategicoPanel) estrategicoPanel.classList.remove('hidden');
    if (restrictionNoticeBox) restrictionNoticeBox.classList.add('hidden');
    if (tableSectionTitle) tableSectionTitle.textContent = 'Visão Estratégica Geral de Cargas e Operações';

    // Renderiza Gráficos Analíticos com Chart.js
    renderEstrategicoCharts();

    if (exportHistoricoBtn) {
      exportHistoricoBtn.addEventListener('click', () => {
        NexusVision.exportDadosHistoricos();
      });
    }
  } else if (['INSPETOR', 'SUPERVISOR_GERENTE_OPERACOES'].includes(session.cargo)) {
    if (estrategicoPanel) estrategicoPanel.classList.add('hidden');
    if (restrictionNoticeBox) restrictionNoticeBox.classList.remove('hidden');
    if (tableSectionTitle) tableSectionTitle.textContent = 'Visão Operacional Geral de Cargas em Pátio';
  } else {
    if (estrategicoPanel) estrategicoPanel.classList.add('hidden');
    if (restrictionNoticeBox) restrictionNoticeBox.classList.add('hidden');
    if (tableSectionTitle) tableSectionTitle.textContent = 'Minhas Operações Atribuídas (Visão Própria)';
  }

  // 7. Função para Inicialização dos Gráficos Estratégicos (T1.6)
  function renderEstrategicoCharts() {
    const metrics = NexusVision.getEstrategicoMetrics();

    // Chart 1: Produtividade Operacional por Cargo
    const ctxProdutividade = document.getElementById('chartProdutividade');
    if (ctxProdutividade && typeof Chart !== 'undefined') {
      new Chart(ctxProdutividade, {
        type: 'bar',
        data: {
          labels: metrics.produtividadePorCargo.map(p => p.cargo),
          datasets: [{
            label: 'Volume de Operações',
            data: [4820, 1240, 6390, 3810],
            backgroundColor: '#445987',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(225, 229, 237, 0.3)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Chart 2: Embarcações Mais Utilizadas
    const ctxNavios = document.getElementById('chartNavios');
    if (ctxNavios && typeof Chart !== 'undefined') {
      new Chart(ctxNavios, {
        type: 'doughnut',
        data: {
          labels: ['MV Santos Star', 'MV Pacific Giant', 'MV Atlantic Breeze'],
          datasets: [{
            data: [142, 115, 98],
            backgroundColor: ['#1E293B', '#445987', '#2E7D32']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  }

  // 8. Filtragem e Renderização da Tabela (T1.4, T1.5 & T1.6)
  function renderTableData() {
    if (!visaoPropriaTableBody) return;

    const userItems = NexusVision.getMockVisaoData('cargas', session);

    if (visaoPropriaCountBadge) {
      visaoPropriaCountBadge.textContent = `${userItems.length} item(ns)`;
    }

    if (userItems.length === 0) {
      visaoPropriaTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="p-6 text-center text-slate-400 dark:text-slate-500 font-sans">
            <span class="material-symbols-outlined text-[32px] block mb-1">inventory</span>
            <span>Nenhum registro operacional localizado para a sua camada de visão (${session.camada_visao || 'Visão Própria'}).</span>
          </td>
        </tr>
      `;
      return;
    }

    visaoPropriaTableBody.innerHTML = userItems.map(item => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <td class="p-3 font-mono font-bold text-nexus-500 dark:text-indigo-400">${item.codigo_carga}</td>
        <td class="p-3">${item.tipo}</td>
        <td class="p-3 font-mono">${item.peso}</td>
        <td class="p-3 font-mono">${item.container_id}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
            item.status === 'EM_CARREGAMENTO' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
            item.status === 'PRONTA_PARA_ENTREGA' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
          }">
            ${item.status}
          </span>
        </td>
        <td class="p-3 font-mono text-slate-500 dark:text-slate-400">${item.data}</td>
      </tr>
    `).join('');
  }

  renderTableData();

  // 9. Configuração de Tema Claro / Escuro
  function initTheme() {
    const savedTheme = localStorage.getItem('nexus_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      if (themeToggleIcon) themeToggleIcon.textContent = 'light_mode';
    } else {
      document.documentElement.classList.remove('dark');
      if (themeToggleIcon) themeToggleIcon.textContent = 'dark_mode';
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('nexus_theme', isDark ? 'dark' : 'light');
      if (themeToggleIcon) {
        themeToggleIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
      }
    });
  }

  initTheme();

  // 9.1 Função de Gestão de Códigos para o Técnico em Portos (T1.8 / RN 15)
  function initTecnicoCodeManagement() {
    const searchInput = document.getElementById('empMatriculaSearch');
    const searchBtn = document.getElementById('searchEmpBtn');
    const regenBtn = document.getElementById('regenCodeBtn');
    const resultBox = document.getElementById('empSearchResultBox');
    const regenNotice = document.getElementById('codeRegenNotice');

    const resNome = document.getElementById('resEmpNome');
    const resCargo = document.getElementById('resEmpCargo');
    const resCodigo = document.getElementById('resEmpCodigo');
    const newGenCode = document.getElementById('newGeneratedCode');

    let selectedEmployee = null;

    // Mocks de funcionários para busca rápida
    const employeeList = [
      { codigo: 'NX-8821-SP', matricula: 'MAT-8821', nome: 'Carlos Silva', cargo: 'SUPERVISOR_GERENTE_OPERACOES', cargo_nome: 'Supervisor' },
      { codigo: 'NX-1040-OP', matricula: 'MAT-1040', nome: 'João Pedro', cargo: 'ESTIVADOR', cargo_nome: 'Estivador' },
      { codigo: 'NX-2050-CF', matricula: 'MAT-2050', nome: 'Mariana Souza', cargo: 'CONFERENTE_CARGA', cargo_nome: 'Conferente' },
      { codigo: 'NX-3060-AR', matricula: 'MAT-3060', nome: 'Roberto Alves', cargo: 'ARRUMADOR_CONSERTADOR', cargo_nome: 'Arrumador' },
      { codigo: 'NX-4070-PL', matricula: 'MAT-4070', nome: 'Fernanda Lima', cargo: 'PLANEJADOR_PATIO_NAVIOS', cargo_nome: 'Planejador' },
      { codigo: 'NX-5080-TC', matricula: 'MAT-5080', nome: 'Lucas Mendes', cargo: 'TECNICO_PORTOS', cargo_nome: 'Técnico em Portos' },
      { codigo: 'NX-6090-IN', matricula: 'MAT-6090', nome: 'Patricia Rocha', cargo: 'INSPETOR', cargo_nome: 'Inspetor' }
    ];

    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim().toUpperCase();
        if (!query) {
          alert('Por favor, informe a matrícula para buscar.');
          return;
        }

        // Verifica se há overrides gravados no localStorage
        const storedOverrides = JSON.parse(localStorage.getItem('nexus_code_overrides') || '{}');

        selectedEmployee = employeeList.find(e => e.matricula === query);

        if (selectedEmployee) {
          if (resultBox) resultBox.classList.remove('hidden');
          if (resNome) resNome.textContent = selectedEmployee.nome;
          if (resCargo) resCargo.textContent = `${selectedEmployee.cargo_nome} (${selectedEmployee.matricula})`;

          const currentCode = storedOverrides[selectedEmployee.matricula]?.codigo || selectedEmployee.codigo;
          if (resCodigo) resCodigo.textContent = currentCode;

          if (regenBtn) regenBtn.disabled = false;
          if (regenNotice) regenNotice.classList.add('hidden');
        } else {
          alert(`Funcionário com matrícula "${query}" não foi encontrado no sistema.`);
          if (resultBox) resultBox.classList.add('hidden');
          if (regenBtn) regenBtn.disabled = true;
        }
      });
    }

    if (regenBtn) {
      regenBtn.addEventListener('click', () => {
        if (!selectedEmployee) return;

        if (confirm(`Confirma a INVALIDAÇÃO do código atual (${resCodigo.textContent}) para o funcionário ${selectedEmployee.nome}? Um novo código exclusivo será reemitido.`)) {
          // Gerar novo código único aleatório baseado na matrícula e timestamp
          const suffix = Math.floor(1000 + Math.random() * 9000);
          const newCode = `NX-${selectedEmployee.matricula.replace('MAT-', '')}-${suffix}`;

          // Atualiza registro no localStorage para persistência e validação no Login
          const storedOverrides = JSON.parse(localStorage.getItem('nexus_code_overrides') || '{}');

          // Invalida o código antigo e registra o novo
          storedOverrides[selectedEmployee.matricula] = {
            old_codigo: resCodigo.textContent,
            codigo: newCode,
            gerado_por: session.matricula,
            data_geracao: new Date().toISOString()
          };

          localStorage.setItem('nexus_code_overrides', JSON.stringify(storedOverrides));

          // Atualiza UI
          if (resCodigo) resCodigo.textContent = newCode;
          if (newGenCode) newGenCode.textContent = newCode;
          if (regenNotice) regenNotice.classList.remove('hidden');

          alert(`Sucesso! Código antigo invalidado. O novo código de acesso é: ${newCode}`);
        }
      });
    }
  }

  // 10. Ação de Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Deseja encerrar sua sessão operacional no terminal STS-01?')) {
        NexusAuth.logout();
      }
    });
  }
});

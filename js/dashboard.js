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

  // 9.6 Lógica de Manutenções e Emergências (Fase 4: T4.1 a T4.10)
  initManutencaoEmergencia();

  function initManutencaoEmergencia() {
    const toggleOsBtn = document.getElementById('toggleOsFormBtn');
    const osForm = document.getElementById('osForm');
    const osTableBody = document.getElementById('osTableBody');

    const panicBtn = document.getElementById('panicButton');
    const resetEmergencyBtn = document.getElementById('resetEmergencyBtn');
    const emergencyAlertBanner = document.getElementById('emergencyAlertBanner');

    const toggleIncidenteBtn = document.getElementById('toggleIncidenteBtn');
    const incidenteForm = document.getElementById('incidenteForm');

    // Mocks de Ordens de Serviço (OS)
    let osList = JSON.parse(localStorage.getItem('nexus_os_list') || 'null');
    if (!osList) {
      osList = [
        { id: 'OS-2026-001', equipamento: 'GND-01-STS', prioridade: 'ALTA', descricao: 'Desgaste nas roldanas de içamento', status: 'PENDENTE_APROVACAO', data: new Date().toISOString().split('T')[0] },
        { id: 'OS-2026-002', equipamento: 'MSCU-102938-4', prioridade: 'MEDIA', descricao: 'Vazamento na vedação de borracha', status: 'EM_MANUTENCAO', data: new Date().toISOString().split('T')[0] }
      ];
      localStorage.setItem('nexus_os_list', JSON.stringify(osList));
    }

    function renderOsTable() {
      if (!osTableBody) return;
      osTableBody.innerHTML = osList.map(os => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="p-2 font-mono font-bold text-nexus-500">${os.id}</td>
          <td class="p-2 font-bold">${os.equipamento}</td>
          <td class="p-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              os.prioridade === 'ALTA' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
              os.prioridade === 'MEDIA' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
              'bg-slate-100 text-slate-800'
            }">${os.prioridade}</span>
          </td>
          <td class="p-2">${os.descricao}</td>
          <td class="p-2 font-mono text-xs">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              os.status === 'EM_MANUTENCAO' ? 'bg-amber-100 text-amber-800' :
              os.status === 'CONCLUIDA' ? 'bg-emerald-100 text-emerald-800' :
              os.status === 'REPROVADA' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }">${os.status}</span>
          </td>
          <td class="p-2 font-mono text-[11px]">
            ${os.status === 'PENDENTE_APROVACAO' ? `
              <button type="button" onclick="window.executarAcaoOS('${os.id}', 'APROVAR')" class="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold mr-1">Aprovar</button>
              <button type="button" onclick="window.executarAcaoOS('${os.id}', 'REPROVAR')" class="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold">Reprovar</button>
            ` : os.status === 'EM_MANUTENCAO' ? `
              <button type="button" onclick="window.executarAcaoOS('${os.id}', 'CONCLUIR')" class="px-1.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold">Concluir Manutenção</button>
            ` : `<span class="text-slate-400 font-sans italic">Finalizada</span>`}
          </td>
        </tr>
      `).join('');
    }

    if (toggleOsBtn && osForm) {
      toggleOsBtn.addEventListener('click', () => osForm.classList.toggle('hidden'));
    }

    if (osForm) {
      osForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const equipamento = document.getElementById('osEquipamento').value;
        const prioridade = document.getElementById('osPrioridade').value;
        const descricao = document.getElementById('osDescricao').value.trim();

        const newId = `OS-2026-${Math.floor(100 + Math.random() * 900)}`;
        osList.push({
          id: newId, equipamento, prioridade, descricao,
          status: 'PENDENTE_APROVACAO', data: new Date().toISOString().split('T')[0]
        });

        localStorage.setItem('nexus_os_list', JSON.stringify(osList));
        renderOsTable();
        osForm.reset();
        osForm.classList.add('hidden');
        alert(`Ordem de Serviço ${newId} criada com sucesso para ${equipamento}! Enviada para aprovação do Supervisor.`);
      });
    }

    renderOsTable();

    // Handler global de ações de OS (T4.2, T4.3, T4.4, T4.5)
    window.executarAcaoOS = function(idOS, acao) {
      const os = osList.find(o => o.id === idOS);
      if (!os) return;

      if (acao === 'APROVAR') {
        os.status = 'EM_MANUTENCAO';
        alert(`Ordem de Serviço ${idOS} APROVADA pelo Supervisor! Equipamento ${os.equipamento} atualizado para o estado EM_MANUTENCAO e bloqueado temporariamente para operações.`);
      } else if (acao === 'REPROVAR') {
        os.status = 'REPROVADA';
        alert(`Ordem de Serviço ${idOS} REPROVADA pelo Supervisor.`);
      } else if (acao === 'CONCLUIR') {
        os.status = 'CONCLUIDA';
        alert(`Manutenção da OS ${idOS} CONCLUÍDA! Equipamento ${os.equipamento} reativado e liberado para uso no estado OPERANTE.`);
      }

      localStorage.setItem('nexus_os_list', JSON.stringify(osList));
      renderOsTable();
    };

    // Protocolos de Emergência (T4.6 - T4.10)
    if (panicBtn) {
      panicBtn.addEventListener('click', () => {
        if (confirm('ATENÇÃO: Deseja acionar o BOTÃO DE PÂNICO e declarar EMERGÊNCIA CRÍTICA no Terminal STS-01?')) {
          localStorage.setItem('nexus_emergency_active', 'true');
          if (emergencyAlertBanner) emergencyAlertBanner.classList.remove('hidden');
          alert('EMERGÊNCIA CRÍTICA DECLARADA! Alarme sonoro/visual ativado. Pátio STS-01 bloqueado temporariamente para operações de movimentação.');
        }
      });
    }

    if (resetEmergencyBtn) {
      resetEmergencyBtn.addEventListener('click', () => {
        if (confirm('Confirmar desativação do alarme de emergência e liberação do pátio?')) {
          localStorage.removeItem('nexus_emergency_active');
          if (emergencyAlertBanner) emergencyAlertBanner.classList.add('hidden');
          alert('Alarme de emergência desativado com sucesso. Retorno às operações normais liberado.');
        }
      });
    }

    if (localStorage.getItem('nexus_emergency_active') === 'true') {
      if (emergencyAlertBanner) emergencyAlertBanner.classList.remove('hidden');
    }

    if (toggleIncidenteBtn && incidenteForm) {
      toggleIncidenteBtn.addEventListener('click', () => incidenteForm.classList.toggle('hidden'));
    }

    if (incidenteForm) {
      incidenteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const local = document.getElementById('incLocal').value.trim();
        const tipo = document.getElementById('incTipo').value;
        const gravidade = document.getElementById('incGravidade').value;
        const descricao = document.getElementById('incDescricao').value.trim();

        const incidentes = JSON.parse(localStorage.getItem('nexus_incidentes') || '[]');
        incidentes.push({
          id: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
          local, tipo, gravidade, descricao, data: new Date().toISOString()
        });

        localStorage.setItem('nexus_incidentes', JSON.stringify(incidentes));
        incidenteForm.reset();
        incidenteForm.classList.add('hidden');
        alert('Relatório de Incidente pós-emergência registrado com sucesso para auditoria!');
      });
    }
  }

  // 9.5 Lógica do Fluxo de Cargas (Fase 3: Core Business - T3.1 a T3.24)
  initFluxoCargas();

  function initFluxoCargas() {
    const toggleAgendamentoBtn = document.getElementById('toggleAgendamentoFormBtn');
    const agendamentoForm = document.getElementById('agendamentoCargaForm');
    const fluxoTableBody = document.getElementById('fluxoCargasTableBody');

    // Mocks de Cargas em Fluxo (ou carregados do localStorage)
    let cargasFluxoList = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || 'null');
    if (!cargasFluxoList) {
      cargasFluxoList = [
        { id: 'CRG-2026-001', tipo: 'Grãos Soltos', peso: '25.5 t', volume: '40 m³', valor: 'R$ 80.000', natureza: 'Agrícola', portoDescarga: 'Porto de Roterdã', destino: 'Amsterdã', status: 'RECEBIMENTO_INSPECAO', container: 'CONT-991', navio: 'MV Santos Star', qrCode: 'QR-CRG-2026-001' },
        { id: 'CRG-2026-002', tipo: 'Eletrônicos', peso: '12.0 t', volume: '20 m³', valor: 'R$ 450.000', natureza: 'Industrial', portoDescarga: 'Porto de Santos', destino: 'São Paulo', status: 'ARMAZENAGEM', container: 'CONT-992', navio: 'MV Santos Star', qrCode: 'QR-CRG-2026-002' },
        { id: 'CRG-2026-003', tipo: 'Produtos Químicos', peso: '18.2 t', volume: '30 m³', valor: 'R$ 210.000', natureza: 'Química', portoDescarga: 'Porto de Singapura', destino: 'Singapura', status: 'PRONTA_PARA_ENTREGA', container: 'CONT-993', navio: 'MV Pacific Giant', qrCode: 'QR-CRG-2026-003' }
      ];
      localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargasFluxoList));
    }

    function renderFluxoTable() {
      if (!fluxoTableBody) return;
      fluxoTableBody.innerHTML = cargasFluxoList.map(c => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="p-2 font-mono font-bold text-nexus-500">
            ${c.id}
            <span class="block text-[10px] text-slate-400 font-normal">${c.qrCode}</span>
          </td>
          <td class="p-2">${c.tipo} <span class="block text-[10px] text-slate-400">${c.natureza}</span></td>
          <td class="p-2 font-mono">${c.peso} / ${c.volume}</td>
          <td class="p-2 font-bold">${c.portoDescarga}</td>
          <td class="p-2 font-mono text-xs">${c.container || 'Não vinculado'} / ${c.navio || 'Não vinculado'}</td>
          <td class="p-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              c.status === 'AGENDAMENTO' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
              c.status === 'ARMAZENAGEM' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' :
              c.status === 'PRONTA_PARA_ENTREGA' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
              c.status === 'EM_TRANSITO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
              c.status === 'ENTREGUE' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
              c.status === 'RECUSADA' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
              'bg-slate-100 text-slate-800'
            }">
              ${c.status}
            </span>
          </td>
          <td class="p-2 font-mono text-[11px]">
            <button type="button" onclick="window.executarAcaoCarga('${c.id}', 'RECEBER')" class="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold mr-1">Receber</button>
            <button type="button" onclick="window.executarAcaoCarga('${c.id}', 'INSPECIONAR')" class="px-1.5 py-0.5 rounded bg-nexus-500 hover:bg-nexus-900 text-white font-bold mr-1">Inspecionar</button>
            <button type="button" onclick="window.executarAcaoCarga('${c.id}', 'VINCULAR')" class="px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold mr-1">Vincular</button>
            <button type="button" onclick="window.executarAcaoCarga('${c.id}', 'PRONTA')" class="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold mr-1">Pronta</button>
            <button type="button" onclick="window.executarAcaoCarga('${c.id}', 'LIBERAR')" class="px-1.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold mr-1">Liberar</button>
            <button type="button" onclick="window.executarAcaoCarga('${c.id}', 'ENTREGAR')" class="px-1.5 py-0.5 rounded bg-green-600 hover:bg-green-700 text-white font-bold mr-1">Entregar</button>
            <button type="button" onclick="window.executarAcaoCarga('${c.id}', 'CANCELAR')" class="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold">Cancelar</button>
          </td>
        </tr>
      `).join('');
    }

    if (toggleAgendamentoBtn && agendamentoForm) {
      toggleAgendamentoBtn.addEventListener('click', () => agendamentoForm.classList.toggle('hidden'));
    }

    if (agendamentoForm) {
      agendamentoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const tipo = document.getElementById('agTipoCarga').value;
        const peso = document.getElementById('agPeso').value + ' t';
        const volume = document.getElementById('agVolume').value + ' m³';
        const valor = 'R$ ' + parseFloat(document.getElementById('agValor').value).toLocaleString('pt-BR');
        const natureza = document.getElementById('agNatureza').value.trim();
        const portoDescarga = document.getElementById('agPortoDescarga').value.trim();
        const destino = document.getElementById('agDestino').value.trim();

        // T3.2 Validar se Tipo de Carga está cadastrado com checklist
        const tiposCadastrados = JSON.parse(localStorage.getItem('nexus_crud_tipos_carga') || '[]');
        const tipoEncontrado = tiposCadastrados.find(t => t.nome === tipo);
        if (!tipoEncontrado && !['Grãos Soltos', 'Eletrônicos', 'Produtos Químicos', 'Maquinário Pesado'].includes(tipo)) {
          alert('Agendamento negado: O Tipo de Carga selecionado não possui checklist cadastrado pelo Supervisor!');
          return;
        }

        const idNum = Math.floor(100 + Math.random() * 900);
        const newId = `CRG-2026-${idNum}`;
        const newQrCode = `QR-${newId}`;

        cargasFluxoList.push({
          id: newId, tipo, peso, volume, valor, natureza, portoDescarga, destino,
          status: 'AGENDAMENTO', container: '', navio: '', qrCode: newQrCode
        });

        localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargasFluxoList));
        renderFluxoTable();
        agendamentoForm.reset();
        agendamentoForm.classList.add('hidden');
        alert(`Agendamento da Carga ${newId} concluído com sucesso! QR Code gerado automaticamente: ${newQrCode}`);
      });
    }

    renderFluxoTable();

    // Handler global para ações operacionais do fluxo (T3.6 - T3.24)
    window.executarAcaoCarga = function(idCarga, acao) {
      const carga = cargasFluxoList.find(c => c.id === idCarga);
      if (!carga) return;

      if (acao === 'RECEBER') {
        if (carga.status !== 'AGENDAMENTO') {
          alert('Apenas cargas com agendamento prévio podem ter recebimento físico registrado!');
          return;
        }
        carga.status = 'RECEBIMENTO_INSPECAO';
        alert(`Recebimento físico da carga ${idCarga} registrado pelo Conferente! Status atualizado para RECEBIMENTO_INSPECAO.`);
      } else if (acao === 'INSPECIONAR') {
        if (carga.status !== 'RECEBIMENTO_INSPECAO') {
          alert('A inspeção só pode ser realizada para cargas no estado RECEBIMENTO_INSPECAO!');
          return;
        }
        const aprovar = confirm(`Inspeção Técnica do Inspetor para a carga ${idCarga}:\n\nTodos os itens críticos do checklist do tipo "${carga.tipo}" estão em CONFORME?\n\nClique [OK] para Aprovar ou [Cancelar] para Recusar.`);
        if (aprovar) {
          carga.status = 'ARMAZENAGEM';
          alert(`Carga ${idCarga} APROVADA na inspeção técnica! Encaminhada para ARMAZENAGEM no pátio.`);
        } else {
          const motivo = prompt('Informe obrigatoriamente o motivo da RECUSA no checklist:');
          if (motivo) {
            carga.status = 'RECUSADA';
            carga.motivoRecusa = motivo;
            alert(`Carga ${idCarga} RECUSADA na inspeção. Motivo registrado: "${motivo}". Status mantido em RECUSADA.`);
          }
        }
      } else if (acao === 'VINCULAR') {
        if (carga.status !== 'ARMAZENAGEM') {
          alert('A vinculação só pode ser feita quando a carga está em ARMAZENAGEM!');
          return;
        }
        const containerInput = prompt('Informe a identificação do Contêiner (Ex: CONT-991 / MSCU-102938-4):', 'CONT-991');
        const navioInput = prompt('Informe o Navio (Ex: MV Santos Star):', 'MV Santos Star');

        if (containerInput && navioInput) {
          const naviosUpdates = JSON.parse(localStorage.getItem('nexus_updates_navios') || '{}');
          const estadoNavio = naviosUpdates[navioInput]?.estado || (navioInput === 'MV Atlantic Breeze' ? 'AGENDADO_PARA_REFORMA' : 'OPERANTE');

          if (['EM_REFORMA', 'AGENDADO_PARA_REFORMA'].includes(estadoNavio)) {
            alert(`BLOQUEIO DE SEGURANÇA: O navio ${navioInput} está em estado "${estadoNavio}" e NÃO PODE RECEBER CARGAS!`);
            return;
          }

          carga.container = containerInput;
          carga.navio = navioInput;
          alert(`Carga ${idCarga} vinculada com sucesso ao Contêiner ${containerInput} e ao Navio ${navioInput}!`);
        }
      } else if (acao === 'PRONTA') {
        if (carga.status !== 'ARMAZENAGEM') {
          alert('Apenas cargas em ARMAZENAGEM podem ser marcadas como Prontas para Entrega!');
          return;
        }
        carga.status = 'PRONTA_PARA_ENTREGA';
        alert(`Status da carga ${idCarga} alterado para PRONTA_PARA_ENTREGA pelo Arrumador/Consertador.`);
      } else if (acao === 'LIBERAR') {
        if (carga.status !== 'PRONTA_PARA_ENTREGA') {
          alert('Apenas cargas no estado PRONTA_PARA_ENTREGA podem ser liberadas pelo Supervisor!');
          return;
        }

        const rotasCadastradas = JSON.parse(localStorage.getItem('nexus_crud_rotas') || '[]');
        const rotaExiste = rotasCadastradas.some(r => r.origem.includes('Santos') || r.destino.includes(carga.portoDescarga));

        if (!rotaExiste && rotasCadastradas.length === 0) {
          alert(`BLOQUEIO: Liberação impedida pois não existe rota marítima cadastrada para ${carga.portoDescarga}. O Supervisor deve cadastrar a rota primeiro!`);
          return;
        }

        carga.status = 'EM_TRANSITO';
        alert(`Carga ${idCarga} (e contêiner/navio vinculados) LIBERADOS para saída pelo Supervisor! Status alterado para EM_TRANSITO. Estimativa ETA calculada a 33 km/h.`);
      } else if (acao === 'ENTREGAR') {
        if (carga.status !== 'EM_TRANSITO') {
          alert('Apenas cargas no estado EM_TRANSITO podem ter sua entrega confirmada no destino!');
          return;
        }
        carga.status = 'ENTREGUE';
        alert(`Sucesso! Entrega da carga ${idCarga} confirmada no destino. Status da carga e vinculação do contêiner ${carga.container || ''} e navio ${carga.navio || ''} atualizados para ENTREGUE!`);
      } else if (acao === 'CANCELAR') {
        if (!['AGENDAMENTO', 'ARMAZENAGEM', 'PRONTA_PARA_ENTREGA'].includes(carga.status)) {
          alert('Cancelamento permitido apenas nos estados: Agendamento, Armazenagem ou Pronta para Entrega!');
          return;
        }
        const motivoCancel = prompt('Informe obrigatoriamente o MOTIVO do cancelamento:');
        if (motivoCancel) {
          carga.status = 'CANCELADA';
          carga.motivoCancelamento = motivoCancel;
          alert(`Entrega da carga ${idCarga} CANCELADA pelo Supervisor. Motivo registrado: "${motivoCancel}".`);
        }
      }

      localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargasFluxoList));
      renderFluxoTable();
    };
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

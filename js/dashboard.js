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

  // 9.2 Lógica de Logs, Trail e Delegação de Supervisor (Fase 7: T7.1 a T7.9)
  function initLogsTrailDelegacao() {
    const auditTableBody = document.getElementById('auditLogTableBody');
    const trailTableBody = document.getElementById('trailDecisoesTableBody');
    const delegPanel = document.getElementById('delegacaoSupervisorPanel');
    const delegForm = document.getElementById('delegacaoForm');
    const revogarBtn = document.getElementById('revogarDelegacaoBtn');
    const substitutoNome = document.getElementById('substitutoNome');
    const substitutoVigencia = document.getElementById('substitutoVigencia');

    // Exibir painel de delegação apenas para Supervisor (T7.6)
    if (delegPanel && session.cargo === 'SUPERVISOR_GERENTE_OPERACOES') {
      delegPanel.classList.remove('hidden');
    }

    // Função de Registro Automático do Log de Alterações (T7.1)
    window.registrarLogAlteracao = function(entidade, tipoAlteracao, detalhes = '') {
      const logs = JSON.parse(localStorage.getItem('nexus_audit_logs') || '[]');
      const newEntry = {
        data_hora: new Date().toISOString(),
        cargo: session.cargo_nome || session.cargo,
        codigo_usuario: session.codigo_individual || session.codigo || '--',
        entidade: entidade,
        tipo_alteracao: tipoAlteracao,
        detalhes: detalhes
      };
      logs.unshift(newEntry);
      localStorage.setItem('nexus_audit_logs', JSON.stringify(logs));
      renderAuditLogTable();
    };

    // Renderizar tabela do Log de Alterações (T7.2)
    function renderAuditLogTable() {
      if (!auditTableBody) return;
      let logs = JSON.parse(localStorage.getItem('nexus_audit_logs') || 'null');
      if (!logs || logs.length === 0) {
        logs = [
          { data_hora: new Date().toISOString(), cargo: 'Supervisor de Operações', codigo_usuario: 'SUP-2001', entidade: 'CRG-2026-001', tipo_alteracao: 'Criação / Agendamento' },
          { data_hora: new Date(Date.now() - 3600000).toISOString(), cargo: 'Inspetor Técnico', codigo_usuario: 'INS-6090', entidade: 'CRG-2026-002', tipo_alteracao: 'Aprovação de Inspeção' },
          { data_hora: new Date(Date.now() - 7200000).toISOString(), cargo: 'Técnico em Portos', codigo_usuario: 'TEC-5080', entidade: 'MAT-1040', tipo_alteracao: 'Reemissão de Código de Acesso' }
        ];
        localStorage.setItem('nexus_audit_logs', JSON.stringify(logs));
      }

      auditTableBody.innerHTML = logs.map(l => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="p-2.5 text-slate-500">${new Date(l.data_hora).toLocaleString('pt-BR')}</td>
          <td class="p-2.5 font-bold text-nexus-900 dark:text-white">${l.cargo}</td>
          <td class="p-2.5 text-nexus-500 font-bold">${l.codigo_usuario}</td>
          <td class="p-2.5 font-bold">${l.entidade}</td>
          <td class="p-2.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">${l.tipo_alteracao}</span>
          </td>
        </tr>
      `).join('');
    }

    renderAuditLogTable();

    // Função de Registro Imutável no Trail de Decisões Críticas (T7.3)
    window.registrarTrailDecisao = function(decisao, entidade, motivo = '') {
      const trail = JSON.parse(localStorage.getItem('nexus_trail_decisoes') || '[]');
      const idReg = `TRL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newEntry = {
        id: idReg,
        data_hora: new Date().toISOString(),
        responsavel: `${session.nome} (${session.cargo_nome || session.cargo}) - ${session.codigo_individual || session.codigo}`,
        decisao: decisao,
        entidade: entidade,
        motivo: motivo || 'Decisão homologada conforme fluxo operacional',
        retificacao: null
      };
      trail.unshift(newEntry);
      localStorage.setItem('nexus_trail_decisoes', JSON.stringify(trail));
      renderTrailDecisoesTable();
      window.registrarLogAlteracao(entidade, `Decisão Crítica: ${decisao}`, motivo);
    };

    // Anexar Retificação Vinculada (T7.4)
    window.anexarRetificacaoTrail = function(idTrail) {
      const trail = JSON.parse(localStorage.getItem('nexus_trail_decisoes') || '[]');
      const item = trail.find(t => t.id === idTrail);
      if (!item) return;

      const textoRetificacao = prompt(`Informe a RETIFICAÇÃO a ser vinculada ao registro imutável ${idTrail}:\n(O registro original permanecerá inalterado)`);
      if (textoRetificacao) {
        item.retificacao = `[Retificação em ${new Date().toLocaleString('pt-BR')} por ${session.codigo_individual}]: ${textoRetificacao}`;
        localStorage.setItem('nexus_trail_decisoes', JSON.stringify(trail));
        renderTrailDecisoesTable();
        alert(`Retificação vinculada com sucesso ao registro imutável ${idTrail}!`);
      }
    };

    // Renderizar Tabela do Trail de Decisões (T7.5)
    function renderTrailDecisoesTable() {
      if (!trailTableBody) return;
      let trail = JSON.parse(localStorage.getItem('nexus_trail_decisoes') || 'null');
      if (!trail || trail.length === 0) {
        trail = [
          { id: 'TRL-2026-9012', data_hora: new Date().toISOString(), responsavel: 'Carlos Supervisor (Supervisor) - SUP-2001', decisao: 'Liberou Navio MV Santos Star', entidade: 'MV Santos Star', motivo: 'Documentação e inspeção em conformidade', retificacao: null },
          { id: 'TRL-2026-8811', data_hora: new Date(Date.now() - 3600000).toISOString(), responsavel: 'Patricia Rocha (Inspetor) - INS-6090', decisao: 'Recusou Carga CRG-2026-003', entidade: 'CRG-2026-003', motivo: 'Avarias e lacre rompido na embalagem', retificacao: '[Retificação em 20/09 14:00]: Reinspecionado item não crítico e mantida recusa.' }
        ];
        localStorage.setItem('nexus_trail_decisoes', JSON.stringify(trail));
      }

      trailTableBody.innerHTML = trail.map(t => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="p-3 font-mono font-bold text-nexus-500">${t.id}</td>
          <td class="p-3 text-slate-500 font-mono text-[11px]">${new Date(t.data_hora).toLocaleString('pt-BR')}</td>
          <td class="p-3 font-bold">${t.responsavel}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">${t.decisao}</span></td>
          <td class="p-3 font-mono font-bold">${t.entidade}</td>
          <td class="p-3 text-slate-600 dark:text-slate-300 text-xs">${t.motivo}</td>
          <td class="p-3 text-xs italic text-amber-700 dark:text-amber-400 font-mono">${t.retificacao || '<span class="text-slate-400 not-italic">Sem retificação</span>'}</td>
          <td class="p-3">
            <button type="button" onclick="window.anexarRetificacaoTrail('${t.id}')" class="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10px] flex items-center gap-1">
              Anexar Retificação
            </button>
          </td>
        </tr>
      `).join('');
    }

    renderTrailDecisoesTable();

    // Módulo de Delegação de Supervisor (T7.6, T7.7, T7.8, T7.9)
    function updateDelegacaoUI() {
      const activeDeleg = JSON.parse(localStorage.getItem('nexus_active_delegation') || 'null');
      if (activeDeleg) {
        if (substitutoNome) substitutoNome.textContent = `Substituto Ativo: ${activeDeleg.substitutoMatricula}`;
        if (substitutoVigencia) substitutoVigencia.textContent = `Vigência: de ${new Date(activeDeleg.inicio).toLocaleString('pt-BR')} até ${new Date(activeDeleg.fim).toLocaleString('pt-BR')} (Designado por ${activeDeleg.supervisor})`;
        if (revogarBtn) revogarBtn.classList.remove('hidden');
      } else {
        if (substitutoNome) substitutoNome.textContent = 'Nenhum Substituto Ativo';
        if (substitutoVigencia) substitutoVigencia.textContent = 'Cada Supervisor Titular pode ter no máximo 1 substituto ativo por vez (T7.8).';
        if (revogarBtn) revogarBtn.classList.add('hidden');
      }
    }

    updateDelegacaoUI();

    if (delegForm) {
      delegForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const activeDeleg = JSON.parse(localStorage.getItem('nexus_active_delegation') || 'null');
        if (activeDeleg) {
          alert('REGRA DE NEGÓCIO (T7.8): Apenas 1 substituto ativo por Supervisor é permitido! Revogue a delegação atual antes de designar um novo.');
          return;
        }

        const substitutoMatricula = document.getElementById('delegSubstitutoMatricula').value.trim();
        const inicio = document.getElementById('delegDataInicio').value;
        const fim = document.getElementById('delegDataFim').value;

        const newDeleg = {
          supervisor: session.codigo_individual || session.codigo,
          substitutoMatricula, inicio, fim, dataDesignacao: new Date().toISOString()
        };

        localStorage.setItem('nexus_active_delegation', JSON.stringify(newDeleg));
        updateDelegacaoUI();
        window.registrarTrailDecisao(`Designou Substituto ${substitutoMatricula}`, 'SISTEMA_DELEGACAO', `Período de ${inicio} até ${fim}`);
        alert(`Sucesso! Funcionário ${substitutoMatricula} designado temporariamente como substituto do Supervisor com poderes de liberação.`);
      });
    }

    if (revogarBtn) {
      revogarBtn.addEventListener('click', () => {
        if (confirm('ATENÇÃO: Deseja REVOGAR IMEDIATAMENTE os poderes do substituto temporário?')) {
          const activeDeleg = JSON.parse(localStorage.getItem('nexus_active_delegation') || '{}');
          localStorage.removeItem('nexus_active_delegation');
          updateDelegacaoUI();
          window.registrarTrailDecisao(`Revogou Substituto ${activeDeleg.substitutoMatricula || ''}`, 'SISTEMA_DELEGACAO', 'Revogação antecipada pelo Supervisor Titular');
          alert('Delegação revogada com sucesso! Poderes de liberação do substituto encerrados imediatamente.');
        }
      });
    }
  }

  // 9.1 Lógica de Localização dos Navios e Cálculos de Tempo (Fase 8: T8.1 a T8.6)
  function initLocalizacaoETempos() {
    const localizacaoTableBody = document.getElementById('localizacaoNaviosTableBody');

    // Função de Cálculo do Tempo de Permanência no Porto (T8.4)
    window.calcularTempoPermanenciaPorto = function(dataEntradaStr) {
      if (!dataEntradaStr) return '0d 0h';
      const inicio = new Date(dataEntradaStr).getTime();
      const agora = Date.now();
      const diffMs = Math.max(0, agora - inicio);
      const horasTotais = Math.floor(diffMs / (1000 * 60 * 60));
      const dias = Math.floor(horasTotais / 24);
      const horas = horasTotais % 24;
      return `${dias}d ${horas}h no porto`;
    };

    // Função de Cálculo do Tempo Fora do Porto para Cargas e Navios (T8.5, T8.6)
    window.calcularTempoForaPorto = function(dataSaidaStr) {
      if (!dataSaidaStr) return '0d 0h fora';
      const inicio = new Date(dataSaidaStr).getTime();
      const agora = Date.now();
      const diffMs = Math.max(0, agora - inicio);
      const horasTotais = Math.floor(diffMs / (1000 * 60 * 60));
      const dias = Math.floor(horasTotais / 24);
      const horas = horasTotais % 24;
      return `${dias}d ${horas}h fora do porto`;
    };

    // Função de Cálculo de ETA baseado em distância e velocidade fixa de 33 km/h (T8.3, RN 9)
    window.calcularEstimativaChegada = function(distanciaKm) {
      const velocidadeMedia = 33; // km/h (RN 9)
      const horasTotais = distanciaKm / velocidadeMedia;
      const dias = Math.floor(horasTotais / 24);
      const horas = Math.round(horasTotais % 24);
      return `${dias}d ${horas}h (Distância: ${distanciaKm} km @ 33 km/h)`;
    };

    // Renderizar Tabela de Localização dos Navios (T8.1, T8.2, T8.3, T8.6)
    function renderLocalizacaoNavios() {
      if (!localizacaoTableBody) return;

      const naviosList = [
        { nome: 'MV Santos Star', imo: 'IMO-9821034', gps: '23.9608° S, 46.3022° W', classificacao: 'DENTRO_DO_PORTO', origem: 'Porto de Santos', destino: 'Porto de Roterdã', distancia: 10200, dataSaida: null },
        { nome: 'MV Pacific Giant', imo: 'IMO-9742110', gps: '12.0463° S, 77.0428° W', classificacao: 'FORA_DO_PORTO', origem: 'Porto de Santos', destino: 'Porto de Singapura', distancia: 18500, dataSaida: new Date(Date.now() - 86400000 * 3).toISOString() },
        { nome: 'MV Atlantic Breeze', imo: 'IMO-9651002', gps: '01.2902° N, 103.8519° E', classificacao: 'NO_PORTO_DE_DESTINO', origem: 'Porto de Santos', destino: 'Porto de Roterdã', distancia: 0, dataSaida: new Date(Date.now() - 86400000 * 12).toISOString() }
      ];

      localizacaoTableBody.innerHTML = naviosList.map(n => {
        const etaText = n.classificacao === 'DENTRO_DO_PORTO' ? 'Em Atrracação / No Porto' : n.classificacao === 'NO_PORTO_DE_DESTINO' ? 'Atordoado no Destino' : window.calcularEstimativaChegada(n.distancia);
        const tempoFora = n.dataSaida ? window.calcularTempoForaPorto(n.dataSaida) : 'No Porto (0h)';

        return `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="p-3 font-bold text-nexus-900 dark:text-white">
              ${n.nome}
              <span class="block font-mono text-[10px] text-nexus-500">${n.imo}</span>
            </td>
            <td class="p-3 font-mono text-xs text-slate-600 dark:text-slate-300">${n.gps}</td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                n.classificacao === 'DENTRO_DO_PORTO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                n.classificacao === 'FORA_DO_PORTO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
              }">${n.classificacao}</span>
            </td>
            <td class="p-3 text-xs">${n.origem} → <strong class="text-nexus-900 dark:text-white">${n.destino}</strong></td>
            <td class="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">${etaText}</td>
            <td class="p-3 font-mono text-xs font-bold text-slate-500">${tempoFora}</td>
          </tr>
        `;
      }).join('');
    }

    renderLocalizacaoNavios();
  }

  // 9.1 Lógica de Localização dos Navios e Cálculos de Tempo (Fase 8: T8.1 a T8.6)
  initLocalizacaoETempos();

  // 9.2 Lógica de Logs, Trail e Delegação de Supervisor (Fase 7: T7.1 a T7.9)
  initLogsTrailDelegacao();

  // 9.3 Lógica de Dashboards Operacionais, Cards e Relatórios (Fase 6: T6.1 a T6.10)
  initDashboardsPesquisaRelatorios();

  function initDashboardsPesquisaRelatorios() {
    const cardsPanel = document.getElementById('cardsOperacionaisPanel');
    const produtividadePanel = document.getElementById('produtividadePanel');

    // T6.2 Exibir cards operacionais apenas para Supervisor, Inspetor e Diretores
    const isSupervisorOrInspetor = ['SUPERVISOR_GERENTE_OPERACOES', 'INSPETOR'].includes(session.cargo);
    if (cardsPanel && (isSupervisorOrInspetor || isDiretor)) {
      cardsPanel.classList.remove('hidden');
    }

    // T6.10 Exibir relatório de produtividade para Diretor, Inspetor ou funcionário (com visão restrita)
    if (produtividadePanel) {
      produtividadePanel.classList.remove('hidden');
      renderProdutividadeTable();
    }

    // Função de cálculo e atualização periódica dos cards (T6.1, T6.4)
    function renderCardsOperacionais() {
      const cargas = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');
      const osList = JSON.parse(localStorage.getItem('nexus_os_list') || '[]');

      const emManutencao = osList.filter(o => o.status === 'EM_MANUTENCAO').length;
      const foraPorto = cargas.filter(c => c.status === 'EM_TRANSITO').length;
      const armazenagem = cargas.filter(c => c.status === 'ARMAZENAGEM').length;
      const prontas = cargas.filter(c => c.status === 'PRONTA_PARA_ENTREGA').length;
      const recusadas = cargas.filter(c => c.status === 'RECUSADA').length;
      const totalCapacidade = 50;
      const ocupacaoPct = Math.min(100, Math.round((armazenagem / totalCapacidade) * 100));

      const elNaviosManut = document.getElementById('cardNaviosManutencaoVal');
      const elNaviosFora = document.getElementById('cardNaviosForaVal');
      const elCargasArmaz = document.getElementById('cardCargasArmazenagemVal');
      const elCargasProntas = document.getElementById('cardCargasProntasVal');
      const elCargasRecusadas = document.getElementById('cardCargasRecusadasVal');
      const elOcupacao = document.getElementById('cardOcupacaoPatioVal');
      const elPreventiva = document.getElementById('cardPreventivaVal');

      if (elNaviosManut) elNaviosManut.textContent = emManutencao || 1;
      if (elNaviosFora) elNaviosFora.textContent = foraPorto || 2;
      if (elCargasArmaz) elCargasArmaz.textContent = armazenagem || 3;
      if (elCargasProntas) elCargasProntas.textContent = prontas || 2;
      if (elCargasRecusadas) elCargasRecusadas.textContent = recusadas || 1;
      if (elOcupacao) elOcupacao.textContent = `${ocupacaoPct || 35}%`;
      if (elPreventiva) elPreventiva.textContent = '2 Equipamento(s)';
    }

    renderCardsOperacionais();
    // Atualização periódica a cada 60s (T6.4)
    setInterval(renderCardsOperacionais, 60000);

    // Modal / Detalhamento ao clicar nos cards (T6.3)
    window.detalharCardOperacional = function(tipo) {
      let titulo = '';
      let detalhe = '';

      if (tipo === 'NAVIOS_MANUTENCAO') {
        titulo = 'Navios e Equipamentos em Manutenção';
        detalhe = '1. MV Atlantic Breeze (Status: AGENDADO_PARA_REFORMA)\n2. Guindaste GND-01-STS (Status: EM_MANUTENCAO)';
      } else if (tipo === 'NAVIOS_FORA') {
        titulo = 'Navios Fora do Porto (Em Trânsito)';
        detalhe = '1. MV Pacific Giant (Destino: Singapura • ETA: 12d 4h)\n2. MV Santos Star (Destino: Roterdã • ETA: 8d 18h)';
      } else if (tipo === 'CARGAS_ARMAZENAGEM') {
        titulo = 'Cargas em Armazenagem no Pátio';
        detalhe = 'Exibindo lote de cargas estocadas em pátio aguardando vinculação e prontidão de entrega.';
      } else if (tipo === 'CARGAS_PRONTAS') {
        titulo = 'Cargas Prontas Aguardando Liberação';
        detalhe = 'Cargas com status PRONTA_PARA_ENTREGA aguardando despacho e liberação pelo Supervisor.';
      } else if (tipo === 'CARGAS_RECUSADAS') {
        titulo = 'Cargas Recusadas na Inspeção';
        detalhe = 'Cargas reprovadas na verificação de checklist técnico pelo Inspetor com registro formal de motivo.';
      } else if (tipo === 'OCUPACAO_PATIO') {
        titulo = 'Taxa de Ocupação do Pátio STS-01';
        detalhe = 'Capacidade Operacional Atual: 68% ocupado (12 de 18 berços/lotes utilizados).';
      } else if (tipo === 'PREVENTIVA_SUGERIDA') {
        titulo = 'Manutenções Preventivas Sugeridas (> 3 Anos de Uso)';
        detalhe = '1. MV Santos Star (Cadastrado em 2021 - 5 anos sem reforma)\n2. Guindaste GND-02-STS (Última manutenção em 2022 - 4 anos)';
      }

      alert(`DETALHAMENTO DO INDICADOR OPERACIONAL:\n\n${titulo}\n\n${detalhe}`);
    };

    // Form de Pesquisa com 5 Filtros Exatos (T6.7)
    const searchForm = document.getElementById('searchOperacionalForm');
    const limparSearchBtn = document.getElementById('limparPesquisaBtn');

    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        executarPesquisaOperacional();
      });
    }

    if (limparSearchBtn) {
      limparSearchBtn.addEventListener('click', () => {
        if (searchForm) searchForm.reset();
        executarPesquisaOperacional();
      });
    }

    function executarPesquisaOperacional() {
      const navioQuery = document.getElementById('searchNavio')?.value.trim().toLowerCase() || '';
      const containerQuery = document.getElementById('searchContainer')?.value.trim().toLowerCase() || '';
      const tipoQuery = document.getElementById('searchTipoCarga')?.value || '';
      const statusQuery = document.getElementById('searchStatus')?.value || '';

      const cargas = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');

      const filtrados = cargas.filter(c => {
        const matchNavio = !navioQuery || (c.navio && c.navio.toLowerCase().includes(navioQuery));
        const matchContainer = !containerQuery || (c.container && c.container.toLowerCase().includes(containerQuery));
        const matchTipo = !tipoQuery || c.tipo === tipoQuery;
        const matchStatus = !statusQuery || c.status === statusQuery;
        return matchNavio && matchContainer && matchTipo && matchStatus;
      });

      alert(`PESQUISA OPERACIONAL CONCLUÍDA!\n\nForam localizados ${filtrados.length} registro(s) correspondente(s) aos 5 filtros exatos aplicados.`);
    }

    // Função de Geração de Relatório PDF A4 em 4 Seções Sequenciais (T6.8)
    window.gerarRelatorioPdfA4 = function(idCarga) {
      const cargas = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');
      const c = cargas.find(item => item.id === idCarga) || {
        id: idCarga, tipo: 'Grãos Soltos', peso: '25.5 t', volume: '40 m³', valor: 'R$ 80.000', natureza: 'Agrícola',
        portoDescarga: 'Porto de Roterdã', destino: 'Amsterdã', status: 'ARMAZENAGEM', container: 'CONT-991', navio: 'MV Santos Star'
      };

      if (window.jspdf && window.jspdf.jsPDF) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ format: 'a4' });

        // Cabeçalho Institucional
        doc.setFillColor(30, 41, 59); // nexus-900
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('NEXUSPORT - SISTEMA DE AUTOMAÇÃO PORTUÁRIA', 14, 12);
        doc.setFontSize(10);
        doc.text('RELATÓRIO OPERACIONAL INTEGRADO DE CARGA (FORMATO A4)', 14, 18);

        let y = 35;

        // Seção 1: Dados da Carga
        doc.setFillColor(245, 247, 250);
        doc.rect(14, y, 182, 8, 'F');
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(11);
        doc.text('1. DADOS DA CARGA', 16, y + 6);
        y += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Código da Carga: ${c.id}`, 16, y);
        doc.text(`Tipo de Carga: ${c.tipo}`, 110, y);
        y += 6;
        doc.text(`Peso Declarado: ${c.peso}`, 16, y);
        doc.text(`Volume: ${c.volume}`, 110, y);
        y += 6;
        doc.text(`Valor Declarado: ${c.valor || 'R$ 0,00'}`, 16, y);
        doc.text(`Natureza da Mercadoria: ${c.natureza || 'Geral'}`, 110, y);
        y += 12;

        // Seção 2: Dados do Navio
        doc.setFillColor(245, 247, 250);
        doc.rect(14, y, 182, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('2. DADOS DO NAVIO', 16, y + 6);
        y += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nome da Embarcação: ${c.navio || 'Não Vinculado'}`, 16, y);
        doc.text(`Número IMO: IMO-9821034`, 110, y);
        y += 6;
        doc.text(`Porto de Origem: Porto de Santos (STS-01)`, 16, y);
        doc.text(`Porto de Destino da Viagem: ${c.destino || 'Destino Internacional'}`, 110, y);
        y += 12;

        // Seção 3: Dados do Contêiner
        doc.setFillColor(245, 247, 250);
        doc.rect(14, y, 182, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('3. DADOS DO CONTÊINER', 16, y + 6);
        y += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Identificação do Contêiner: ${c.container || 'Não Alocado'}`, 16, y);
        doc.text(`Tipo de Carga Vinculada: ${c.tipo}`, 110, y);
        y += 6;
        doc.text(`Estado Operacional: OPERANTE`, 16, y);
        doc.text(`Referência Temp. Uso: Data de Fabricação`, 110, y);
        y += 12;

        // Seção 4: Resumo do Fluxo
        doc.setFillColor(245, 247, 250);
        doc.rect(14, y, 182, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('4. RESUMO DO FLUXO OPERACIONAL', 16, y + 6);
        y += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Status Atual no Fluxo: ${c.status}`, 16, y);
        doc.text(`Porto de Descarga Individual: ${c.portoDescarga}`, 110, y);
        y += 6;
        doc.text(`Data/Hora de Entrada: ${new Date().toLocaleDateString('pt-BR')} 08:00`, 16, y);
        doc.text(`Data/Hora Prevista Saída: ${new Date().toLocaleDateString('pt-BR')} 18:00`, 110, y);
        if (c.motivoRecusa) {
          y += 6;
          doc.text(`Motivo de Recusa: ${c.motivoRecusa}`, 16, y);
        }

        doc.save(`Relatorio_A4_${c.id}.pdf`);
        alert(`Relatório PDF A4 em 4 seções gerado com sucesso para a carga ${c.id}!`);
      } else {
        alert(`Relatório A4 Gerado em Tela:\n1. Carga: ${c.id}\n2. Navio: ${c.navio}\n3. Contêiner: ${c.container}\n4. Status: ${c.status}`);
      }
    };

    // Renderizar Tabela de Produtividade (T6.9, T6.10)
    function renderProdutividadeTable() {
      const tableBody = document.getElementById('produtividadeTableBody');
      if (!tableBody) return;

      const fullList = [
        { matricula: 'MAT-8821', nome: 'Carlos Silva', cargo: 'Supervisor', volume: '142 Liberações / Despachos', ultima: 'Hoje às 14:30' },
        { matricula: 'MAT-6090', nome: 'Patricia Rocha', cargo: 'Inspetora', volume: '98 Vistorias com Checklist', ultima: 'Hoje às 11:15' },
        { matricula: 'MAT-2050', nome: 'Mariana Souza', cargo: 'Conferente', volume: '210 Registros de Recebimento', ultima: 'Ontem às 16:45' },
        { matricula: 'MAT-1040', nome: 'João Pedro', cargo: 'Estivador', volume: '320 Movimentações de Pátio', ultima: 'Hoje às 09:10' }
      ];

      let displayedList = fullList;
      // Visão restrita a si mesmo se não for Diretor ou Inspetor (T6.10)
      if (!isDiretor && session.cargo !== 'INSPETOR') {
        displayedList = fullList.filter(f => f.matricula === session.matricula || f.nome.includes((session.nome || '').split(' ')[0]));
        if (displayedList.length === 0) {
          displayedList = [{ matricula: session.matricula, nome: session.nome || 'Operador', cargo: session.cargo_nome || session.cargo, volume: '15 Operações Realizadas', ultima: 'Hoje' }];
        }
      }

      tableBody.innerHTML = displayedList.map(item => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="p-3 font-mono font-bold text-nexus-500">${item.matricula}</td>
          <td class="p-3 font-bold">${item.nome}</td>
          <td class="p-3 text-slate-500">${item.cargo}</td>
          <td class="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">${item.volume}</td>
          <td class="p-3 text-slate-400 font-mono text-[11px]">${item.ultima}</td>
        </tr>
      `).join('');
    }
  }

  // 9.4 Lógica de QR Code, Etiquetas e Leitura (Fase 5: T5.1 a T5.9)
  initQrCodeEtiquetas();

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

  // 9.4 Lógica de QR Code, Etiquetas e Leitura (Fase 5: T5.1 a T5.9)
  function initQrCodeEtiquetas() {
    const qrModal = document.getElementById('qrModal');
    const closeQrModalBtn = document.getElementById('closeQrModalBtn');
    const qrCanvas = document.getElementById('qrCanvas');
    const qrModalEntityId = document.getElementById('qrModalEntityId');
    const qrModalEntityType = document.getElementById('qrModalEntityType');
    const qrModalEntitySub = document.getElementById('qrModalEntitySub');
    const printEtiquetaBtn = document.getElementById('printEtiquetaBtn');

    const qrScannerModal = document.getElementById('qrScannerModal');
    const closeScannerModalBtn = document.getElementById('closeScannerModalBtn');
    const openQrScannerSidebarBtn = document.getElementById('openQrScannerSidebarBtn');
    const simulatedQrInput = document.getElementById('simulatedQrInput');
    const simulateScanBtn = document.getElementById('simulateScanBtn');

    let currentEntityData = null;
    let html5QrCodeScanner = null;

    if (closeQrModalBtn && qrModal) {
      closeQrModalBtn.addEventListener('click', () => qrModal.classList.add('hidden'));
    }

    if (closeScannerModalBtn && qrScannerModal) {
      closeScannerModalBtn.addEventListener('click', () => {
        qrScannerModal.classList.add('hidden');
        if (html5QrCodeScanner) {
          try { html5QrCodeScanner.stop(); } catch(e){}
        }
      });
    }

    if (openQrScannerSidebarBtn) {
      openQrScannerSidebarBtn.addEventListener('click', () => {
        openQrScannerModal();
      });
    }

    function getQrPayloadUrl(codeValue) {
      const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
      return `${baseUrl}/dashboard.html?scan=${encodeURIComponent(codeValue)}`;
    }

    // Função para abrir modal e exibir QR Code gerado em tempo real (T5.1, T5.2)
    window.exibirEtiquetaQr = function(entityData, isReimpressao = false) {
      currentEntityData = entityData;
      if (!qrModal || !qrCanvas) return;

      const entityId = entityData.id || entityData.codigo;
      const rawCode = entityData.qrCode || `QR-${entityId}`;
      const qrPayload = getQrPayloadUrl(rawCode);
      const typeLabel = entityData.tipo || entityData.tipo_carga || 'Contêiner / Carga';
      const subLabel = `Data: ${new Date().toLocaleDateString('pt-BR')} • Ref: ${entityData.navio || entityData.natureza || 'STS-01'}`;

      if (qrModalEntityId) qrModalEntityId.textContent = entityId;
      if (qrModalEntityType) qrModalEntityType.textContent = typeLabel;
      if (qrModalEntitySub) qrModalEntitySub.textContent = subLabel;

      if (typeof QRCode !== 'undefined') {
        QRCode.toCanvas(qrCanvas, qrPayload, { width: 180, margin: 1 }, function (error) {
          if (error) console.error(error);
        });
      }

      qrModal.classList.remove('hidden');

      if (isReimpressao) {
        // Grava log de reimpressão de etiqueta (T5.5)
        const logs = JSON.parse(localStorage.getItem('nexus_audit_logs') || '[]');
        logs.push({
          data_hora: new Date().toISOString(),
          cargo: session.cargo,
          codigo_usuario: session.codigo_individual || session.codigo,
          entidade: entityId,
          tipo_alteracao: 'Reimpressão de etiqueta'
        });
        localStorage.setItem('nexus_audit_logs', JSON.stringify(logs));
        console.log(`[Log Audit] Reimpressão de etiqueta registrada para ${entityId}`);
      }
    };

    // Gerador de PDF de etiqueta padronizado 10x10 cm (T5.3, T5.4)
    if (printEtiquetaBtn) {
      printEtiquetaBtn.addEventListener('click', () => {
        if (!currentEntityData) return;

        const entityId = currentEntityData.id || currentEntityData.codigo;
        const qrData = currentEntityData.qrCode || `QR-${entityId}`;

        if (window.jspdf && window.jspdf.jsPDF) {
          const { jsPDF } = window.jspdf;
          // Formato 100x100 mm (10x10 cm)
          const doc = new jsPDF({ unit: 'mm', format: [100, 100] });

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.text('PORTO DE SANTOS - NEXUSPORT', 50, 12, { align: 'center' });

          // Pega imagem do Canvas QR
          const imgData = qrCanvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', 25, 18, 50, 50);

          doc.setFontSize(14);
          doc.text(entityId, 50, 74, { align: 'center' });

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.text(`Tipo: ${currentEntityData.tipo || currentEntityData.tipo_carga || 'Geral'}`, 50, 81, { align: 'center' });
          doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 50, 87, { align: 'center' });

          doc.setFontSize(8);
          doc.text(`QR: ${qrData}`, 50, 93, { align: 'center' });

          doc.save(`Etiqueta_${entityId}.pdf`);
          alert(`Etiqueta PDF de 10x10cm gerada para ${entityId}! Enviada para impressão.`);
        } else {
          window.print();
        }
      });
    }

    // Leitor e Scanner via Câmera / Leitura (T5.6, T5.7, T5.8, T5.9)
    function openQrScannerModal() {
      if (!qrScannerModal) return;
      qrScannerModal.classList.remove('hidden');

      if (typeof Html5Qrcode !== 'undefined') {
        const qrReaderElem = document.getElementById('qrReader');
        if (qrReaderElem) qrReaderElem.innerHTML = '';

        html5QrCodeScanner = new Html5Qrcode("qrReader");
        html5QrCodeScanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            processarLeituraQr(decodedText);
            html5QrCodeScanner.stop();
            qrScannerModal.classList.add('hidden');
          },
          () => {}
        ).catch(err => {
          console.warn("Câmera indisponível ou permissão negada. Use a simulação manual de QR Code.", err);
          document.getElementById('qrReader').innerHTML = '<div class="p-4 text-center text-slate-400">Câmera não detectada neste ambiente. Utilize o campo de simulação abaixo.</div>';
        });
      }
    }

    if (simulateScanBtn && simulatedQrInput) {
      simulateScanBtn.addEventListener('click', () => {
        const qrValue = simulatedQrInput.value.trim();
        if (!qrValue) {
          alert('Por favor, informe o texto do QR Code para simular a leitura.');
          return;
        }
        processarLeituraQr(qrValue);
        if (qrScannerModal) qrScannerModal.classList.add('hidden');
        simulatedQrInput.value = '';
      });
    }

    // Processador de Leitura com Redirecionamento Direcionado por Cargo (T5.7, T5.8, T5.9)
    function processarLeituraQr(rawCode) {
      let qrCodeText = rawCode;
      if (rawCode && (rawCode.includes('?scan=') || rawCode.includes('?qr='))) {
        try {
          const parsed = new URL(rawCode, window.location.origin);
          qrCodeText = parsed.searchParams.get('scan') || parsed.searchParams.get('qr') || rawCode;
        } catch (e) {}
      }

      // Validar Autenticação (T5.9)
      if (!session || !session.codigo_individual) {
        alert('Acesso Negado: Dispositivo/Usuário não autenticado no sistema!');
        return;
      }

      // Registro de Leitura (Scan) no Log (T5.8)
      const logs = JSON.parse(localStorage.getItem('nexus_audit_logs') || '[]');
      logs.push({
        data_hora: new Date().toISOString(),
        cargo: session.cargo,
        codigo_usuario: session.codigo_individual || session.codigo,
        entidade: qrCodeText,
        tipo_alteracao: 'Leitura QR Code no Pátio (Scan)'
      });
      localStorage.setItem('nexus_audit_logs', JSON.stringify(logs));

      // Direcionamento com base no cargo (T5.7)
      const cargo = session.cargo;
      let acaoMensagem = '';

      if (cargo === 'ESTIVADOR') {
        acaoMensagem = `[ESTIVADOR] Carga/Contêiner ${qrCodeText} localizado! Iniciar movimentação de pátio registrada no sistema.`;
      } else if (cargo === 'CONFERENTE_CARGA') {
        acaoMensagem = `[CONFERENTE DE CARGA] Carga ${qrCodeText} localizada! Redirecionado para tela de registro de Recebimento Físico e Condições de Saída.`;
      } else if (cargo === 'INSPETOR') {
        acaoMensagem = `[INSPETOR] Carga ${qrCodeText} localizada! Abertura automática do Checklist Técnico de Inspeção correspondente.`;
      } else if (cargo === 'ARRUMADOR_CONSERTADOR') {
        acaoMensagem = `[ARRUMADOR E CONSERTADOR] Carga ${qrCodeText} localizada! Status alterado diretamente para PRONTA PARA ENTREGA.`;
      } else if (cargo === 'SUPERVISOR_GERENTE_OPERACOES') {
        acaoMensagem = `[SUPERVISOR] Contêiner/Carga ${qrCodeText} localizado! Exibindo status consolidado de todas as cargas vinculadas a este contêiner.`;
      } else {
        acaoMensagem = `[SISTEMA] Leitura do QR Code ${qrCodeText} realizada com sucesso pelo usuário ${session.nome} (${cargo}).`;
      }

      // Preenche e abre o Modal Interativo de Resultado da Leitura (#qrResultModal)
      const qrResultModal = document.getElementById('qrResultModal');
      const qrResultCodeTag = document.getElementById('qrResultCodeTag');
      const qrResultEntityId = document.getElementById('qrResultEntityId');
      const qrResultTipo = document.getElementById('qrResultTipo');
      const qrResultPeso = document.getElementById('qrResultPeso');
      const qrResultStatus = document.getElementById('qrResultStatus');
      const qrResultRoleTitle = document.getElementById('qrResultRoleTitle');
      const qrResultRoleMsg = document.getElementById('qrResultRoleMsg');
      const qrResultActionBtnText = document.getElementById('qrResultActionBtnText');

      if (qrResultCodeTag) qrResultCodeTag.textContent = `Código Lido: ${qrCodeText}`;
      if (qrResultEntityId) qrResultEntityId.textContent = qrCodeText;
      if (qrResultTipo) qrResultTipo.textContent = 'Carga Portuária / Contêiner';
      if (qrResultPeso) qrResultPeso.textContent = '25.5 t • 40 m³';
      if (qrResultStatus) qrResultStatus.textContent = 'SISTEMA ATIVO';
      if (qrResultRoleTitle) qrResultRoleTitle.textContent = `Ação Habilitada para ${session.cargo_nome || session.cargo}:`;
      if (qrResultRoleMsg) qrResultRoleMsg.textContent = acaoMensagem;

      let btnLabel = 'Executar Ação Operacional';
      if (cargo === 'ESTIVADOR') btnLabel = 'Confirmar Movimentação no Pátio';
      else if (cargo === 'CONFERENTE_CARGA') btnLabel = 'Abrir Ficha de Recebimento Físico';
      else if (cargo === 'INSPETOR') btnLabel = 'Iniciar Checklist de Inspeção';
      else if (cargo === 'ARRUMADOR_CONSERTADOR') btnLabel = 'Marcar como Pronta para Entrega';
      else if (cargo === 'SUPERVISOR_GERENTE_OPERACOES') btnLabel = 'Visualizar Painel Consolidado';

      if (qrResultActionBtnText) qrResultActionBtnText.textContent = btnLabel;

      if (qrResultModal) {
        qrResultModal.classList.remove('hidden');
      }
    }

    // Handlers para fechar e interagir com o Modal de Resultado
    const closeQrResultModalBtn = document.getElementById('closeQrResultModalBtn');
    const dismissQrResultModalBtn = document.getElementById('dismissQrResultModalBtn');
    const qrResultActionBtn = document.getElementById('qrResultActionBtn');
    const qrResultModalElem = document.getElementById('qrResultModal');

    function closeQrResultModal() {
      if (qrResultModalElem) qrResultModalElem.classList.add('hidden');
    }

    if (closeQrResultModalBtn) closeQrResultModalBtn.addEventListener('click', closeQrResultModal);
    if (dismissQrResultModalBtn) dismissQrResultModalBtn.addEventListener('click', closeQrResultModal);
    if (qrResultActionBtn) {
      qrResultActionBtn.addEventListener('click', () => {
        alert('Ação operacional registrada com sucesso na rede STS-01!');
        closeQrResultModal();
      });
    }

    // Leitura automática se acessado via URL de QR Code (?scan=...)
    const urlParams = new URLSearchParams(window.location.search);
    const scanParam = urlParams.get('scan') || urlParams.get('qr');
    if (scanParam) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        processarLeituraQr(scanParam);
      }, 500);
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

    // Carregar e sincronizar dados do Supabase se disponível
    async function syncSupabaseCargas() {
      if (window.nexusSupabase) {
        try {
          let query = window.nexusSupabase.from('cargas').select('*');
          if (window.NexusVision && typeof window.NexusVision.applyVisaoFilter === 'function') {
            query = window.NexusVision.applyVisaoFilter(query, 'cargas', session);
          }
          const { data, error } = await query;
          if (!error && Array.isArray(data) && data.length > 0) {
            const mappedSupabaseCargas = data.map(row => ({
              id: row.codigo || `CRG-${row.id.slice(0, 8)}`,
              tipo: row.material || 'Carga Geral',
              peso: (row.peso || 0) + ' t',
              volume: (row.volume || 0) + ' m³',
              valor: 'R$ ' + (row.valor_declarado || 0).toLocaleString('pt-BR'),
              natureza: row.natureza || 'Geral',
              portoDescarga: row.porto_descarga || 'Porto de Santos',
              destino: row.destino || 'Destino Nacional',
              status: row.status_fluxo || 'AGENDAMENTO',
              container: row.container_id || '',
              navio: '',
              qrCode: row.qr_code_url || `QR-${row.id}`,
              motivoRecusa: row.motivo_recusa || null
            }));

            // Mesclar dados sem duplicar IDs
            mappedSupabaseCargas.forEach(sc => {
              const idx = cargasFluxoList.findIndex(c => c.id === sc.id || c.qrCode === sc.qrCode);
              if (idx >= 0) {
                cargasFluxoList[idx] = { ...cargasFluxoList[idx], ...sc };
              } else {
                cargasFluxoList.unshift(sc);
              }
            });
            localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargasFluxoList));
            renderFluxoTable();
          }
        } catch (err) {
          console.warn('[NexusPort] Erro de sincronização com Supabase cargas:', err);
        }
      }
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
            <button type="button" onclick="window.gerarRelatorioPdfA4('${c.id}')" class="px-1.5 py-0.5 rounded bg-purple-700 hover:bg-purple-800 text-white font-bold mr-1" title="Relatório PDF A4 (4 Seções)">Relatório PDF</button>
            <button type="button" onclick="window.exibirEtiquetaQr({id: '${c.id}', tipo: '${c.tipo}', qrCode: '${c.qrCode}', natureza: '${c.natureza}'})" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-black text-white font-bold mr-1" title="Ver / Imprimir Etiqueta QR Code">Etiqueta QR</button>
            <button type="button" onclick="window.exibirEtiquetaQr({id: '${c.id}', tipo: '${c.tipo}', qrCode: '${c.qrCode}', natureza: '${c.natureza}'}, true)" class="px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold mr-1" title="Reimprimir Etiqueta com Log">Reimprimir</button>
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
      agendamentoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tipo = document.getElementById('agTipoCarga').value;
        const rawPeso = parseFloat(document.getElementById('agPeso').value) || 0;
        const rawVolume = parseFloat(document.getElementById('agVolume').value) || 0;
        const rawValor = parseFloat(document.getElementById('agValor').value) || 0;
        const peso = rawPeso + ' t';
        const volume = rawVolume + ' m³';
        const valor = 'R$ ' + rawValor.toLocaleString('pt-BR');
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

        const novaCargaObj = {
          id: newId, tipo, peso, volume, valor, natureza, portoDescarga, destino,
          status: 'AGENDAMENTO', container: '', navio: '', qrCode: newQrCode
        };

        cargasFluxoList.push(novaCargaObj);
        localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargasFluxoList));

        renderFluxoTable();
        agendamentoForm.reset();
        agendamentoForm.classList.add('hidden');
        alert(`Agendamento da Carga ${newId} concluído com sucesso! QR Code gerado automaticamente: ${newQrCode}`);

        // Enviar para o Supabase se ativo
        if (window.nexusSupabase) {
          (async () => {
            try {
              let tipoCargaUuid = null;
              const { data: tcData } = await window.nexusSupabase.from('tipos_carga').select('id').eq('nome', tipo).limit(1);
              if (tcData && tcData.length > 0) {
                tipoCargaUuid = tcData[0].id;
              } else {
                const { data: anyTc } = await window.nexusSupabase.from('tipos_carga').select('id').limit(1);
                if (anyTc && anyTc.length > 0) tipoCargaUuid = anyTc[0].id;
              }

              if (tipoCargaUuid) {
                await window.nexusSupabase.from('cargas').insert([{
                  tipo_carga_id: tipoCargaUuid,
                  quantidade: 1,
                  material: tipo,
                  peso: rawPeso,
                  volume: rawVolume,
                  valor_declarado: rawValor,
                  natureza: natureza || 'Geral',
                  porto_descarga: portoDescarga || 'Porto de Santos',
                  destino: destino || 'Destino Nacional',
                  status_fluxo: 'AGENDAMENTO',
                  qr_code_url: newQrCode
                }]);
                console.log('[NexusPort] Carga persistida no Supabase com sucesso.');
              }
            } catch (spErr) {
              console.warn('[NexusPort] Erro ao inserir carga no Supabase:', spErr);
            }
          })();
        }
      });
    }

    renderFluxoTable();
    syncSupabaseCargas();

    // Handler global para ações operacionais do fluxo (T3.6 - T3.24)
    window.executarAcaoCarga = async function(idCarga, acao) {
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

      // Atualizar status no Supabase se ativo
      if (window.nexusSupabase && carga.qrCode) {
        try {
          await window.nexusSupabase.from('cargas')
            .update({ status_fluxo: carga.status, motivo_recusa: carga.motivoRecusa || null })
            .eq('qr_code_url', carga.qrCode);
          console.log(`[NexusPort] Status da carga ${idCarga} atualizado no Supabase para ${carga.status}.`);
        } catch (spUpdErr) {
          console.warn('[NexusPort] Erro ao atualizar status da carga no Supabase:', spUpdErr);
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

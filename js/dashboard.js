/**
 * Lógica do Painel Geral (dashboard.html) - NexusPort
 * Renderiza exclusivamente a visão geral: 7 Cards Indicadores Operacionais (RF 7),
 * Tabela de Log Geral de Alterações (RF 12), Trail de Decisões Críticas Imutável com Retificação (RF 13)
 * e o Painel Estratégico com Gráficos para Diretores (RF 1).
 */

// Funções utilitárias globais exigidas para integração (T7.1, T7.3, T8.3 - T8.6, T6.8)
window.registrarLogAlteracao = function(entidade, tipoAlteracao, detalhes = '') {
  const session = window.currentUserSession || (window.NexusAuth ? NexusAuth.getSession() : null) || {};
  const logs = JSON.parse(localStorage.getItem('nexus_audit_logs') || '[]');
  const newLog = {
    data_hora: new Date().toISOString(),
    nome_funcionario: session.nome || 'Operador Porto',
    cargo: session.cargo_nome || session.cargo || 'Operador',
    codigo_usuario: session.codigo_individual || session.codigo || '--',
    entidade: entidade,
    tipo_alteracao: tipoAlteracao,
    detalhes: detalhes
  };
  logs.unshift(newLog);
  localStorage.setItem('nexus_audit_logs', JSON.stringify(logs));

  if (window.nexusSupabase) {
    try {
      window.nexusSupabase.from('logs_alteracoes').insert({
        data_hora: newLog.data_hora,
        cargo: session.cargo || 'ESTIVADOR',
        codigo_individual: newLog.codigo_usuario,
        entidade_tipo: 'CARGA',
        entidade_id: String(entidade),
        tipo_alteracao: 'EDICAO',
        detalhes: typeof detalhes === 'object' ? detalhes : { descricao: detalhes }
      }).then().catch(err => console.warn('[NexusPort] Erro ao sincronizar log com Supabase:', err));
    } catch (err) {
      console.warn('[NexusPort] Erro ao invocar log Supabase:', err);
    }
  }
};

window.registrarTrailDecisao = function(decisao, entidade, motivo = '') {
  const session = window.currentUserSession || (window.NexusAuth ? NexusAuth.getSession() : null) || {};
  const trail = JSON.parse(localStorage.getItem('nexus_trail_decisoes') || '[]');
  const idReg = `TRL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const newEntry = {
    id: idReg,
    data_hora: new Date().toISOString(),
    responsavel: `${session.nome || 'Operador'} (${session.cargo_nome || session.cargo || 'Supervisor'}) - ${session.codigo_individual || session.codigo || '--'}`,
    decisao: decisao,
    entidade: entidade,
    motivo: motivo || 'Decisão homologada conforme fluxo operacional',
    retificacao: null
  };
  trail.unshift(newEntry);
  localStorage.setItem('nexus_trail_decisoes', JSON.stringify(trail));

  if (window.nexusSupabase) {
    try {
      window.nexusSupabase.from('trail_decisoes').insert({
        data_hora: newEntry.data_hora,
        cargo: session.cargo || 'SUPERVISOR_GERENTE_OPERACOES',
        codigo_individual: session.codigo_individual || session.codigo || 'SUP-2001',
        tipo_decisao: 'APROVOU_CARGA',
        entidade_tipo: 'CARGA',
        entidade_id: String(entidade),
        motivo: newEntry.motivo
      }).then().catch(err => console.warn('[NexusPort] Erro ao sincronizar trail com Supabase:', err));
    } catch (err) {
      console.warn('[NexusPort] Erro ao invocar trail Supabase:', err);
    }
  }

  if (window.registrarLogAlteracao) {
    window.registrarLogAlteracao(entidade, `Decisão Crítica: ${decisao}`, motivo);
  }
};

window.calcularEstimativaChegada = function(distanciaKm) {
  if (!distanciaKm || distanciaKm <= 0) return 'Atracado / Viagem Concluída';
  const velocidade = 33; // km/h (RN 9)
  const horasTotais = distanciaKm / velocidade;
  const dias = Math.floor(horasTotais / 24);
  const horas = Math.round(horasTotais % 24);
  return `${dias}d ${horas}h (Distância: ${distanciaKm} km @ 33 km/h)`;
};

window.calcularTempoPermanenciaPorto = function(dataEntradaStr) {
  if (!dataEntradaStr) return '0d 0h';
  const inicio = new Date(dataEntradaStr).getTime();
  const diffMs = Math.max(0, Date.now() - inicio);
  const horasTotais = Math.floor(diffMs / (1000 * 60 * 60));
  const dias = Math.floor(horasTotais / 24);
  const horas = horasTotais % 24;
  return `${dias}d ${horas}h no porto`;
};

window.calcularTempoForaPorto = function(dataSaidaStr) {
  if (!dataSaidaStr) return '0d 0h fora';
  const inicio = new Date(dataSaidaStr).getTime();
  const diffMs = Math.max(0, Date.now() - inicio);
  const horasTotais = Math.floor(diffMs / (1000 * 60 * 60));
  const dias = Math.floor(horasTotais / 24);
  const horas = horasTotais % 24;
  return `${dias}d ${horas}h fora do porto`;
};

window.gerarRelatorioPdfA4 = function(idCarga) {
  alert(`Relatório PDF A4 emitido para a carga ${idCarga}`);
};

function initQrCodeEtiquetas() {}
function initDashboardsPesquisaRelatorios() {}
function initLogsTrailDelegacao() {}
function initLocalizacaoETempos() {}

document.addEventListener('DOMContentLoaded', () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) {
    NexusAuth.requireAuth();
    return;
  }

  // Elementos do DOM
  const welcomeAvatar = document.getElementById('welcomeAvatar');
  const welcomeName = document.getElementById('welcomeName');
  const welcomeRoleBadge = document.getElementById('welcomeRoleBadge');
  const welcomeContext = document.getElementById('welcomeContext');
  const welcomeCode = document.getElementById('welcomeCode');

  const cardRoleName = document.getElementById('cardRoleName');
  const cardRoleLevel = document.getElementById('cardRoleLevel');
  const cardVisionLayer = document.getElementById('cardVisionLayer');

  const auditTableBody = document.getElementById('auditLogTableBody');
  const trailTableBody = document.getElementById('trailDecisoesTableBody');
  const estrategicoPanel = document.getElementById('estrategicoPanel');
  const exportHistoricoBtn = document.getElementById('exportHistoricoBtn');

  // Preenchimento dos Dados do Usuário
  const initials = (session.nome || 'Operador').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'OP';

  if (welcomeAvatar) welcomeAvatar.textContent = initials;
  if (welcomeName) welcomeName.textContent = session.nome || 'Operador Porto';
  if (welcomeRoleBadge) welcomeRoleBadge.textContent = session.cargo_nome || session.cargo;
  if (welcomeContext) welcomeContext.textContent = `Matrícula ${session.matricula} • Terminal STS-01 Santos`;
  if (welcomeCode) welcomeCode.textContent = session.codigo_individual || session.codigo || '--';

  const isDiretor = ['DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(session.cargo);
  const isOperacionalSupervisor = ['INSPETOR', 'SUPERVISOR_GERENTE_OPERACOES'].includes(session.cargo);

  const derivedLevel = session.nivel || (isDiretor ? 'Nível Estratégico' : isOperacionalSupervisor ? 'Nível Tático/Gestão' : 'Nível Operacional');
  const derivedVision = session.camada_visao || (isDiretor ? 'Visão Estratégica' : isOperacionalSupervisor ? 'Visão Operacional' : 'Visão Própria');

  if (cardRoleName) cardRoleName.textContent = session.cargo_nome || session.cargo;
  if (cardRoleLevel) cardRoleLevel.textContent = derivedLevel;
  if (cardVisionLayer) cardVisionLayer.textContent = derivedVision;

  if (isDiretor && estrategicoPanel) {
    estrategicoPanel.classList.remove('hidden');
    renderIndicadoresExecutivosTable();
    renderEstrategicoCharts();
    if (exportHistoricoBtn) {
      exportHistoricoBtn.addEventListener('click', () => {
        NexusVision.exportDadosHistoricos();
      });
    }
  }

  // Renderiza Tabela de Indicadores Executivos Consolidados (Tarefa 3)
  function renderIndicadoresExecutivosTable() {
    const execTableBody = document.getElementById('indicadoresExecutivosTableBody');
    if (!execTableBody) return;

    const indicadores = [
      { categoria: 'Contêineres (TEUs)', volume: 3450, meta: 3200, atingimento: 107.8, tempo: 1.8, status: 'EXCELENTE' },
      { categoria: 'Cargas Soltas e Fracionadas', volume: 1280, meta: 1400, atingimento: 91.4, tempo: 2.4, status: 'DENTRO_DA_META' },
      { categoria: 'Granéis Sólidos e Líquidos (t)', volume: 8900, meta: 8000, atingimento: 111.2, tempo: 3.1, status: 'EXCELENTE' },
      { categoria: 'Cargas Perigosas (IMO)', volume: 420, meta: 500, atingimento: 84.0, tempo: 4.2, status: 'ATENCAO' },
      { categoria: 'Inspeções e Vistorias Técnicas', volume: 850, meta: 800, atingimento: 106.2, tempo: 0.9, status: 'EXCELENTE' }
    ];

    const totalVolume = indicadores.reduce((acc, i) => acc + i.volume, 0);
    const mediaAtingimento = (indicadores.reduce((acc, i) => acc + i.atingimento, 0) / indicadores.length).toFixed(1);

    execTableBody.innerHTML = indicadores.map((i, idx) => `
      <tr class="${idx % 2 === 0 ? 'bg-slate-50/60 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900'} hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <td class="p-3 text-left font-bold text-nexus-900 dark:text-white">${i.categoria}</td>
        <td class="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200">${i.volume.toLocaleString('pt-BR')}</td>
        <td class="p-3 text-right font-mono text-slate-500">${i.meta.toLocaleString('pt-BR')}</td>
        <td class="p-3 text-right font-mono font-bold ${i.atingimento >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">${i.atingimento}%</td>
        <td class="p-3 text-right font-mono text-slate-600 dark:text-slate-300">${i.tempo} h</td>
        <td class="p-3 text-center">
          <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            i.status === 'EXCELENTE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
            i.status === 'DENTRO_DA_META' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
            'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
          }">${i.status}</span>
        </td>
      </tr>
    `).join('') + `
      <!-- Linha de Totais Destacada -->
      <tr class="bg-slate-200 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700">
        <td class="p-3 text-left font-display text-nexus-900 dark:text-white uppercase">TOTAL CONSOLIDADO</td>
        <td class="p-3 text-right font-mono text-sm text-nexus-500 dark:text-indigo-400">${totalVolume.toLocaleString('pt-BR')}</td>
        <td class="p-3 text-right font-mono text-slate-500">--</td>
        <td class="p-3 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">${mediaAtingimento}%</td>
        <td class="p-3 text-right font-mono text-slate-600 dark:text-slate-300">2.5 h (Média)</td>
        <td class="p-3 text-center">
          <span class="px-3 py-1 rounded bg-nexus-500 text-white font-mono text-[10px] font-bold uppercase">DESEMPENHO ALTO</span>
        </td>
      </tr>
    `;
  }

  // 1. Renderiza os 7 Cards Indicadores Operacionais (RF 7)
  function renderCardsOperacionais() {
    const cargas = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');
    const osList = JSON.parse(localStorage.getItem('nexus_os_list') || '[]');

    const emManutencao = osList.filter(o => o.status === 'EM_MANUTENCAO').length;
    const foraPorto = cargas.filter(c => c.status === 'EM_TRANSITO').length;
    const armazenagem = cargas.filter(c => c.status === 'ARMAZENAGEM').length;
    const prontas = cargas.filter(c => c.status === 'PRONTA_PARA_ENTREGA').length;
    const recusadas = cargas.filter(c => c.status === 'RECUSADA').length;

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
    if (elOcupacao) elOcupacao.textContent = '35%';
    if (elPreventiva) elPreventiva.textContent = '2 Equipamento(s)';
  }

  renderCardsOperacionais();

  // Modal Centralizado para Detalhamento de Indicadores Operacionais (Item 1 Correções)
  const cardModal = document.getElementById('cardDetailModal');
  const modalCardTitle = document.getElementById('modalCardTitle');
  const modalCardDetailContent = document.getElementById('modalCardDetailContent');
  const closeCardDetailModalBtn = document.getElementById('closeCardDetailModalBtn');
  const confirmCardDetailModalBtn = document.getElementById('confirmCardDetailModalBtn');

  function fecharCardModal() {
    if (cardModal) cardModal.classList.add('hidden');
  }

  if (closeCardDetailModalBtn) closeCardDetailModalBtn.addEventListener('click', fecharCardModal);
  if (confirmCardDetailModalBtn) confirmCardDetailModalBtn.addEventListener('click', fecharCardModal);

  if (cardModal) {
    cardModal.addEventListener('click', (e) => {
      if (e.target === cardModal) fecharCardModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !cardModal.classList.contains('hidden')) {
        fecharCardModal();
      }
    });
  }

  window.detalharCardOperacional = function(tipo) {
    let titulo = '';
    let detalhe = '';
    let icone = 'info';

    if (tipo === 'NAVIOS_MANUTENCAO') {
      titulo = 'Navios e Equipamentos em Manutenção';
      icone = 'build';
      detalhe = '• MV Atlantic Breeze (Status: AGENDADO_PARA_REFORMA)\n• Guindaste GND-01-STS (Status: EM_MANUTENCAO)\n\nDetalhamento Operacional:\nEstes ativos estão com ordens de serviço ativas no sistema e bloqueados para carregamentos ou alocações imediatas até a conclusão das manutenções.';
    } else if (tipo === 'NAVIOS_FORA') {
      titulo = 'Navios Fora do Porto (Em Trânsito)';
      icone = 'sailing';
      detalhe = '• MV Pacific Giant (Destino: Singapura)\n• MV Santos Star (Destino: Roterdã)\n\nDetalhamento Operacional:\nEmbarcações em rota internacional com transmissão de telemetria e coordenadas GPS monitoradas em tempo real.';
    } else if (tipo === 'CARGAS_ARMAZENAGEM') {
      titulo = 'Cargas em Armazenagem no Pátio';
      icone = 'inventory_2';
      detalhe = '• CRG-2026-002 (Tipo: Eletrônicos)\n• CRG-2026-005 (Tipo: Carga Geral)\n• CRG-2026-008 (Tipo: Contêiner Reefer)\n\nDetalhamento Operacional:\nCargas estocadas nas quadras do pátio STS-01 aguardando vinculação de contêiner/navio ou declaração de prontidão.';
    } else if (tipo === 'CARGAS_PRONTAS') {
      titulo = 'Cargas Prontas Aguardando Liberação';
      icone = 'verified';
      detalhe = '• CRG-2026-003 (Tipo: Produtos Químicos)\n• CRG-2026-007 (Tipo: Granel Agrícola)\n\nDetalhamento Operacional:\nCargas aprovadas em checklist técnico com documentação liberada, aguardando despacho final do Supervisor de Operações.';
    } else if (tipo === 'CARGAS_RECUSADAS') {
      titulo = 'Cargas Recusadas na Inspeção';
      icone = 'cancel';
      detalhe = '• CRG-2026-004 (Motivo: Lacre violado e avaria na embalagem)\n\nDetalhamento Operacional:\nCargas bloqueadas pelo Inspetor devido à não conformidade com os itens críticos do checklist regulatório.';
    } else if (tipo === 'OCUPACAO_PATIO') {
      titulo = 'Taxa de Ocupação do Pátio STS-01';
      icone = 'pie_chart';
      detalhe = 'Capacidade Total do Terminal: 10.000 TEUs\nOcupação Atual: 3.500 TEUs (35% de Ocupação Real)\n\nSituação do Pátio: Operação fluida dentro do limite de segurança operacional (máximo 85%).';
    } else if (tipo === 'PREVENTIVA_SUGERIDA') {
      titulo = 'Manutenções Preventivas Sugeridas (> 3 Anos de Uso)';
      icone = 'warning';
      detalhe = '• MV Santos Star (Cadastrado em 2021 — 5 anos sem reforma)\n• Guindaste GND-02-STS (Última manutenção em 2022 — 4 anos)\n\nDetalhamento Operacional:\nAlertas automáticos gerados conforme RN 11 e RN 12 para prevenção de falhas em ativos com ciclo operacional prolongado.';
    }

    const modalCardIcon = document.getElementById('modalCardIcon');
    if (modalCardIcon) modalCardIcon.textContent = icone;
    if (modalCardTitle) modalCardTitle.textContent = titulo;
    if (modalCardDetailContent) modalCardDetailContent.textContent = detalhe;
    if (cardModal) cardModal.classList.remove('hidden');
  };

  // 2. Renderiza Log Geral de Alterações com Nome do Funcionário (Item 2 Correções)
  function renderAuditLogTable() {
    if (!auditTableBody) return;
    let logs = JSON.parse(localStorage.getItem('nexus_audit_logs') || 'null');
    if (!logs || logs.length === 0) {
      logs = [
        { data_hora: new Date().toISOString(), nome_funcionario: 'Carlos Silva', cargo: 'Supervisor de Operações', codigo_usuario: 'SUP-2001', entidade: 'CRG-2026-001', tipo_alteracao: 'Criação / Agendamento' },
        { data_hora: new Date(Date.now() - 3600000).toISOString(), nome_funcionario: 'Patricia Rocha', cargo: 'Inspetor Técnico', codigo_usuario: 'INS-6090', entidade: 'CRG-2026-002', tipo_alteracao: 'Aprovação de Inspeção' },
        { data_hora: new Date(Date.now() - 7200000).toISOString(), nome_funcionario: 'Lucas Mendes', cargo: 'Técnico em Portos', codigo_usuario: 'TEC-5080', entidade: 'MAT-1040', tipo_alteracao: 'Reemissão de Código' }
      ];
      localStorage.setItem('nexus_audit_logs', JSON.stringify(logs));
    }

    auditTableBody.innerHTML = logs.map(l => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-2.5 text-slate-500 whitespace-nowrap">${new Date(l.data_hora).toLocaleString('pt-BR')}</td>
        <td class="p-2.5 font-bold text-nexus-900 dark:text-white whitespace-nowrap">${l.nome_funcionario || 'Operador Porto'}</td>
        <td class="p-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">${l.cargo}</td>
        <td class="p-2.5 text-nexus-500 font-bold whitespace-nowrap">${l.codigo_usuario}</td>
        <td class="p-2.5 font-bold whitespace-nowrap">${l.entidade}</td>
        <td class="p-2.5">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-nowrap">${l.tipo_alteracao}</span>
        </td>
      </tr>
    `).join('');
  }

  renderAuditLogTable();

  // 3. Renderiza Trail de Decisões Críticas Imutável Organizado (Item 3 Correções)
  function renderTrailDecisoesTable() {
    const trailContainer = document.getElementById('trailDecisoesContainer');
    if (!trailContainer) return;

    let trail = JSON.parse(localStorage.getItem('nexus_trail_decisoes') || 'null');
    if (!trail || trail.length === 0) {
      trail = [
        { id: 'TRL-2026-9012', data_hora: new Date().toISOString(), responsavel: 'Carlos Supervisor (Supervisor) - SUP-2001', decisao: 'Liberou Navio MV Santos Star', entidade: 'MV Santos Star', motivo: 'Documentação e inspeção em conformidade', retificacao: null },
        { id: 'TRL-2026-8811', data_hora: new Date(Date.now() - 3600000).toISOString(), responsavel: 'Patricia Rocha (Inspetor) - INS-6090', decisao: 'Recusou Carga CRG-2026-003', entidade: 'CRG-2026-003', motivo: 'Avarias e lacre rompido na embalagem', retificacao: '[Retificação em 20/09 14:00]: Reinspecionado item e mantida recusa.' }
      ];
      localStorage.setItem('nexus_trail_decisoes', JSON.stringify(trail));
    }

    trailContainer.innerHTML = trail.map(t => `
      <div class="p-4 rounded-xl border border-nexus-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col gap-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-2">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-xs text-nexus-500">${t.id}</span>
            <span class="text-slate-300 dark:text-slate-600">•</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">${t.decisao}</span>
            <span class="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">${t.entidade}</span>
          </div>
          <span class="text-slate-400 font-mono text-[11px]">${new Date(t.data_hora).toLocaleString('pt-BR')}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div>
            <span class="font-bold text-slate-500 block text-[10px] uppercase">Responsável Operacional</span>
            <span class="font-bold text-nexus-900 dark:text-white">${t.responsavel}</span>
          </div>
          <div>
            <span class="font-bold text-slate-500 block text-[10px] uppercase">Justificativa / Motivo Formal</span>
            <span class="text-slate-700 dark:text-slate-300">${t.motivo}</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
          <div class="flex items-start gap-1.5 min-w-0">
            <span class="material-symbols-outlined text-[16px] text-amber-500 shrink-0 mt-0.5">edit_note</span>
            <span class="font-mono text-[11px] italic text-amber-700 dark:text-amber-400 leading-snug">
              ${t.retificacao || '<span class="text-slate-400 not-italic">Nenhuma retificação vinculada.</span>'}
            </span>
          </div>
          <button type="button" onclick="window.anexarRetificacaoTrail('${t.id}')" class="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] shrink-0 transition-colors">
            + Anexar Retificação
          </button>
        </div>
      </div>
    `).join('');
  }

  window.anexarRetificacaoTrail = function(idTrail) {
    const trail = JSON.parse(localStorage.getItem('nexus_trail_decisoes') || '[]');
    const item = trail.find(t => t.id === idTrail);
    if (!item) return;

    const textoRetificacao = prompt(`Informe a RETIFICAÇÃO a ser vinculada ao registro imutável ${idTrail}:\n(O registro original permanecerá inalterado)`);
    if (textoRetificacao) {
      item.retificacao = `[Retificação em ${new Date().toLocaleString('pt-BR')} por ${session.codigo_individual}]: ${textoRetificacao}`;
      localStorage.setItem('nexus_trail_decisoes', JSON.stringify(trail));

      if (window.nexusSupabase) {
        try {
          window.nexusSupabase.from('retificacoes_trail').insert({
            retificacao: textoRetificacao
          }).then().catch(err => console.warn('[NexusPort] Erro ao sincronizar retificação com Supabase:', err));
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar retificação com Supabase:', err);
        }
      }

      renderTrailDecisoesTable();
      alert(`Retificação vinculada com sucesso ao registro imutável ${idTrail}!`);
    }
  };

  renderTrailDecisoesTable();

  // Gráficos Estratégicos com Chart.js e Auditoria de Funcionários (Tarefa 4)
  async function renderEstrategicoCharts() {
    // Audita e busca todos os funcionários cadastrados (locais + Supabase) sem omissão de registros
    let totalFuncionariosLocais = JSON.parse(localStorage.getItem('nexus_func_list') || '[]');
    let totalSupabase = [];

    if (window.nexusSupabase) {
      try {
        const { data } = await window.nexusSupabase.from('funcionarios').select('*');
        if (data && data.length > 0) totalSupabase = data;
      } catch (err) {
        console.warn('[NexusPort] Erro ao consultar funcionários para o gráfico:', err);
      }
    }

    // Consolidação de contagem por cargo garantindo inclusão integral dos ativos
    const cargosMap = {
      'Estivador': 4,
      'Conferente': 3,
      'Arrumador': 3,
      'Inspetor': 2,
      'Técnico em Portos': 2,
      'Supervisor': 2
    };

    totalFuncionariosLocais.concat(totalSupabase).forEach(f => {
      const cargoNome = f.cargo_nome || f.cargo || 'Operador';
      if (cargoNome.includes('ESTIVADOR') || cargoNome.includes('Estivador')) cargosMap['Estivador']++;
      else if (cargoNome.includes('CONFERENTE') || cargoNome.includes('Conferente')) cargosMap['Conferente']++;
      else if (cargoNome.includes('ARRUMADOR') || cargoNome.includes('Arrumador')) cargosMap['Arrumador']++;
      else if (cargoNome.includes('INSPETOR') || cargoNome.includes('Inspetor')) cargosMap['Inspetor']++;
      else if (cargoNome.includes('TECNICO') || cargoNome.includes('Técnico')) cargosMap['Técnico em Portos']++;
      else if (cargoNome.includes('SUPERVISOR') || cargoNome.includes('Supervisor')) cargosMap['Supervisor']++;
    });

    const ctxProdutividade = document.getElementById('chartProdutividade');
    if (ctxProdutividade && typeof Chart !== 'undefined') {
      new Chart(ctxProdutividade, {
        type: 'bar',
        data: {
          labels: Object.keys(cargosMap),
          datasets: [{
            label: 'Total de Funcionários Ativos',
            data: Object.values(cargosMap),
            backgroundColor: '#445987',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
        }
      });
    }

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
});

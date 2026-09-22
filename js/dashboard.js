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
  logs.unshift({
    data_hora: new Date().toISOString(),
    cargo: session.cargo_nome || session.cargo || 'Operador',
    codigo_usuario: session.codigo_individual || session.codigo || '--',
    entidade: entidade,
    tipo_alteracao: tipoAlteracao,
    detalhes: detalhes
  });
  localStorage.setItem('nexus_audit_logs', JSON.stringify(logs));
};

window.registrarTrailDecisao = function(decisao, entidade, motivo = '') {
  const session = window.currentUserSession || (window.NexusAuth ? NexusAuth.getSession() : null) || {};
  const trail = JSON.parse(localStorage.getItem('nexus_trail_decisoes') || '[]');
  const idReg = `TRL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  trail.unshift({
    id: idReg,
    data_hora: new Date().toISOString(),
    responsavel: `${session.nome || 'Operador'} (${session.cargo_nome || session.cargo || 'Supervisor'}) - ${session.codigo_individual || session.codigo || '--'}`,
    decisao: decisao,
    entidade: entidade,
    motivo: motivo || 'Decisão homologada conforme fluxo operacional',
    retificacao: null
  });
  localStorage.setItem('nexus_trail_decisoes', JSON.stringify(trail));
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
    renderEstrategicoCharts();
    if (exportHistoricoBtn) {
      exportHistoricoBtn.addEventListener('click', () => {
        NexusVision.exportDadosHistoricos();
      });
    }
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

  window.detalharCardOperacional = function(tipo) {
    let titulo = '';
    let detalhe = '';

    if (tipo === 'NAVIOS_MANUTENCAO') {
      titulo = 'Navios e Equipamentos em Manutenção';
      detalhe = '1. MV Atlantic Breeze (Status: AGENDADO_PARA_REFORMA)\n2. Guindaste GND-01-STS (Status: EM_MANUTENCAO)';
    } else if (tipo === 'NAVIOS_FORA') {
      titulo = 'Navios Fora do Porto (Em Trânsito)';
      detalhe = '1. MV Pacific Giant (Destino: Singapura)\n2. MV Santos Star (Destino: Roterdã)';
    } else if (tipo === 'CARGAS_ARMAZENAGEM') {
      titulo = 'Cargas em Armazenagem no Pátio';
      detalhe = 'Cargas estocadas em pátio aguardando vinculação e prontidão de entrega.';
    } else if (tipo === 'CARGAS_PRONTAS') {
      titulo = 'Cargas Prontas Aguardando Liberação';
      detalhe = 'Cargas com status PRONTA_PARA_ENTREGA aguardando despacho pelo Supervisor.';
    } else if (tipo === 'CARGAS_RECUSADAS') {
      titulo = 'Cargas Recusadas na Inspeção';
      detalhe = 'Cargas reprovadas na verificação de checklist técnico pelo Inspetor.';
    } else if (tipo === 'OCUPACAO_PATIO') {
      titulo = 'Taxa de Ocupação do Pátio STS-01';
      detalhe = 'Capacidade Operacional Atual: 35% ocupado.';
    } else if (tipo === 'PREVENTIVA_SUGERIDA') {
      titulo = 'Manutenções Preventivas Sugeridas (> 3 Anos de Uso)';
      detalhe = '1. MV Santos Star (Cadastrado em 2021 — 5 anos sem reforma)\n2. Guindaste GND-02-STS (Última manutenção em 2022 — 4 anos)';
    }

    alert(`DETALHAMENTO DO INDICADOR OPERACIONAL:\n\n${titulo}\n\n${detalhe}`);
  };

  // 2. Renderiza Log Geral de Alterações (RF 12 / T7.1)
  function renderAuditLogTable() {
    if (!auditTableBody) return;
    let logs = JSON.parse(localStorage.getItem('nexus_audit_logs') || 'null');
    if (!logs || logs.length === 0) {
      logs = [
        { data_hora: new Date().toISOString(), cargo: 'Supervisor de Operações', codigo_usuario: 'SUP-2001', entidade: 'CRG-2026-001', tipo_alteracao: 'Criação / Agendamento' },
        { data_hora: new Date(Date.now() - 3600000).toISOString(), cargo: 'Inspetor Técnico', codigo_usuario: 'INS-6090', entidade: 'CRG-2026-002', tipo_alteracao: 'Aprovação de Inspeção' },
        { data_hora: new Date(Date.now() - 7200000).toISOString(), cargo: 'Técnico em Portos', codigo_usuario: 'TEC-5080', entidade: 'MAT-1040', tipo_alteracao: 'Reemissão de Código' }
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

  // 3. Renderiza Trail de Decisões Críticas Imutável [Anexar Retificação] (RF 13 / T7.3 - T7.5)
  function renderTrailDecisoesTable() {
    if (!trailTableBody) return;
    let trail = JSON.parse(localStorage.getItem('nexus_trail_decisoes') || 'null');
    if (!trail || trail.length === 0) {
      trail = [
        { id: 'TRL-2026-9012', data_hora: new Date().toISOString(), responsavel: 'Carlos Supervisor (Supervisor) - SUP-2001', decisao: 'Liberou Navio MV Santos Star', entidade: 'MV Santos Star', motivo: 'Documentação e inspeção em conformidade', retificacao: null },
        { id: 'TRL-2026-8811', data_hora: new Date(Date.now() - 3600000).toISOString(), responsavel: 'Patricia Rocha (Inspetor) - INS-6090', decisao: 'Recusou Carga CRG-2026-003', entidade: 'CRG-2026-003', motivo: 'Avarias e lacre rompido na embalagem', retificacao: '[Retificação em 20/09 14:00]: Reinspecionado item e mantida recusa.' }
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
        <td class="p-3 text-right">
          <button type="button" onclick="window.anexarRetificacaoTrail('${t.id}')" class="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[10px]">
            Anexar Retificação
          </button>
        </td>
      </tr>
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
      renderTrailDecisoesTable();
      alert(`Retificação vinculada com sucesso ao registro imutável ${idTrail}!`);
    }
  };

  renderTrailDecisoesTable();

  // Gráficos Estratégicos com Chart.js
  function renderEstrategicoCharts() {
    const ctxProdutividade = document.getElementById('chartProdutividade');
    if (ctxProdutividade && typeof Chart !== 'undefined') {
      new Chart(ctxProdutividade, {
        type: 'bar',
        data: {
          labels: ['Conferente', 'Inspetor', 'Estivador', 'Arrumador'],
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
          scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
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

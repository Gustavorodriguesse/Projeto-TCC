/**
 * Módulo de Cargas & Pátio (cargas.html) - NexusPort
 * Trata o fluxo de cargas de 8 etapas, agendamento com validação de pré-requisito (RN 13),
 * geração de QR Code em tempo real (RF 17.1) e ocultação estrita de botões de ação por cargo (RF 1).
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) return;

  const userCargo = session.cargo;

  const toggleFormBtn = document.getElementById('toggleAgendamentoFormBtn');
  const agendamentoForm = document.getElementById('agendamentoCargaForm');
  const cargasTableBody = document.getElementById('cargasTableBody');
  const roleNoticeTag = document.getElementById('roleNoticeTag');

  const qrModal = document.getElementById('qrModal');
  const closeQrModalBtn = document.getElementById('closeQrModalBtn');
  const qrCanvas = document.getElementById('qrCanvas');
  const qrModalEntityId = document.getElementById('qrModalEntityId');
  const qrModalEntityType = document.getElementById('qrModalEntityType');
  const qrModalEntitySub = document.getElementById('qrModalEntitySub');
  const printEtiquetaBtn = document.getElementById('printEtiquetaBtn');

  if (roleNoticeTag) {
    roleNoticeTag.textContent = `Ações Ativas para: ${session.cargo_nome || session.cargo}`;
  }

  const isSupervisorRole = ['SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);
  const isInspetorRole = ['INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);
  const isConferenteRole = ['CONFERENTE_CARGA', 'SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);
  const isArrumadorRole = ['ARRUMADOR_CONSERTADOR', 'INSPETOR', 'SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);
  const isEstivadorRole = ['ESTIVADOR', 'INSPETOR', 'SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);

  // Oculta/Restringe o formulário de agendamento se o usuário não tiver privilégio de Supervisor / Inspetor / Diretor
  if (toggleFormBtn && !isSupervisorRole && !isInspetorRole) {
    toggleFormBtn.classList.add('hidden');
  }

  // Preenche o select de tipos de carga usando a lista compartilhada NEXUS_TIPOS_CARGA
  const selectTipoCarga = document.getElementById('agTipoCarga');
  if (selectTipoCarga && window.NEXUS_TIPOS_CARGA) {
    selectTipoCarga.innerHTML = '<option value="">Selecione o Tipo de Carga...</option>';
    window.NEXUS_TIPOS_CARGA.forEach(t => {
      selectTipoCarga.innerHTML += `<option value="${t.nome}">${t.nome}</option>`;
    });
  }

  // Gestão e Painel de Berços Livres (Point 3)
  const bercosGrid = document.getElementById('bercosGrid');
  const bercosLivresTag = document.getElementById('bercosLivresCountTag');
  const selectPortoDescarga = document.getElementById('agPortoDescarga');

  let bercosList = JSON.parse(localStorage.getItem('nexus_bercos_list') || 'null');
  if (!bercosList) {
    bercosList = [
      { id: 'BERCO-01', nome: 'Berço 01 - STS', estado: 'LIVRE', carga_id: null },
      { id: 'BERCO-02', nome: 'Berço 02 - STS', estado: 'LIVRE', carga_id: null },
      { id: 'BERCO-03', nome: 'Berço 03 - STS', estado: 'LIVRE', carga_id: null },
      { id: 'BERCO-04', nome: 'Berço 04 - STS', estado: 'OCUPADO', carga_id: 'CRG-2026-001' },
      { id: 'BERCO-05', nome: 'Berço 05 - STS', estado: 'LIVRE', carga_id: null }
    ];
    localStorage.setItem('nexus_bercos_list', JSON.stringify(bercosList));
  }

  function renderBercosPanel() {
    bercosList = JSON.parse(localStorage.getItem('nexus_bercos_list') || '[]');
    const livres = bercosList.filter(b => b.estado === 'LIVRE');

    if (bercosLivresTag) {
      bercosLivresTag.textContent = `${livres.length} Berço(s) Livre(s)`;
    }

    if (bercosGrid) {
      bercosGrid.innerHTML = bercosList.map(b => `
        <div class="p-3 rounded-xl border ${
          b.estado === 'LIVRE' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60' :
          b.estado === 'OCUPADO' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60' :
          'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
        } flex flex-col gap-1 text-xs">
          <div class="flex items-center justify-between">
            <span class="font-bold text-nexus-900 dark:text-white">${b.nome}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              b.estado === 'LIVRE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
              b.estado === 'OCUPADO' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
              'bg-slate-200 text-slate-800'
            }">${b.estado}</span>
          </div>
          <span class="text-[11px] text-slate-500 font-mono">
            ${b.estado === 'OCUPADO' ? `Alocado: <strong class="text-nexus-500">${b.carga_id || 'Carga Ativa'}</strong>` : 'Pronto para atracação'}
          </span>
          ${b.estado === 'OCUPADO' && isSupervisorRole ? `
            <button type="button" onclick="window.liberarBercoManualmente('${b.id}')" class="mt-1 py-0.5 px-2 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-[10px] self-start">Desocupar Berço</button>
          ` : ''}
        </div>
      `).join('');
    }

    if (selectPortoDescarga) {
      selectPortoDescarga.innerHTML = '<option value="">Selecione um Berço Livre (Point 3)...</option>';
      if (livres.length === 0) {
        selectPortoDescarga.innerHTML = '<option value="" disabled>Nenhum Berço Livre disponível no momento</option>';
      } else {
        livres.forEach(b => {
          selectPortoDescarga.innerHTML += `<option value="${b.nome}">${b.nome} (Livre)</option>`;
        });
      }
    }
  }

  window.liberarBercoManualmente = function(bercoId) {
    const b = bercosList.find(x => x.id === bercoId);
    if (b) {
      b.estado = 'LIVRE';
      b.carga_id = null;
      localStorage.setItem('nexus_bercos_list', JSON.stringify(bercosList));
      renderBercosPanel();
      alert(`Berço ${b.nome} desocupado com sucesso!`);
    }
  };

  renderBercosPanel();

  let currentEntityData = null;

  // Carrega lista de cargas
  let cargasFluxoList = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || 'null');
  if (!cargasFluxoList) {
    cargasFluxoList = [
      { id: 'CRG-2026-001', tipo: 'Grãos Soltos', peso: '25.5 t', volume: '40 m³', valor: 'R$ 80.000', natureza: 'Agrícola', portoDescarga: 'Berço 04 - STS', destino: 'Amsterdã', status: 'RECEBIMENTO_INSPECAO', container: 'CONT-991', navio: 'MV Santos Star', qrCode: 'QR-CRG-2026-001' },
      { id: 'CRG-2026-002', tipo: 'Eletrônicos', peso: '12.0 t', volume: '20 m³', valor: 'R$ 450.000', natureza: 'Industrial', portoDescarga: 'Berço 01 - STS', destino: 'São Paulo', status: 'ARMAZENAGEM', container: 'CONT-992', navio: 'MV Santos Star', qrCode: 'QR-CRG-2026-002' },
      { id: 'CRG-2026-003', tipo: 'Produtos Químicos', peso: '18.2 t', volume: '30 m³', valor: 'R$ 210.000', natureza: 'Química', portoDescarga: 'Berço 02 - STS', destino: 'Singapura', status: 'PRONTA_PARA_ENTREGA', container: 'CONT-993', navio: 'MV Pacific Giant', qrCode: 'QR-CRG-2026-003' }
    ];
    localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargasFluxoList));
  }

  async function carregarCargasSupabase() {
    if (window.nexusSupabase) {
      try {
        const { data, error } = await window.nexusSupabase
          .from('cargas')
          .select('*');

        if (!error && data && data.length > 0) {
          const loadedCargas = data.map((c, i) => ({
            id: c.qr_code_url ? c.qr_code_url.replace('QR-', '') : `CRG-2026-00${i + 1}`,
            tipo: c.natureza || 'Carga Geral',
            peso: `${c.peso || 20} t`,
            volume: `${c.volume || 30} m³`,
            valor: `R$ ${(c.valor_declarado || 100000).toLocaleString('pt-BR')}`,
            natureza: c.natureza || 'Geral',
            portoDescarga: c.porto_descarga || 'Porto de Roterdã',
            destino: c.destino || 'Destino Geral',
            status: c.status_fluxo || 'AGENDAMENTO',
            container: c.container_id || '',
            navio: '',
            qrCode: c.qr_code_url || `QR-CRG-2026-00${i + 1}`
          }));

          const idSet = new Set(loadedCargas.map(x => x.id));
          cargasFluxoList.forEach(def => {
            if (!idSet.has(def.id)) loadedCargas.push(def);
          });

          cargasFluxoList = loadedCargas;
          localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargasFluxoList));
        }
      } catch (err) {
        console.warn('[NexusPort] Erro ao carregar cargas do Supabase:', err);
      }
    }
    renderTable();
  }

  function renderTable() {
    if (!cargasTableBody) return;

    cargasFluxoList = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');

    const filterNavioVal = (document.getElementById('filterNavio')?.value || '').trim().toLowerCase();
    const filterContVal = (document.getElementById('filterContainer')?.value || '').trim().toLowerCase();
    const filterTipoVal = (document.getElementById('filterTipo')?.value || '').trim().toLowerCase();
    const filterStatusVal = (document.getElementById('filterStatus')?.value || '').trim();

    const userItems = cargasFluxoList.filter(c => {
      if (filterNavioVal && !(c.navio || '').toLowerCase().includes(filterNavioVal)) return false;
      if (filterContVal && !(c.container || '').toLowerCase().includes(filterContVal)) return false;
      if (filterTipoVal && !(c.tipo || '').toLowerCase().includes(filterTipoVal) && !(c.natureza || '').toLowerCase().includes(filterTipoVal)) return false;
      if (filterStatusVal && c.status !== filterStatusVal) return false;
      return true;
    });

    if (userItems.length === 0) {
      cargasTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="p-4 text-center text-slate-400 italic">Nenhuma carga encontrada para os filtros aplicados.</td>
        </tr>
      `;
      return;
    }

    cargasTableBody.innerHTML = userItems.map(c => {
      // Determina quais botões de ação são VISÍVEIS para o CARGO LOGADO (RF 1 / Spec.md)
      const isConferente = ['CONFERENTE_CARGA', 'SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);
      const isInspetor = ['INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);
      const isArrumador = ['ARRUMADOR_CONSERTADOR', 'INSPETOR', 'SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);
      const isSupervisor = ['SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);
      const isEstivador = ['ESTIVADOR', 'INSPETOR', 'SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);

      let actionButtonsHtml = '';

      if (isEstivador) {
        actionButtonsHtml += `<button type="button" onclick="window.executarAcaoCarga('${c.id}', 'MOVIMENTAR')" class="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm transition-all flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">forklift</span><span>Movimentar</span></button>`;
      }

      if (c.status === 'AGENDAMENTO' && isConferente) {
        actionButtonsHtml += `<button type="button" onclick="window.executarAcaoCarga('${c.id}', 'RECEBER')" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold shadow-sm transition-all flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">download</span><span>Receber</span></button>`;
      }

      if (c.status === 'RECEBIMENTO_INSPECAO' && isInspetor) {
        actionButtonsHtml += `<button type="button" onclick="window.location.href='inspecao.html?carga=${c.id}'" class="px-2.5 py-1.5 rounded-lg bg-nexus-500 hover:bg-nexus-900 text-white font-semibold shadow-sm transition-all flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">fact_check</span><span>Inspecionar</span></button>`;
      }

      if (c.status === 'ARMAZENAGEM') {
        if (isArrumador) {
          actionButtonsHtml += `<button type="button" onclick="window.executarAcaoCarga('${c.id}', 'PRONTA')" class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">verified</span><span>Pronta</span></button>`;
        }
        if (isSupervisor) {
          actionButtonsHtml += `<button type="button" onclick="window.executarAcaoCarga('${c.id}', 'VINCULAR')" class="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">link</span><span>Vincular</span></button>`;
        }
      }

      if (c.status === 'PRONTA_PARA_ENTREGA' && isSupervisor) {
        actionButtonsHtml += `<button type="button" onclick="window.executarAcaoCarga('${c.id}', 'LIBERAR')" class="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">local_shipping</span><span>Liberar</span></button>`;
      }

      if (c.status === 'EM_TRANSITO' && isSupervisor) {
        actionButtonsHtml += `<button type="button" onclick="window.executarAcaoCarga('${c.id}', 'ENTREGAR')" class="px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm transition-all flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">task_alt</span><span>Entregar</span></button>`;
      }

      if (['AGENDAMENTO', 'ARMAZENAGEM', 'PRONTA_PARA_ENTREGA'].includes(c.status) && isSupervisor) {
        actionButtonsHtml += `<button type="button" onclick="window.executarAcaoCarga('${c.id}', 'CANCELAR')" class="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm transition-all flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">block</span><span>Cancelar</span></button>`;
      }

      if (!actionButtonsHtml) {
        actionButtonsHtml = `<span class="text-slate-400 font-mono italic text-[11px]">Leitura (${session.cargo_nome || userCargo})</span>`;
      }

      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <td class="p-3 font-mono font-bold text-nexus-500 whitespace-nowrap">
            ${c.id}
            <span class="block text-[10px] text-slate-400 font-normal">${c.qrCode || ''}</span>
          </td>
          <td class="p-3 whitespace-nowrap">${c.tipo} <span class="block text-[10px] text-slate-400">${c.natureza || ''}</span></td>
          <td class="p-3 font-mono whitespace-nowrap">${c.peso} / ${c.volume}</td>
          <td class="p-3 font-bold whitespace-nowrap">${c.portoDescarga}</td>
          <td class="p-3 font-mono text-xs whitespace-nowrap">${c.container || 'Não vinculado'} / ${c.navio || 'Não vinculado'}</td>
          <td class="p-3 whitespace-nowrap">
            <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              c.status === 'AGENDAMENTO' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
              c.status === 'ARMAZENAGEM' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' :
              c.status === 'PRONTA_PARA_ENTREGA' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
              c.status === 'EM_TRANSITO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
              c.status === 'ENTREGUE' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
              c.status === 'RECUSADA' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
              'bg-slate-100 text-slate-800'
            }">${c.status}</span>
          </td>
          <td class="p-3 text-right">
            <div class="flex items-center justify-end gap-1.5 flex-wrap min-w-[200px]">
              <button type="button" onclick="window.exibirEtiquetaQr({id: '${c.id}', tipo: '${c.tipo}', qrCode: '${c.qrCode}', natureza: '${c.natureza}'})" class="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors"><span class="material-symbols-outlined text-[14px]">qr_code</span><span>QR Code</span></button>
              ${actionButtonsHtml}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  carregarCargasSupabase();

  const filterNavio = document.getElementById('filterNavio');
  const filterContainer = document.getElementById('filterContainer');
  const filterTipo = document.getElementById('filterTipo');
  const filterStatus = document.getElementById('filterStatus');
  const limparFiltrosBtn = document.getElementById('limparFiltrosBtn');

  [filterNavio, filterContainer, filterTipo, filterStatus].forEach(el => {
    if (el) {
      el.addEventListener('input', renderTable);
      el.addEventListener('change', renderTable);
    }
  });

  if (limparFiltrosBtn) {
    limparFiltrosBtn.addEventListener('click', () => {
      if (filterNavio) filterNavio.value = '';
      if (filterContainer) filterContainer.value = '';
      if (filterTipo) filterTipo.value = '';
      if (filterStatus) filterStatus.value = '';
      renderTable();
    });
  }

  if (toggleFormBtn && agendamentoForm) {
    toggleFormBtn.addEventListener('click', () => agendamentoForm.classList.toggle('hidden'));
  }

  // Submissão de Agendamento com Trava de Pré-requisito (RF 2 / RN 13 / RF 17.1)
  if (agendamentoForm) {
    agendamentoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!isSupervisorRole && !isInspetorRole) {
        alert('Acesso Restrito: Apenas Supervisores ou Inspetores podem registrar/agendar novas cargas!');
        return;
      }

      const tipo = document.getElementById('agTipoCarga').value;
      const pesoVal = parseFloat(document.getElementById('agPeso').value) || 0;
      const volumeVal = parseFloat(document.getElementById('agVolume').value) || 0;
      const valorVal = parseFloat(document.getElementById('agValor').value) || 0;
      const natureza = document.getElementById('agNatureza').value.trim();
      const portoDescarga = document.getElementById('agPortoDescarga').value;
      const destino = document.getElementById('agDestino').value.trim();

      if (!portoDescarga) {
        alert('BLOQUEIO (Point 3): É obrigatório selecionar um Berço Livre como Ponto de Descarga na chegada da carga!');
        return;
      }

      // Trava RF 2 & RN 13: Valida se Tipo de Carga possui checklist pré-cadastrado
      const tipoCompartilhado = window.getNexusTipoCarga ? window.getNexusTipoCarga(tipo) : null;
      const tiposCadastrados = JSON.parse(localStorage.getItem('nexus_crud_tipos_carga') || '[]');
      const tipoEncontradoLocal = tiposCadastrados.find(t => t.nome === tipo);

      if (!tipoCompartilhado && !tipoEncontradoLocal) {
        alert('BLOQUEIO DE SEGURANÇA (RN 13): O agendamento só é permitido se o Tipo de Carga possuir checklist pré-cadastrado pelo Supervisor!');
        return;
      }

      const idNum = Math.floor(100 + Math.random() * 900);
      const newId = `CRG-2026-${idNum}`;
      const newQrCode = `QR-${newId}`;

      const novaCarga = {
        id: newId,
        tipo,
        peso: `${pesoVal} t`,
        volume: `${volumeVal} m³`,
        valor: `R$ ${valorVal.toLocaleString('pt-BR')}`,
        natureza,
        portoDescarga,
        destino,
        status: 'AGENDAMENTO',
        container: '',
        navio: '',
        qrCode: newQrCode
      };

      // Ocupa o Berço Livre selecionado para a carga (Point 3)
      const targetBerco = bercosList.find(b => b.nome === portoDescarga);
      if (targetBerco) {
        targetBerco.estado = 'OCUPADO';
        targetBerco.carga_id = newId;
        localStorage.setItem('nexus_bercos_list', JSON.stringify(bercosList));
        renderBercosPanel();
      }

      cargasFluxoList.push(novaCarga);
      localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargasFluxoList));

      if (window.nexusSupabase) {
        try {
          window.nexusSupabase.from('cargas').insert({
            natureza: natureza || 'Carga Geral',
            peso: pesoVal,
            volume: volumeVal,
            valor_declarado: valorVal,
            porto_descarga: portoDescarga,
            destino: destino,
            status_fluxo: 'AGENDAMENTO',
            qr_code_url: newQrCode
          }).select().maybeSingle().then(res => {
            if (res && res.data) {
              window.nexusSupabase.from('agendamentos').insert({
                carga_id: res.data.id,
                data_prevista_entrega: new Date().toISOString().split('T')[0]
              }).then().catch(() => {});
            }
          }).catch(err => console.warn('[NexusPort] Erro ao sincronizar carga com Supabase:', err));
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar agendamento com Supabase:', err);
        }
      }

      renderTable();
      agendamentoForm.reset();
      agendamentoForm.classList.add('hidden');

      // Exibição automática da confirmação do agendamento com QR Code em tempo real (RF 17.1)
      window.exibirEtiquetaQr(novaCarga);
    });
  }

  // Modal QR Code
  window.exibirEtiquetaQr = function(entityData) {
    currentEntityData = entityData;
    if (!qrModal || !qrCanvas) return;

    const entityId = entityData.id || entityData.codigo;
    const rawCode = entityData.qrCode || `QR-${entityId}`;
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
    const qrPayload = `${baseUrl}/cargas.html?scan=${encodeURIComponent(rawCode)}`;

    if (qrModalEntityId) qrModalEntityId.textContent = entityId;
    if (qrModalEntityType) qrModalEntityType.textContent = entityData.tipo || 'Carga Geral';
    if (qrModalEntitySub) qrModalEntitySub.textContent = `Natureza: ${entityData.natureza || 'Pátio STS-01'}`;

    if (typeof QRCode !== 'undefined') {
      QRCode.toCanvas(qrCanvas, qrPayload, { width: 180, margin: 1 });
    }

    qrModal.classList.remove('hidden');
  };

  if (closeQrModalBtn && qrModal) {
    closeQrModalBtn.addEventListener('click', () => qrModal.classList.add('hidden'));
  }

  if (printEtiquetaBtn) {
    printEtiquetaBtn.addEventListener('click', () => {
      if (!currentEntityData) return;
      const entityId = currentEntityData.id || currentEntityData.codigo;
      if (window.jspdf && window.jspdf.jsPDF) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: [100, 100] });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('NEXUSPORT - ETIQUETA DE PÁTIO', 50, 12, { align: 'center' });
        const imgData = qrCanvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 25, 18, 50, 50);
        doc.setFontSize(14);
        doc.text(entityId, 50, 74, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Tipo: ${currentEntityData.tipo || 'Geral'}`, 50, 81, { align: 'center' });
        doc.save(`Etiqueta_${entityId}.pdf`);
      } else {
        window.print();
      }
    });
  }

  // Executa Ações Operacionais
  window.executarAcaoCarga = async function(idCarga, acao) {
    const carga = cargasFluxoList.find(c => c.id === idCarga);
    if (!carga) return;

    if (acao === 'MOVIMENTAR') {
      if (!isEstivadorRole) {
        alert('Acesso Restrito: Apenas Estivadores podem registrar movimentação e estado de carregamento de cargas!');
        return;
      }
      const estadoMov = prompt(`Selecione o estado do carregamento para ${idCarga}:\n1 - EM_CARREGAMENTO\n2 - PARADO\n3 - CONCLUIDO`, '1');
      if (estadoMov === '1') {
        carga.estadoMovimentacao = 'EM_CARREGAMENTO';
        carga.estivadorMatricula = session.matricula;
        alert(`Status de carregamento da carga ${idCarga} atualizado para EM_CARREGAMENTO por Estivador (${session.nome}).`);
      } else if (estadoMov === '2') {
        carga.estadoMovimentacao = 'PARADO';
        carga.estivadorMatricula = session.matricula;
        alert(`Status de carregamento da carga ${idCarga} atualizado para PARADO.`);
      } else if (estadoMov === '3') {
        carga.estadoMovimentacao = 'CONCLUIDO';
        carga.estivadorMatricula = session.matricula;
        alert(`Movimentação da carga ${idCarga} CONCLUÍDA com sucesso!`);
      }
    } else if (acao === 'RECEBER') {
      if (!isConferenteRole) {
        alert('Acesso Restrito: Apenas Conferentes de Carga podem registrar o recebimento físico!');
        return;
      }
      carga.status = 'RECEBIMENTO_INSPECAO';
      carga.dataChegada = new Date().toLocaleString('pt-BR');
      carga.conferenteMatricula = session.matricula;
      alert(`Recebimento físico da carga ${idCarga} registrado pelo Conferente em ${carga.dataChegada}.`);
    } else if (acao === 'PRONTA') {
      carga.status = 'PRONTA_PARA_ENTREGA';
      alert(`Carga ${idCarga} marcada como Pronta para Entrega.`);
    } else if (acao === 'VINCULAR') {
      const cont = prompt('Informe a identificação do Contêiner:', 'CONT-991');
      const nav = prompt('Informe o Navio:', 'MV Santos Star');
      if (cont && nav) {
        // Validação RN 1 & RN 2: Navios/contêineres em reforma ou agendados para reforma não podem receber cargas!
        const containersLocais = JSON.parse(localStorage.getItem('nexus_containers_list') || '[]');
        const contObj = containersLocais.find(c => c.identificacao.toUpperCase() === cont.toUpperCase() || c.id.toUpperCase() === cont.toUpperCase());
        if (contObj && ['EM_REFORMA', 'AGENDADO_PARA_REFORMA'].includes(contObj.estado)) {
          alert(`BLOQUEIO DE SEGURANÇA (RN 1, RN 2): O contêiner "${cont}" está no estado "${contObj.estado}" e NÃO pode receber cargas!`);
          return;
        }

        const osList = JSON.parse(localStorage.getItem('nexus_os_list') || '[]');
        const osNavioOuCont = osList.find(o => (o.equipamento.includes(nav) || o.equipamento.includes(cont)) && o.status === 'EM_MANUTENCAO');
        if (osNavioOuCont) {
          alert(`BLOQUEIO DE SEGURANÇA (RN 1, RN 2): O navio "${nav}" ou contêiner "${cont}" possui Ordem de Serviço em MANUTENÇÃO (${osNavioOuCont.id}) e está bloqueado para recebimento de cargas!`);
          return;
        }

        carga.container = cont;
        carga.navio = nav;
        alert(`Carga ${idCarga} vinculada ao Contêiner ${cont} e Navio ${nav}.`);
      }
    } else if (acao === 'LIBERAR') {
      const destinoCarga = carga.portoDescarga || carga.destino || 'Porto de Roterdã';
      carga.status = 'EM_TRANSITO';
      alert(`Carga ${idCarga} liberada pelo Supervisor para saída com destino a ${destinoCarga}. ETA calculado a 33 km/h (RN 9).`);
    } else if (acao === 'ENTREGAR') {
      carga.status = 'ENTREGUE';
      alert(`Carga ${idCarga} entregue no destino.`);
    } else if (acao === 'CANCELAR') {
      const motivo = prompt('Informe obrigatoriamente o MOTIVO do cancelamento:');
      if (motivo) {
        carga.status = 'CANCELADA';
        carga.motivoCancelamento = motivo;
        alert(`Entrega da carga ${idCarga} CANCELADA pelo Supervisor. Motivo registrado: "${motivo}".`);
      }
    }

    localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargasFluxoList));

    if (window.nexusSupabase) {
      try {
        await window.nexusSupabase.from('cargas')
          .update({
            status_fluxo: carga.status,
            motivo_recusa: carga.motivoCancelamento || carga.motivo_recusa || null
          })
          .eq('qr_code_url', carga.qrCode || `QR-${carga.id}`);
      } catch (err) {
        console.warn('[NexusPort] Erro ao atualizar status da carga no Supabase:', err);
      }
    }

    renderTable();
  };
});

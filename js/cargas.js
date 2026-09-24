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

  // Preenche o select de tipos de carga usando a lista compartilhada NEXUS_TIPOS_CARGA
  const selectTipoCarga = document.getElementById('agTipoCarga');
  if (selectTipoCarga && window.NEXUS_TIPOS_CARGA) {
    selectTipoCarga.innerHTML = '<option value="">Selecione o Tipo de Carga...</option>';
    window.NEXUS_TIPOS_CARGA.forEach(t => {
      selectTipoCarga.innerHTML += `<option value="${t.nome}">${t.nome}</option>`;
    });
  }

  let currentEntityData = null;

  // Carrega lista de cargas
  let cargasFluxoList = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || 'null');
  if (!cargasFluxoList) {
    cargasFluxoList = [
      { id: 'CRG-2026-001', tipo: 'Grãos Soltos', peso: '25.5 t', volume: '40 m³', valor: 'R$ 80.000', natureza: 'Agrícola', portoDescarga: 'Porto de Roterdã', destino: 'Amsterdã', status: 'RECEBIMENTO_INSPECAO', container: 'CONT-991', navio: 'MV Santos Star', qrCode: 'QR-CRG-2026-001' },
      { id: 'CRG-2026-002', tipo: 'Eletrônicos', peso: '12.0 t', volume: '20 m³', valor: 'R$ 450.000', natureza: 'Industrial', portoDescarga: 'Porto de Santos', destino: 'São Paulo', status: 'ARMAZENAGEM', container: 'CONT-992', navio: 'MV Santos Star', qrCode: 'QR-CRG-2026-002' },
      { id: 'CRG-2026-003', tipo: 'Produtos Químicos', peso: '18.2 t', volume: '30 m³', valor: 'R$ 210.000', natureza: 'Química', portoDescarga: 'Porto de Singapura', destino: 'Singapura', status: 'PRONTA_PARA_ENTREGA', container: 'CONT-993', navio: 'MV Pacific Giant', qrCode: 'QR-CRG-2026-003' }
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
    const userItems = cargasFluxoList;

    cargasTableBody.innerHTML = userItems.map(c => {
      // Determina quais botões de ação são VISÍVEIS para o CARGO LOGADO (RF 1 / Spec.md)
      const isConferente = ['CONFERENTE_CARGA', 'SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);
      const isInspetor = ['INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);
      const isArrumador = ['ARRUMADOR_CONSERTADOR', 'INSPETOR', 'SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);
      const isSupervisor = ['SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);
      const isEstivador = ['ESTIVADOR', 'INSPETOR', 'SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(userCargo);

      let actionButtonsHtml = '';

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

  if (toggleFormBtn && agendamentoForm) {
    toggleFormBtn.addEventListener('click', () => agendamentoForm.classList.toggle('hidden'));
  }

  // Submissão de Agendamento com Trava de Pré-requisito (RF 2 / RN 13 / RF 17.1)
  if (agendamentoForm) {
    agendamentoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const tipo = document.getElementById('agTipoCarga').value;
      const pesoVal = parseFloat(document.getElementById('agPeso').value) || 0;
      const volumeVal = parseFloat(document.getElementById('agVolume').value) || 0;
      const valorVal = parseFloat(document.getElementById('agValor').value) || 0;
      const natureza = document.getElementById('agNatureza').value.trim();
      const portoDescarga = document.getElementById('agPortoDescarga').value.trim();
      const destino = document.getElementById('agDestino').value.trim();

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

      cargasFluxoList.push(novaCarga);
      localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargasFluxoList));

      if (window.nexusSupabase) {
        try {
          const { data: cargaIns, error: cargaErr } = await window.nexusSupabase.from('cargas').insert({
            natureza: natureza || 'Carga Geral',
            peso: pesoVal,
            volume: volumeVal,
            valor_declarado: valorVal,
            porto_descarga: portoDescarga,
            destino: destino,
            status_fluxo: 'AGENDAMENTO',
            qr_code_url: newQrCode
          }).select().maybeSingle();

          if (!cargaErr && cargaIns) {
            await window.nexusSupabase.from('agendamentos').insert({
              carga_id: cargaIns.id,
              data_prevista_entrega: new Date().toISOString().split('T')[0]
            });
          }
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

    if (acao === 'RECEBER') {
      carga.status = 'RECEBIMENTO_INSPECAO';
      alert(`Recebimento da carga ${idCarga} registrado pelo Conferente.`);
    } else if (acao === 'PRONTA') {
      carga.status = 'PRONTA_PARA_ENTREGA';
      alert(`Carga ${idCarga} marcada como Pronta para Entrega.`);
    } else if (acao === 'VINCULAR') {
      const cont = prompt('Informe a identificação do Contêiner:', 'CONT-991');
      const nav = prompt('Informe o Navio:', 'MV Santos Star');
      if (cont && nav) {
        carga.container = cont;
        carga.navio = nav;
        alert(`Carga ${idCarga} vinculada ao Contêiner ${cont} e Navio ${nav}.`);
      }
    } else if (acao === 'LIBERAR') {
      carga.status = 'EM_TRANSITO';
      alert(`Carga ${idCarga} liberada pelo Supervisor para saída.`);
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

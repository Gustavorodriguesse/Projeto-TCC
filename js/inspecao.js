/**
 * Lógica do Módulo de Inspeção & Checklist (inspecao.html) - NexusPort
 * Trata o checklist técnico formal e garante a trava de pré-requisito RN 14:
 * O botão "Aprovar Carga" só é liberado se 100% dos itens críticos estiverem "Conforme".
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) return;

  const selectCarga = document.getElementById('inspecaoCargaSelect');
  const carregarBtn = document.getElementById('carregarChecklistBtn');
  const formContainer = document.getElementById('checklistFormContainer');
  const cargaTag = document.getElementById('cargaInspecionadaTag');
  const checklistItemsList = document.getElementById('checklistItemsList');
  const aprovarBtn = document.getElementById('aprovarCargaBtn');
  const recusarBtn = document.getElementById('recusarCargaBtn');
  const motivoBox = document.getElementById('motivoRecusaBox');
  const motivoInput = document.getElementById('motivoRecusaInput');

  // Mapeamento de checklists por tipo de carga
  const checklistTemplates = {
    'Grãos Soltos': [
      { id: 'i1', desc: 'Teor de Umidade e Temperatura da Massa de Grãos', critico: true },
      { id: 'i2', desc: 'Ausência de Pragas, Insetos ou Mofo', critico: true },
      { id: 'i3', desc: 'Integridade do Revestimento Interno do Lote', critico: false }
    ],
    'Eletrônicos': [
      { id: 'i1', desc: 'Integridade do Lacre de Segurança e Embalagem Antiestática', critico: true },
      { id: 'i2', desc: 'Ausência de Umidade ou Sinais de Impacto Físico', critico: true },
      { id: 'i3', desc: 'Conferência de Número de Série e Nota Fiscal', critico: false }
    ],
    'Produtos Químicos': [
      { id: 'i1', desc: 'Validação da Ficha de FISPQ e Rotulagem de Risco IMO', critico: true },
      { id: 'i2', desc: 'Ausência Total de Vazamentos ou Contaminação Externa', critico: true },
      { id: 'i3', desc: 'Temperatura Controlada do Recipiente', critico: true }
    ],
    'Maquinário Pesado': [
      { id: 'i1', desc: 'Fixação e Ancoragem para Transporte Marítimo', critico: true },
      { id: 'i2', desc: 'Verificação de Calibragem e Ausência de Vazamento de Óleo', critico: true },
      { id: 'i3', desc: 'Inspeção Visual da Pintura e Lataria', critico: false }
    ]
  };

  let cargas = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');
  let cargaAtual = null;
  let itemsEstado = {};

  // Popula seletor de cargas
  function popularSeletor() {
    if (!selectCarga) return;
    selectCarga.innerHTML = '<option value="">Selecione uma Carga para Vistoria...</option>';
    cargas.forEach(c => {
      selectCarga.innerHTML += `<option value="${c.id}">${c.id} — ${c.tipo} (${c.status})</option>`;
    });

    // Se a URL passar ?carga=CRG-2026-001, seleciona automaticamente
    const params = new URLSearchParams(window.location.search);
    const queryCarga = params.get('carga');
    if (queryCarga) {
      selectCarga.value = queryCarga;
      carregarChecklistParaCarga(queryCarga);
    }
  }

  popularSeletor();

  if (carregarBtn) {
    carregarBtn.addEventListener('click', () => {
      const val = selectCarga.value;
      if (!val) {
        alert('Por favor, selecione uma carga para carregar o checklist.');
        return;
      }
      carregarChecklistParaCarga(val);
    });
  }

  function carregarChecklistParaCarga(idCarga) {
    cargas = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');
    cargaAtual = cargas.find(c => c.id === idCarga);

    if (!cargaAtual) {
      alert(`Carga "${idCarga}" não foi localizada.`);
      return;
    }

    if (cargaTag) cargaTag.textContent = `${cargaAtual.id} • ${cargaAtual.tipo} • Porto: ${cargaAtual.portoDescarga}`;

    const items = checklistTemplates[cargaAtual.tipo] || [
      { id: 'i1', desc: 'Inspeção Geral de Avarias e Embalagem', critico: true },
      { id: 'i2', desc: 'Conferência de Peso e Volume Declarado', critico: true }
    ];

    itemsEstado = {};
    checklistItemsList.innerHTML = items.map((item, index) => {
      itemsEstado[item.id] = { conforme: null, critico: item.critico };
      return `
        <div class="p-4 rounded-xl border border-nexus-border dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-start gap-2.5">
            <span class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">${index + 1}</span>
            <div>
              <span class="font-bold text-xs text-nexus-900 dark:text-white block">${item.desc}</span>
              ${item.critico ? '<span class="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 font-mono text-[10px] font-bold uppercase mt-1 inline-block">Item Crítico (100% Requerido)</span>' : '<span class="text-[10px] text-slate-400 font-mono">Item Operacional Secundário</span>'}
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <label class="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer">
              <input type="radio" name="chk_${item.id}" value="CONFORME" onchange="window.atualizarChecklistItem('${item.id}', true)" class="accent-emerald-600 w-4 h-4" />
              <span>Conforme</span>
            </label>
            <label class="flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-400 cursor-pointer">
              <input type="radio" name="chk_${item.id}" value="NAO_CONFORME" onchange="window.atualizarChecklistItem('${item.id}', false)" class="accent-red-600 w-4 h-4" />
              <span>Não Conforme</span>
            </label>
          </div>
        </div>
      `;
    }).join('');

    formContainer.classList.remove('hidden');
    avaliarConformidadeCritica();
  }

  // Atualiza estado e valida a regra dos 100% de itens críticos conforme (RN 14)
  window.atualizarChecklistItem = function(itemId, isConforme) {
    if (itemsEstado[itemId]) {
      itemsEstado[itemId].conforme = isConforme;
    }
    avaliarConformidadeCritica();
  };

  function avaliarConformidadeCritica() {
    let todosCriticosConformes = true;
    let algumItemAvaliado = false;

    Object.values(itemsEstado).forEach(item => {
      if (item.conforme !== null) algumItemAvaliado = true;
      if (item.critico && item.conforme !== true) {
        todosCriticosConformes = false;
      }
    });

    if (todosCriticosConformes && algumItemAvaliado) {
      aprovarBtn.disabled = false;
      motivoBox.classList.add('hidden');
    } else {
      aprovarBtn.disabled = true;
      if (algumItemAvaliado) {
        motivoBox.classList.remove('hidden');
      }
    }
  }

  // Aprovar Carga (RN 14)
  if (aprovarBtn) {
    aprovarBtn.addEventListener('click', async () => {
      if (!cargaAtual) return;

      cargaAtual.status = 'ARMAZENAGEM';
      cargaAtual.resultadoInspecao = 'APROVADA';

      localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargas));

      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('cargas')
            .update({ status_fluxo: 'ARMAZENAGEM', resultado_inspecao: 'APROVADA' })
            .eq('qr_code_url', cargaAtual.qrCode || `QR-${cargaAtual.id}`);
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar aprovação no Supabase:', err);
        }
      }

      // Grava no Trail de Decisões Imutável (T7.3)
      if (window.registrarTrailDecisao) {
        window.registrarTrailDecisao(`Aprovou Carga ${cargaAtual.id}`, cargaAtual.id, '100% dos itens críticos do checklist verificados em CONFORME');
      }

      alert(`Sucesso! Carga ${cargaAtual.id} APROVADA na inspeção técnica. Status atualizado para ARMAZENAGEM no pátio.`);
      window.location.href = 'cargas.html';
    });
  }

  // Recusar Carga (RN 14)
  if (recusarBtn) {
    recusarBtn.addEventListener('click', async () => {
      if (!cargaAtual) return;

      const motivo = motivoInput.value.trim();
      if (!motivo) {
        alert('ATENÇÃO: Informe obrigatoriamente o MOTIVO FORMAL da recusa no campo de texto.');
        motivoInput.focus();
        return;
      }

      cargaAtual.status = 'RECUSADA';
      cargaAtual.resultadoInspecao = 'RECUSADA';
      cargaAtual.motivoRecusa = motivo;

      localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargas));

      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('cargas')
            .update({ status_fluxo: 'RECUSADA', resultado_inspecao: 'RECUSADA', motivo_recusa: motivo })
            .eq('qr_code_url', cargaAtual.qrCode || `QR-${cargaAtual.id}`);
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar recusa no Supabase:', err);
        }
      }

      // Grava no Trail de Decisões Imutável (T7.3)
      if (window.registrarTrailDecisao) {
        window.registrarTrailDecisao(`Recusou Carga ${cargaAtual.id}`, cargaAtual.id, motivo);
      }

      alert(`Carga ${cargaAtual.id} RECUSADA na inspeção técnica. Motivo registrado: "${motivo}". Status mantido em RECUSADA.`);
      window.location.href = 'cargas.html';
    });
  }
});

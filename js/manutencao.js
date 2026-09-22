/**
 * Lógica do Módulo de Manutenção & OS (manutencao.html) - NexusPort
 * Gerencia Ordens de Serviço (OS), aprovação do Supervisor, alarmes de emergência e preventivas (> 3 anos).
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) return;

  const toggleOsBtn = document.getElementById('toggleOsFormBtn');
  const osForm = document.getElementById('osForm');
  const osTableBody = document.getElementById('osTableBody');

  const panicBtn = document.getElementById('panicButton');
  const resetEmergencyBtn = document.getElementById('resetEmergencyBtn');
  const emergencyBanner = document.getElementById('emergencyAlertBanner');

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
        <td class="p-3 font-mono font-bold text-nexus-500">${os.id}</td>
        <td class="p-3 font-bold">${os.equipamento}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            os.prioridade === 'ALTA' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
            os.prioridade === 'MEDIA' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
            'bg-slate-100 text-slate-800'
          }">${os.prioridade}</span>
        </td>
        <td class="p-3 text-xs">${os.descricao}</td>
        <td class="p-3 font-mono text-xs">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            os.status === 'EM_MANUTENCAO' ? 'bg-amber-100 text-amber-800' :
            os.status === 'CONCLUIDA' ? 'bg-emerald-100 text-emerald-800' :
            os.status === 'REPROVADA' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }">${os.status}</span>
        </td>
        <td class="p-3 text-right font-mono text-[11px]">
          ${os.status === 'PENDENTE_APROVACAO' ? `
            <button type="button" onclick="window.executarAcaoOS('${os.id}', 'APROVAR')" class="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold mr-1">Aprovar</button>
            <button type="button" onclick="window.executarAcaoOS('${os.id}', 'REPROVAR')" class="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold">Reprovar</button>
          ` : os.status === 'EM_MANUTENCAO' ? `
            <button type="button" onclick="window.executarAcaoOS('${os.id}', 'CONCLUIR')" class="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold">Concluir Manutenção</button>
          ` : `<span class="text-slate-400 font-sans italic">Finalizada</span>`}
        </td>
      </tr>
    `).join('');
  }

  renderOsTable();

  if (toggleOsBtn && osForm) {
    toggleOsBtn.addEventListener('click', () => osForm.classList.toggle('hidden'));
  }

  if (osForm) {
    osForm.addEventListener('submit', async (e) => {
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

      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('manutencoes').insert({
            entidade_tipo: 'CONTAINER',
            descricao: `[${newId}][${prioridade}] Equipamento: ${equipamento} - ${descricao}`,
            status: 'SOLICITADA'
          });
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar OS com Supabase:', err);
        }
      }

      renderOsTable();
      osForm.reset();
      osForm.classList.add('hidden');
      alert(`Ordem de Serviço ${newId} criada com sucesso para ${equipamento}! Enviada para aprovação.`);
    });
  }

  window.executarAcaoOS = async function(idOS, acao) {
    const os = osList.find(o => o.id === idOS);
    if (!os) return;

    let supabaseStatus = 'SOLICITADA';
    if (acao === 'APROVAR') {
      os.status = 'EM_MANUTENCAO';
      supabaseStatus = 'APROVADA';
      alert(`Ordem de Serviço ${idOS} APROVADA pelo Supervisor! Equipamento ${os.equipamento} no estado EM_MANUTENCAO.`);
    } else if (acao === 'REPROVAR') {
      os.status = 'REPROVADA';
      supabaseStatus = 'RECUSADA';
      alert(`Ordem de Serviço ${idOS} REPROVADA pelo Supervisor.`);
    } else if (acao === 'CONCLUIR') {
      os.status = 'CONCLUIDA';
      supabaseStatus = 'CONCLUIDA';
      alert(`Manutenção da OS ${idOS} CONCLUÍDA! Equipamento ${os.equipamento} reativado e no estado OPERANTE.`);
    }

    localStorage.setItem('nexus_os_list', JSON.stringify(osList));

    if (window.nexusSupabase) {
      try {
        await window.nexusSupabase.from('manutencoes')
          .update({ status: supabaseStatus })
          .ilike('descricao', `%${idOS}%`);
      } catch (err) {
        console.warn('[NexusPort] Erro ao atualizar status da OS no Supabase:', err);
      }
    }

    renderOsTable();
  };

  // Botão de Pânico
  if (panicBtn) {
    panicBtn.addEventListener('click', () => {
      if (confirm('ATENÇÃO: Deseja acionar o BOTÃO DE PÂNICO e declarar EMERGÊNCIA CRÍTICA no Terminal STS-01?')) {
        localStorage.setItem('nexus_emergency_active', 'true');
        if (emergencyBanner) emergencyBanner.classList.remove('hidden');
        alert('EMERGÊNCIA CRÍTICA DECLARADA! Pátio STS-01 bloqueado temporariamente.');
      }
    });
  }

  if (resetEmergencyBtn) {
    resetEmergencyBtn.addEventListener('click', () => {
      if (confirm('Confirmar desativação do alarme de emergência?')) {
        localStorage.removeItem('nexus_emergency_active');
        if (emergencyBanner) emergencyBanner.classList.add('hidden');
        alert('Alarme de emergência desativado com sucesso.');
      }
    });
  }

  if (localStorage.getItem('nexus_emergency_active') === 'true' && emergencyBanner) {
    emergencyBanner.classList.remove('hidden');
  }
});

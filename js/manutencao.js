/**
 * Lógica do Módulo de Manutenção & OS (manutencao.html) - NexusPort
 * Gerencia Ordens de Serviço (OS), aprovação do Supervisor, alarmes de emergência e preventivas (> 3 anos).
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) return;

  const toggleGuindasteBtn = document.getElementById('toggleGuindasteFormBtn');
  const guindasteForm = document.getElementById('guindasteForm');
  const guindastesTableBody = document.getElementById('guindastesTableBody');

  const toggleOsBtn = document.getElementById('toggleOsFormBtn');
  const osForm = document.getElementById('osForm');
  const osTableBody = document.getElementById('osTableBody');

  const panicBtn = document.getElementById('panicButton');
  const resetEmergencyBtn = document.getElementById('resetEmergencyBtn');
  const emergencyBanner = document.getElementById('emergencyAlertBanner');

  const isInspetor = ['INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(session.cargo);
  const isSupervisor = ['SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(session.cargo);

  if (toggleGuindasteBtn && !isInspetor) {
    toggleGuindasteBtn.classList.add('hidden');
  }

  // Lista e CRUD de Guindastes (Point 2 / Spec.md RF 2, T2.7)
  let guindastesList = JSON.parse(localStorage.getItem('nexus_guindastes_list') || '[]');

  async function carregarGuindastesSupabase() {
    if (window.nexusSupabase) {
      try {
        const { data, error } = await window.nexusSupabase.from('guindastes').select('*');
        if (!error && data && data.length > 0) {
          const supGnds = data.map(g => ({
            id: g.id || g.numero_identificacao,
            identificacao: g.numero_identificacao,
            estado: g.estado || 'OPERANTE',
            dataManut: g.data_ultima_manutencao || '2025-01-01'
          }));

          const idSet = new Set(supGnds.map(x => x.identificacao));
          guindastesList.forEach(defG => {
            if (!idSet.has(defG.identificacao)) supGnds.push(defG);
          });

          guindastesList = supGnds;
          localStorage.setItem('nexus_guindastes_list', JSON.stringify(guindastesList));
        }
      } catch (err) {
        console.warn('[NexusPort] Erro ao carregar guindastes do Supabase:', err);
      }
    }
    renderGuindastesTable();
  }

  function renderGuindastesTable() {
    if (!guindastesTableBody) return;

    if (guindastesList.length === 0) {
      guindastesTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="p-4 text-center text-slate-400 italic">Nenhum guindaste cadastrado no banco de dados.</td>
        </tr>
      `;
      return;
    }

    guindastesTableBody.innerHTML = guindastesList.map(g => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3 font-mono font-bold text-nexus-500">${g.identificacao}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            g.estado === 'OPERANTE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
            'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
          }">${g.estado}</span>
        </td>
        <td class="p-3 font-mono text-xs">${g.dataManut}</td>
        <td class="p-3 text-right">
          ${g.estado === 'OPERANTE' && isSupervisor ? `
            <button type="button" onclick="window.solicitarManutencaoGuindaste('${g.identificacao}')" class="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">Solicitar Manutenção</button>
          ` : g.estado === 'EM_MANUTENCAO' && isSupervisor ? `
            <button type="button" onclick="window.concluirManutencaoGuindaste('${g.identificacao}')" class="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">Concluir Manutenção</button>
          ` : `<span class="text-slate-400 font-mono italic text-[11px]">Sem Ação Permissível</span>`}
        </td>
      </tr>
    `).join('');
  }

  carregarGuindastesSupabase();

  if (toggleGuindasteBtn && guindasteForm) {
    toggleGuindasteBtn.addEventListener('click', () => {
      if (!isInspetor) {
        alert('Acesso Restrito: Apenas Inspetores têm permissão para cadastrar novos guindastes (Spec.md RF 1)!');
        return;
      }
      guindasteForm.classList.toggle('hidden');
    });
  }

  // Item 17: Módulo de Solicitação de Manutenção de Navios
  const toggleNavioManutBtn = document.getElementById('toggleNavioManutFormBtn');
  const navioManutForm = document.getElementById('navioManutForm');
  const navioManutSelect = document.getElementById('navioManutSelect');
  let naviosListLocal = [];

  async function carregarNaviosParaManutencao() {
    if (!navioManutSelect) return;
    let navs = [];
    if (window.NexusRepository) {
      try { navs = await window.NexusRepository.getNavios(); } catch (e) {}
    }
    if (!navs || navs.length === 0) {
      navs = JSON.parse(localStorage.getItem('nexus_navios_list') || '[]');
    }
    if (navs.length === 0) {
      navs = [
        { nome: 'MV Santos Star', imo: 'IMO-9823412', data_construcao: '2021-01-01', data_ultima_manutencao_geral: '2021-01-01' },
        { nome: 'MV Pacific Giant', imo: 'IMO-9742110', data_construcao: '2025-01-01', data_ultima_manutencao_geral: '2025-01-01' },
        { nome: 'MV Atlantic Breeze', imo: 'IMO-9651002', data_construcao: '2024-06-01', data_ultima_manutencao_geral: '2024-06-01' }
      ];
    }
    naviosListLocal = navs;
    navioManutSelect.innerHTML = '<option value="">Selecione a Embarcação...</option>';
    navs.forEach(n => {
      navioManutSelect.innerHTML += `<option value="${n.nome}">${n.nome} (${n.imo || n.id})</option>`;
    });
  }

  carregarNaviosParaManutencao();

  if (toggleNavioManutBtn && navioManutForm) {
    toggleNavioManutBtn.addEventListener('click', () => navioManutForm.classList.toggle('hidden'));
  }

  if (navioManutForm) {
    navioManutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const navioNome = navioManutSelect.value;
      const tipoManut = document.getElementById('navioTipoManutSelect').value;
      const descricao = document.getElementById('navioDescManut').value.trim();

      if (!navioNome) {
        alert('Selecione uma embarcação para a manutenção.');
        return;
      }

      const navio = naviosListLocal.find(n => n.nome === navioNome);

      // Item 17: Regra da Manutenção Geral (Requer >= 3 anos de uso / 1095 dias)
      if (tipoManut === 'GERAL') {
        const agora = Date.now();
        const tresAnosMs = 3 * 365 * 24 * 60 * 60 * 1000;
        const dataRef = navio ? (navio.data_ultima_manutencao_geral || navio.data_construcao || navio.dataSaida || '2025-01-01') : '2025-01-01';
        const diffMs = agora - new Date(dataRef).getTime();

        if (diffMs < tresAnosMs) {
          alert(`OPÇÃO BLOQUEADA (Item 17): A opção "Manutenção Geral" só pode ser selecionada se o navio estiver em uso há 3 anos ou mais (ou se a última manutenção geral tiver ocorrido há 3 anos ou mais). A embarcação "${navioNome}" possui histórico recente (${new Date(dataRef).toLocaleDateString('pt-BR')}). Selecione Preventiva, Corretiva ou Preditiva.`);
          return;
        }
      }

      const newOsId = `OS-NAVIO-${Math.floor(100 + Math.random() * 900)}`;
      osList.unshift({
        id: newOsId,
        equipamento: `Navio ${navioNome}`,
        prioridade: tipoManut === 'CORRETIVA' ? 'ALTA' : 'MEDIA',
        descricao: `[${tipoManut}] ${descricao}`,
        status: 'EM_MANUTENCAO',
        data: new Date().toISOString().split('T')[0]
      });

      localStorage.setItem('nexus_os_list', JSON.stringify(osList));

      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('manutencoes').insert({
            entidade_tipo: 'NAVIO',
            descricao: `[${newOsId}][${tipoManut}] Navio: ${navioNome} - ${descricao}`,
            status: 'SOLICITADA'
          });
          await window.nexusSupabase.from('navios').update({ estado_operacional: 'AGENDADO_PARA_REFORMA' }).eq('nome', navioNome);
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar manutenção de navio no Supabase:', err);
        }
      }

      if (window.NexusRepository && window.NexusRepository.notifyChange) {
        window.NexusRepository.notifyChange('manutencoes');
      }

      renderOsTable();
      navioManutForm.reset();
      navioManutForm.classList.add('hidden');
      alert(`Solicitação de Manutenção (${tipoManut}) registrada com sucesso para o navio ${navioNome}! Ordem de Serviço ${newOsId} criada.`);
    });
  }

  if (guindasteForm) {
    guindasteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!isInspetor) {
        alert('Acesso Restrito: Cadastro de guindastes é de responsabilidade exclusiva do Inspetor!');
        return;
      }

      const identificacao = document.getElementById('gndNumero').value.trim().toUpperCase();
      const dataManut = document.getElementById('gndDataManut').value;
      const estado = document.getElementById('gndEstado').value;

      const novoGnd = { id: identificacao, identificacao, estado, dataManut };
      guindastesList.push(novoGnd);
      localStorage.setItem('nexus_guindastes_list', JSON.stringify(guindastesList));

      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('guindastes').insert({
            numero_identificacao: identificacao,
            estado,
            data_ultima_manutencao: dataManut || null
          });
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar guindaste com Supabase:', err);
        }
      }

      renderGuindastesTable();
      guindasteForm.reset();
      guindasteForm.classList.add('hidden');
      alert(`Guindaste ${identificacao} cadastrado com sucesso pelo Inspetor!`);
    });
  }

  window.solicitarManutencaoGuindaste = async function(identificacao) {
    if (!isSupervisor) {
      alert('Acesso Restrito: Apenas o Supervisor pode solicitar manutenção de guindastes!');
      return;
    }

    const descricao = await window.nexusPrompt('Solicitar Manutenção de Guindaste', `Informe a justificativa/falha para solicitar manutenção do Guindaste ${identificacao}:`, 'Revisão periódica dos cabos de aço e motores');
    if (!descricao) return;

    const gnd = guindastesList.find(x => x.identificacao === identificacao);
    if (gnd) gnd.estado = 'EM_MANUTENCAO';

    const newOsId = `OS-2026-${Math.floor(100 + Math.random() * 900)}`;
    osList.unshift({
      id: newOsId,
      equipamento: identificacao,
      prioridade: 'ALTA',
      descricao: `Manutenção de Guindaste: ${descricao}`,
      status: 'EM_MANUTENCAO',
      data: new Date().toISOString().split('T')[0]
    });

    localStorage.setItem('nexus_guindastes_list', JSON.stringify(guindastesList));
    localStorage.setItem('nexus_os_list', JSON.stringify(osList));

    if (window.nexusSupabase) {
      try {
        await window.nexusSupabase.from('guindastes')
          .update({ estado: 'EM_MANUTENCAO' })
          .eq('numero_identificacao', identificacao);
      } catch (err) {
        console.warn('[NexusPort] Erro ao atualizar guindaste no Supabase:', err);
      }
    }

    renderGuindastesTable();
    renderOsTable();
    alert(`Manutenção solicitada para o Guindaste ${identificacao}! Ordem de Serviço ${newOsId} criada.`);
  };

  window.concluirManutencaoGuindaste = async function(identificacao) {
    if (!isSupervisor) {
      alert('Acesso Restrito: Apenas o Supervisor pode aprovar/concluir manutenção de guindastes!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const gnd = guindastesList.find(x => x.identificacao === identificacao);
    if (gnd) {
      gnd.estado = 'OPERANTE';
      gnd.dataManut = todayStr;
    }

    const os = osList.find(o => o.equipamento === identificacao && o.status === 'EM_MANUTENCAO');
    if (os) os.status = 'CONCLUIDA';

    localStorage.setItem('nexus_guindastes_list', JSON.stringify(guindastesList));
    localStorage.setItem('nexus_os_list', JSON.stringify(osList));

    if (window.nexusSupabase) {
      try {
        await window.nexusSupabase.from('guindastes')
          .update({ estado: 'OPERANTE', data_ultima_manutencao: todayStr })
          .eq('numero_identificacao', identificacao);
      } catch (err) {
        console.warn('[NexusPort] Erro ao atualizar guindaste no Supabase:', err);
      }
    }

    renderGuindastesTable();
    renderOsTable();
    alert(`Manutenção do Guindaste ${identificacao} CONCLUÍDA! Equipamento reativado e no estado OPERANTE.`);
  };

  let osList = JSON.parse(localStorage.getItem('nexus_os_list') || '[]');

  function renderOsTable() {
    if (!osTableBody) return;

    if (osList.length === 0) {
      osTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="p-4 text-center text-slate-400 italic">Nenhuma ordem de serviço cadastrada no banco de dados.</td>
        </tr>
      `;
      return;
    }

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

  async function carregarEquipamentosEAlertas() {
    const osSelect = document.getElementById('osEquipamento');
    const alertaList = document.getElementById('alertaPreventivaList');

    let gnds = guindastesList || [];
    let conts = [];
    let navs = naviosListLocal || [];

    if (window.nexusSupabase) {
      try {
        const { data: dbGnd } = await window.nexusSupabase.from('guindastes').select('*');
        if (dbGnd && dbGnd.length > 0) gnds = dbGnd.map(g => ({ identificacao: g.numero_identificacao, dataManut: g.data_ultima_manutencao }));

        const { data: dbCont } = await window.nexusSupabase.from('containers').select('*');
        if (dbCont && dbCont.length > 0) conts = dbCont.map(c => ({ identificacao: c.numero_identificacao, dataManut: c.data_ultima_manutencao || c.data_fabricacao }));

        const { data: dbNav } = await window.nexusSupabase.from('navios').select('*');
        if (dbNav && dbNav.length > 0) navs = dbNav.map(n => ({ nome: n.nome, imo: n.numero_imo, dataManut: n.data_ultima_manutencao_geral || n.data_construcao || n.created_at }));
      } catch (e) {
        console.warn('Erro ao buscar equipamentos para OS no Supabase:', e);
      }
    }

    if (conts.length === 0) {
      conts = JSON.parse(localStorage.getItem('nexus_containers_list') || '[]').map(c => ({ identificacao: c.identificacao || c.id, dataManut: c.data_ultima_manutencao || '2024-01-01' }));
    }

    if (osSelect) {
      osSelect.innerHTML = '<option value="">Selecione o Equipamento / Ativo...</option>';

      if (gnds.length > 0) {
        osSelect.innerHTML += '<optgroup label="Guindastes & Pórticos">';
        gnds.forEach(g => {
          osSelect.innerHTML += `<option value="Guindaste ${g.identificacao || g.id}">Guindaste ${g.identificacao || g.id}</option>`;
        });
        osSelect.innerHTML += '</optgroup>';
      }

      if (conts.length > 0) {
        osSelect.innerHTML += '<optgroup label="Contêineres">';
        conts.forEach(c => {
          osSelect.innerHTML += `<option value="Contêiner ${c.identificacao}">Contêiner ${c.identificacao}</option>`;
        });
        osSelect.innerHTML += '</optgroup>';
      }

      if (navs.length > 0) {
        osSelect.innerHTML += '<optgroup label="Embarcações (Navios)">';
        navs.forEach(n => {
          osSelect.innerHTML += `<option value="Navio ${n.nome}">Navio ${n.nome}</option>`;
        });
        osSelect.innerHTML += '</optgroup>';
      }
    }

    if (alertaList) {
      const tresAnosMs = 3 * 365 * 24 * 60 * 60 * 1000;
      const agora = Date.now();
      const alertas = [];

      navs.forEach(n => {
        if (n.dataManut) {
          const diff = agora - new Date(n.dataManut).getTime();
          if (diff >= tresAnosMs) {
            alertas.push(`<strong>Navio ${n.nome} (${n.imo || 'Sem IMO'}):</strong> Registrado/Manutenção em ${new Date(n.dataManut).toLocaleDateString('pt-BR')} — Ciclo preventivo recomendado (>3 anos) vencido.`);
          }
        }
      });

      gnds.forEach(g => {
        const d = g.dataManut || g.data_ultima_manutencao;
        if (d) {
          const diff = agora - new Date(d).getTime();
          if (diff >= tresAnosMs) {
            alertas.push(`<strong>Guindaste ${g.identificacao || g.id}:</strong> Última manutenção registrada em ${new Date(d).toLocaleDateString('pt-BR')} — Ciclo de 3 anos excedido.`);
          }
        }
      });

      conts.forEach(c => {
        const d = c.dataManut;
        if (d) {
          const diff = agora - new Date(d).getTime();
          if (diff >= tresAnosMs) {
            alertas.push(`<strong>Contêiner ${c.identificacao}:</strong> Última manutenção em ${new Date(d).toLocaleDateString('pt-BR')} — Ciclo preventivo recomendado (>3 anos) vencido.`);
          }
        }
      });

      if (alertas.length > 0) {
        alertaList.innerHTML = alertas.map((a, idx) => `${idx + 1}. ${a}`).join('<br>');
      } else {
        alertaList.innerHTML = 'Nenhum equipamento com ciclo de preventiva vencido (> 3 anos) no momento. Todos os ativos operam dentro do ciclo recomendado.';
      }
    }
  }

  carregarEquipamentosEAlertas();

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
          window.nexusSupabase.from('manutencoes').insert({
            entidade_tipo: 'CONTAINER',
            descricao: `[${newId}][${prioridade}] Equipamento: ${equipamento} - ${descricao}`,
            status: 'SOLICITADA'
          }).then().catch(err => console.warn('[NexusPort] Erro ao sincronizar OS com Supabase:', err));
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

        if (acao === 'APROVAR') {
          await window.nexusSupabase.from('navios').update({ estado_operacional: 'EM_REFORMA' }).eq('nome', os.equipamento);
        } else if (acao === 'CONCLUIR') {
          await window.nexusSupabase.from('historico_manutencoes').insert({
            data_manutencao: new Date().toISOString().split('T')[0],
            descricao_servicos: `Conclusão da Ordem de Serviço ${idOS} para ${os.equipamento}: ${os.descricao}`
          });
          await window.nexusSupabase.from('navios').update({ estado_operacional: 'OPERANTE' }).eq('nome', os.equipamento);
        }
      } catch (err) {
        console.warn('[NexusPort] Erro ao atualizar status da OS no Supabase:', err);
      }
    }

    renderOsTable();
  };

  // Botão de Pânico
  if (panicBtn) {
    panicBtn.addEventListener('click', async () => {
      if (await window.nexusConfirm('DECLARAÇÃO DE EMERGÊNCIA', 'ATENÇÃO: Deseja acionar o BOTÃO DE PÂNICO e declarar EMERGÊNCIA CRÍTICA no Terminal STS-01?')) {
        localStorage.setItem('nexus_emergency_active', 'true');
        if (emergencyBanner) emergencyBanner.classList.remove('hidden');
        alert('EMERGÊNCIA CRÍTICA DECLARADA! Pátio STS-01 bloqueado temporariamente.');
      }
    });
  }

  if (resetEmergencyBtn) {
    resetEmergencyBtn.addEventListener('click', async () => {
      if (await window.nexusConfirm('Desativar Emergência', 'Confirmar desativação do alarme de emergência?')) {
        localStorage.removeItem('nexus_emergency_active');
        if (emergencyBanner) emergencyBanner.classList.add('hidden');
        alert('Alarme de emergência desativado com sucesso.');
      }
    });
  }

  if (localStorage.getItem('nexus_emergency_active') === 'true' && emergencyBanner) {
    emergencyBanner.classList.remove('hidden');
  }

  // Sincronização viva em tempo real (Item 2)
  window.addEventListener('nexus_data_changed', () => {
    carregarGuindastesSupabase();
    carregarNaviosParaManutencao();
    renderOsTable();
  });
});

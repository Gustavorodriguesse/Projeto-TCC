/**
 * Lógica do Módulo do Técnico em Portos (tecnico_portos.html) - NexusPort
 * Gerencia invalidação/reemissão de códigos (RN 15 / T1.8), CRUD de funcionários (T2.1)
 * e livro de visitantes (T2.2).
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) return;

  const searchInput = document.getElementById('empMatriculaSearch');
  const searchBtn = document.getElementById('searchEmpBtn');
  const regenBtn = document.getElementById('regenCodeBtn');
  const resultBox = document.getElementById('empSearchResultBox');
  const regenNotice = document.getElementById('codeRegenNotice');

  const resNome = document.getElementById('resEmpNome');
  const resCargo = document.getElementById('resEmpCargo');
  const resCodigo = document.getElementById('resEmpCodigo');
  const newGenCode = document.getElementById('newGeneratedCode');

  let selectedEmp = null;

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
    searchBtn.addEventListener('click', async () => {
      const q = searchInput.value.trim().toUpperCase();
      if (!q) {
        alert('Informe a matrícula para buscar.');
        return;
      }

      const formattedMatricula = q.startsWith('MAT-') ? q : `MAT-${q}`;
      const storedOverrides = JSON.parse(localStorage.getItem('nexus_code_overrides') || '{}');
      let found = null;

      // 1. Busca assíncrona na tabela 'funcionarios' do Supabase
      if (window.nexusSupabase) {
        try {
          const { data, error } = await window.nexusSupabase
            .from('funcionarios')
            .select('*')
            .or(`matricula.eq.${q},matricula.eq.${formattedMatricula}`)
            .maybeSingle();

          if (!error && data) {
            found = {
              codigo: data.codigo_individual || `NX-${data.matricula.replace('MAT-', '')}-SP`,
              matricula: data.matricula,
              nome: data.nome,
              cargo: data.cargo,
              cargo_nome: data.cargo_nome || data.cargo
            };
          }
        } catch (err) {
          console.warn('[NexusPort Técnico] Falha na consulta de funcionário no Supabase:', err);
        }
      }

      // 2. Fallback nas listas locais (mock e nexus_func_list) se não encontrar no Supabase
      if (!found) {
        found = employeeList.find(e => e.matricula.toUpperCase() === q || e.matricula.toUpperCase() === formattedMatricula);
        if (!found) {
          const dynamicFuncs = JSON.parse(localStorage.getItem('nexus_func_list') || '[]');
          const dyn = dynamicFuncs.find(f => f.matricula.toUpperCase() === q || f.matricula.toUpperCase() === formattedMatricula);
          if (dyn) {
            found = {
              codigo: dyn.codigo,
              matricula: dyn.matricula,
              nome: dyn.nome,
              cargo: dyn.cargo,
              cargo_nome: dyn.cargo
            };
          }
        }
      }

      selectedEmp = found;

      if (selectedEmp) {
        if (resultBox) resultBox.classList.remove('hidden');
        if (resNome) resNome.textContent = selectedEmp.nome;
        if (resCargo) resCargo.textContent = `${selectedEmp.cargo_nome || selectedEmp.cargo} (${selectedEmp.matricula})`;

        const currentCode = storedOverrides[selectedEmp.matricula]?.codigo || selectedEmp.codigo;
        if (resCodigo) resCodigo.textContent = currentCode;

        if (regenBtn) regenBtn.disabled = false;
        if (regenNotice) regenNotice.classList.add('hidden');
      } else {
        alert(`Funcionário com matrícula "${q}" não localizado.`);
        if (resultBox) resultBox.classList.add('hidden');
        if (regenBtn) regenBtn.disabled = true;
      }
    });
  }

  if (regenBtn) {
    regenBtn.addEventListener('click', async () => {
      if (!selectedEmp) return;

      if (confirm(`Confirma a INVALIDAÇÃO do código atual (${resCodigo.textContent}) para ${selectedEmp.nome}?`)) {
        const suffix = Math.floor(1000 + Math.random() * 9000);
        const newCode = `NX-${selectedEmp.matricula.replace('MAT-', '')}-${suffix}`;

        const storedOverrides = JSON.parse(localStorage.getItem('nexus_code_overrides') || '{}');
        storedOverrides[selectedEmp.matricula] = {
          old_codigo: resCodigo.textContent,
          codigo: newCode,
          gerado_por: session.matricula,
          data_geracao: new Date().toISOString()
        };

        localStorage.setItem('nexus_code_overrides', JSON.stringify(storedOverrides));

        if (window.nexusSupabase) {
          try {
            await window.nexusSupabase.from('funcionarios')
              .update({ codigo_individual: newCode })
              .eq('matricula', selectedEmp.matricula);
          } catch (err) {
            console.warn('[NexusPort] Erro ao atualizar código no Supabase:', err);
          }
        }

        if (resCodigo) resCodigo.textContent = newCode;
        if (newGenCode) newGenCode.textContent = newCode;
        if (regenNotice) regenNotice.classList.remove('hidden');

        alert(`Sucesso! Código antigo invalidado. O novo código de acesso é: ${newCode}`);
      }
    });
  }

  // CRUD Funcionários (T2.1 & Conexão Supabase)
  const toggleFuncBtn = document.getElementById('toggleFuncFormBtn');
  const funcForm = document.getElementById('funcCrudForm');
  const funcTableBody = document.getElementById('funcCrudTableBody');

  let mergedFuncList = [];

  async function carregarFuncionariosCompleto() {
    let localList = JSON.parse(localStorage.getItem('nexus_func_list') || '[]');
    let supabaseFuncs = [];

    if (window.nexusSupabase) {
      try {
        const { data, error } = await window.nexusSupabase
          .from('funcionarios')
          .select('*');
        if (!error && data) {
          supabaseFuncs = data;
        }
      } catch (err) {
        console.warn('[NexusPort] Falha ao carregar funcionários do Supabase:', err);
      }
    }

    // Mescla sem omitir nenhum funcionário e limpando duplicidades de MAT-1914
    const allMap = new Map();

    employeeList.forEach(e => {
      allMap.set(e.matricula.toUpperCase(), {
        matricula: e.matricula,
        nome: e.nome,
        cargo: e.cargo_nome || e.cargo,
        codigo: e.codigo,
        doc: 'Ficha Cadastral Base'
      });
    });

    localList.forEach(l => {
      const matKey = l.matricula.toUpperCase();
      // Se for MAT-1914, garante que apenas Maxwell Philip da Cruz seja mantido
      if (matKey === 'MAT-1914' && l.nome !== 'Maxwell Philip da Cruz') {
        return;
      }
      allMap.set(matKey, {
        matricula: l.matricula,
        nome: l.nome,
        cargo: l.cargo,
        codigo: l.codigo,
        doc: l.doc || 'Ficha Local'
      });
    });

    supabaseFuncs.forEach(s => {
      const matKey = s.matricula.toUpperCase();
      if (matKey === 'MAT-1914' && s.nome !== 'Maxwell Philip da Cruz') {
        return;
      }
      allMap.set(matKey, {
        matricula: s.matricula,
        nome: s.nome,
        cargo: s.cargo,
        codigo: s.codigo_individual || `NX-${s.matricula.replace('MAT-', '')}-SP`,
        doc: s.ativo ? 'Ativo no Supabase' : 'Inativo no Supabase'
      });
    });

    // Garante presença exata de Maxwell Philip da Cruz em MAT-1914 se existir local/remoto
    const maxwellLocal = localList.find(x => x.matricula.toUpperCase() === 'MAT-1914' && x.nome === 'Maxwell Philip da Cruz');
    const maxwellSupa = supabaseFuncs.find(x => x.matricula.toUpperCase() === 'MAT-1914' && x.nome === 'Maxwell Philip da Cruz');
    if (maxwellLocal || maxwellSupa) {
      const m = maxwellLocal || maxwellSupa;
      allMap.set('MAT-1914', {
        matricula: 'MAT-1914',
        nome: 'Maxwell Philip da Cruz',
        cargo: m.cargo || 'Planejador de Pátio e Navios',
        codigo: m.codigo || m.codigo_individual || 'NX-1914-PL',
        doc: 'Ficha Cadastral Oficial MAT-1914'
      });
    }

    mergedFuncList = Array.from(allMap.values());

    // Atualiza local storage com a lista unificada
    localStorage.setItem('nexus_func_list', JSON.stringify(mergedFuncList));
    renderFuncTable();
  }

  function renderFuncTable() {
    if (!funcTableBody) return;
    funcTableBody.innerHTML = mergedFuncList.map(f => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <td class="p-3 font-mono font-bold text-nexus-500">${f.matricula}</td>
        <td class="p-3 font-bold">${f.nome}</td>
        <td class="p-3 text-slate-500 font-semibold">${f.cargo}</td>
        <td class="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">${f.codigo}</td>
        <td class="p-3 text-slate-400 font-mono text-xs">${f.doc || 'Cadastrado'}</td>
      </tr>
    `).join('');
  }

  carregarFuncionariosCompleto();

  if (toggleFuncBtn && funcForm) {
    toggleFuncBtn.addEventListener('click', () => funcForm.classList.toggle('hidden'));
  }

  if (funcForm) {
    funcForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const matriculaRaw = document.getElementById('funcMatricula').value.trim();
      const nome = document.getElementById('funcNome').value.trim();
      const cargoSelect = document.getElementById('funcCargo');
      const cargoValue = cargoSelect ? cargoSelect.value : 'ESTIVADOR';
      const cargoText = cargoSelect && cargoSelect.options[cargoSelect.selectedIndex] ? cargoSelect.options[cargoSelect.selectedIndex].text : cargoValue;
      const doc = document.getElementById('funcDoc').value.trim();

      const formattedMatricula = matriculaRaw.toUpperCase().startsWith('MAT-') ? matriculaRaw.toUpperCase() : `MAT-${matriculaRaw.toUpperCase()}`;

      // Validação de Duplicidade Rígida: Bloqueia qualquer cadastro com a mesma matrícula
      const funcionarioExistente = mergedFuncList.find(f => f.matricula.toUpperCase() === formattedMatricula);
      if (funcionarioExistente) {
        alert(`BLOQUEIO DE DUPLICIDADE: A matrícula "${formattedMatricula}" já está cadastrada no sistema para o funcionário "${funcionarioExistente.nome}". Não é permitido cadastrar mais de uma pessoa com a mesma matrícula!`);
        return;
      }

      // Validação assíncrona adicional no Supabase
      if (window.nexusSupabase) {
        try {
          const { data: dupData } = await window.nexusSupabase
            .from('funcionarios')
            .select('nome, matricula')
            .eq('matricula', formattedMatricula)
            .maybeSingle();

          if (dupData) {
            alert(`BLOQUEIO DE DUPLICIDADE (Supabase): A matrícula "${formattedMatricula}" já pertence ao funcionário "${dupData.nome}". Não é permitido cadastrar duplicidades!`);
            return;
          }
        } catch (err) {
          console.warn('[NexusPort] Erro ao verificar duplicidade no Supabase:', err);
        }
      }

      const suffix = Math.floor(1000 + Math.random() * 9000);
      const codigo = `NX-${formattedMatricula.replace('MAT-', '')}-${suffix}`;

      const novoFuncionario = {
        matricula: formattedMatricula,
        nome: nome,
        cargo: cargoText,
        cargo_enum: cargoValue,
        codigo: codigo,
        doc: doc || 'Cadastrado no Sistema'
      };

      const localList = JSON.parse(localStorage.getItem('nexus_func_list') || '[]');
      localList.unshift(novoFuncionario);
      localStorage.setItem('nexus_func_list', JSON.stringify(localList));

      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('funcionarios').insert({
            matricula: matricula,
            codigo_individual: codigo,
            nome: nome,
            cargo: cargoValue,
            ativo: true
          });
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar funcionário com Supabase:', err);
        }
      }

      await carregarFuncionariosCompleto();
      funcForm.reset();
      funcForm.classList.add('hidden');

      if (window.mostrarFeedback) {
        window.mostrarFeedback('sucesso', 'Funcionário Cadastrado', `Funcionário ${nome} cadastrado com sucesso! Código gerado: ${codigo}`);
      } else {
        alert(`Funcionário ${nome} cadastrado com sucesso! Código gerado: ${codigo}`);
      }
    });
  }

  // CRUD Visitantes (T2.2 & Separação em Ativos / Histórico)
  const toggleVisBtn = document.getElementById('toggleVisFormBtn');
  const visForm = document.getElementById('visCrudForm');
  const visTableBody = document.getElementById('visCrudTableBody');
  const visHistoricoTableBody = document.getElementById('visHistoricoTableBody');

  let visList = JSON.parse(localStorage.getItem('nexus_vis_list') || 'null');
  if (!visList) {
    visList = [
      { id: 'VIS-001', nome: 'João Souza', documento: 'CPF 123.456.789-00', motivo: 'Fiscalização Alfandegária', status: 'EM_VISITA', data: '20/09/2026 08:30', data_saida: null, vistoria: null, por: session.matricula },
      { id: 'VIS-002', nome: 'Ana Beatriz', documento: 'CPF 987.654.321-11', motivo: 'Vistoria Ambiental de Pátio', status: 'CONCLUIDO', data: '15/09/2026 09:00', data_saida: '15/09/2026 11:30', vistoria: 'Vistoria em Ordem - Sem Alterações', por: session.matricula }
    ];
    localStorage.setItem('nexus_vis_list', JSON.stringify(visList));
  }

  async function carregarVisitantesCompleto() {
    let supabaseVisitors = [];

    if (window.nexusSupabase) {
      try {
        const { data, error } = await window.nexusSupabase
          .from('visitantes')
          .select('*');
        if (!error && data) {
          supabaseVisitors = data;
        }
      } catch (err) {
        console.warn('[NexusPort] Erro ao carregar visitantes do Supabase:', err);
      }
    }

    const localVisitors = JSON.parse(localStorage.getItem('nexus_vis_list') || '[]');
    const mergedMap = new Map();

    localVisitors.forEach(v => {
      const key = v.id || `${v.nome}_${v.documento}`;
      mergedMap.set(key, v);
    });

    supabaseVisitors.forEach(s => {
      const key = s.id || `${s.nome}_${s.documento}`;
      const isConcluido = s.data_hora_saida || s.status === 'CONCLUIDO';
      mergedMap.set(key, {
        id: s.id,
        nome: s.nome,
        documento: s.documento,
        motivo: s.motivo,
        status: isConcluido ? 'CONCLUIDO' : (s.status || 'EM_VISITA'),
        data: s.data_hora_entrada ? new Date(s.data_hora_entrada).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR'),
        data_saida: s.data_hora_saida ? new Date(s.data_hora_saida).toLocaleString('pt-BR') : null,
        vistoria: isConcluido ? 'Vistoria em Ordem - Concluída' : null,
        por: session.matricula
      });
    });

    visList = Array.from(mergedMap.values());
    localStorage.setItem('nexus_vis_list', JSON.stringify(visList));
    renderVisTables();
  }

  function renderVisTables() {
    const ativos = visList.filter(v => !v.data_saida && v.status !== 'CONCLUIDO');
    const historico = visList.filter(v => v.data_saida || v.status === 'CONCLUIDO');

    // 1. Renderiza Visitantes Ativos
    if (visTableBody) {
      if (ativos.length === 0) {
        visTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="p-4 text-center text-slate-400 italic">Nenhum visitante ativo no porto no momento.</td>
          </tr>
        `;
      } else {
        visTableBody.innerHTML = ativos.map(v => {
          const vKey = v.id || `${v.nome}_${v.documento}`;
          return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="p-3 font-bold">${v.nome}</td>
              <td class="p-3 font-mono text-xs">${v.documento}</td>
              <td class="p-3 text-slate-500">${v.motivo}</td>
              <td class="p-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  ${v.status || 'EM_VISITA'}
                </span>
              </td>
              <td class="p-3 font-mono text-xs text-slate-400">${v.data}</td>
              <td class="p-3 font-mono text-xs font-bold text-nexus-500">${v.por || session.matricula}</td>
              <td class="p-3 text-right whitespace-nowrap">
                <button type="button" onclick="window.registrarSaidaVisitante('${vKey}')" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 ml-auto shadow-sm transition-colors">
                  <span class="material-symbols-outlined text-[16px]">logout</span>
                  <span>Registrar Saída & Vistoria</span>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // 2. Renderiza Histórico de Visitas Concluídas no Ano
    if (visHistoricoTableBody) {
      if (historico.length === 0) {
        visHistoricoTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="p-4 text-center text-slate-400 italic">Nenhuma visita concluída registrada no histórico do ano.</td>
          </tr>
        `;
      } else {
        visHistoricoTableBody.innerHTML = historico.map(v => `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="p-3 font-bold text-slate-700 dark:text-slate-200">${v.nome}</td>
            <td class="p-3 font-mono text-xs">${v.documento}</td>
            <td class="p-3 text-slate-500">${v.motivo}</td>
            <td class="p-3 font-mono text-xs text-slate-400">${v.data}</td>
            <td class="p-3 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">${v.data_saida || 'Concluída'}</td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                ${v.vistoria || 'Vistoria em Ordem - Sem Anormalidades'}
              </span>
            </td>
            <td class="p-3 font-mono text-xs text-slate-400">${v.por || session.matricula}</td>
          </tr>
        `).join('');
      }
    }
  }

  // Registrar Saída do Visitante (Move do Ativo para o Histórico)
  window.registrarSaidaVisitante = async function(visitorKey) {
    const visitor = visList.find(v => (v.id && v.id === visitorKey) || (`${v.nome}_${v.documento}` === visitorKey));
    if (!visitor) return;

    const dataSaidaStr = prompt(`Informe a data/hora de saída do visitante ${visitor.nome}:`, new Date().toLocaleString('pt-BR'));
    if (!dataSaidaStr) return;

    const parecerVistoria = prompt(`Informe o parecer da vistoria para ${visitor.nome}:`, 'Vistoria em Ordem - Sem Anormalidades');

    visitor.status = 'CONCLUIDO';
    visitor.data_saida = dataSaidaStr;
    visitor.vistoria = parecerVistoria || 'Vistoria em Ordem - Sem Anormalidades';

    localStorage.setItem('nexus_vis_list', JSON.stringify(visList));

    if (window.nexusSupabase) {
      try {
        if (visitor.id) {
          await window.nexusSupabase.from('visitantes')
            .update({
              data_hora_saida: new Date().toISOString(),
              motivo: `${visitor.motivo} | ${visitor.vistoria}`
            })
            .eq('id', visitor.id);
        } else {
          await window.nexusSupabase.from('visitantes')
            .update({
              data_hora_saida: new Date().toISOString(),
              motivo: `${visitor.motivo} | ${visitor.vistoria}`
            })
            .eq('documento', visitor.documento);
        }
      } catch (err) {
        console.warn('[NexusPort] Erro ao atualizar saída de visitante no Supabase:', err);
      }
    }

    renderVisTables();
    alert(`Saída do visitante ${visitor.nome} registrada com sucesso! A visita foi concluída e arquivada no histórico do ano.`);
  };

  carregarVisitantesCompleto();

  if (toggleVisBtn && visForm) {
    toggleVisBtn.addEventListener('click', () => visForm.classList.toggle('hidden'));
  }

  if (visForm) {
    visForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('visNome').value.trim();
      const documento = document.getElementById('visDocumento').value.trim();
      const motivo = document.getElementById('visMotivo').value.trim();
      const statusElem = document.getElementById('visStatus');
      const status = statusElem ? statusElem.value : 'EM_VISITA';

      // C14: Impedir cadastro de visitantes com documento duplicado
      const docNormalizado = documento.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const visitanteExistente = visList.find(v => v.documento.toUpperCase().replace(/[^A-Z0-9]/g, '') === docNormalizado);
      if (visitanteExistente) {
        alert(`BLOQUEIO DE SEGURANÇA (C14): O documento "${documento}" já está cadastrado para o visitante "${visitanteExistente.nome}". Cada visitante deve possuir documento único!`);
        return;
      }

      if (window.nexusSupabase) {
        try {
          const { data: dupVis } = await window.nexusSupabase
            .from('visitantes')
            .select('nome, documento')
            .eq('documento', documento)
            .maybeSingle();

          if (dupVis) {
            alert(`BLOQUEIO DE SEGURANÇA (C14): Documento "${documento}" já registrado no banco de dados para "${dupVis.nome}". Duplicação bloqueada.`);
            return;
          }
        } catch (err) {
          console.warn('[NexusPort] Erro ao validar documento no Supabase:', err);
        }
      }

      const novoVisitante = {
        id: `VIS-${Math.floor(1000 + Math.random() * 9000)}`,
        nome,
        documento,
        motivo,
        status,
        data: new Date().toLocaleString('pt-BR'),
        data_saida: null,
        vistoria: null,
        por: session.matricula
      };

      visList.push(novoVisitante);
      localStorage.setItem('nexus_vis_list', JSON.stringify(visList));

      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('visitantes').insert({
            nome: nome,
            documento: documento,
            motivo: motivo,
            data_hora_entrada: new Date().toISOString()
          });
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar visitante com Supabase:', err);
        }
      }

      renderVisTables();
      visForm.reset();
      visForm.classList.add('hidden');
      if (window.mostrarFeedback) {
        window.mostrarFeedback('sucesso', 'Visitante Registrado', `Entrada do visitante ${nome} (Status: ${status}) registrada com sucesso.`);
      } else {
        alert(`Entrada do visitante ${nome} (Status: ${status}) registrada no livro de visitantes.`);
      }
    });
  }
});

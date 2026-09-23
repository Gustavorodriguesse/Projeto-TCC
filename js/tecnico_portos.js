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
    searchBtn.addEventListener('click', () => {
      const q = searchInput.value.trim().toUpperCase();
      if (!q) {
        alert('Informe a matrícula para buscar.');
        return;
      }

      const storedOverrides = JSON.parse(localStorage.getItem('nexus_code_overrides') || '{}');
      const dynamicFuncs = JSON.parse(localStorage.getItem('nexus_func_list') || '[]');

      // Busca na lista mock padrão e também na lista de funcionários recém-cadastrados no localStorage
      let found = employeeList.find(e => e.matricula.toUpperCase() === q || e.matricula.toUpperCase() === `MAT-${q.replace('MAT-', '')}`);
      if (!found && dynamicFuncs && dynamicFuncs.length > 0) {
        const dyn = dynamicFuncs.find(f => f.matricula.toUpperCase() === q || f.matricula.toUpperCase() === `MAT-${q.replace('MAT-', '')}`);
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

  // CRUD Funcionários (T2.1)
  const toggleFuncBtn = document.getElementById('toggleFuncFormBtn');
  const funcForm = document.getElementById('funcCrudForm');
  const funcTableBody = document.getElementById('funcCrudTableBody');

  let funcList = JSON.parse(localStorage.getItem('nexus_func_list') || 'null');
  if (!funcList) {
    funcList = [
      { matricula: 'MAT-1040', nome: 'João Pedro', cargo: 'Estivador', codigo: 'NX-1040-OP', doc: 'Ficha #101' },
      { matricula: 'MAT-2050', nome: 'Mariana Souza', cargo: 'Conferente de Carga', codigo: 'NX-2050-CF', doc: 'Ficha #102' }
    ];
    localStorage.setItem('nexus_func_list', JSON.stringify(funcList));
  }

  function renderFuncTable() {
    if (!funcTableBody) return;
    funcTableBody.innerHTML = funcList.map(f => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3 font-mono font-bold text-nexus-500">${f.matricula}</td>
        <td class="p-3 font-bold">${f.nome}</td>
        <td class="p-3 text-slate-500">${f.cargo}</td>
        <td class="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">${f.codigo}</td>
        <td class="p-3 text-slate-400 font-mono text-xs">${f.doc || 'Privado'}</td>
      </tr>
    `).join('');
  }

  renderFuncTable();

  if (toggleFuncBtn && funcForm) {
    toggleFuncBtn.addEventListener('click', () => funcForm.classList.toggle('hidden'));
  }

  if (funcForm) {
    funcForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const matricula = document.getElementById('funcMatricula').value.trim();
      const nome = document.getElementById('funcNome').value.trim();
      const cargo = document.getElementById('funcCargo').value;
      const doc = document.getElementById('funcDoc').value.trim();

      const suffix = Math.floor(1000 + Math.random() * 9000);
      const codigo = `NX-${matricula.replace('MAT-', '')}-${suffix}`;

      funcList.push({ matricula, nome, cargo, codigo, doc });
      localStorage.setItem('nexus_func_list', JSON.stringify(funcList));

      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('funcionarios').insert({
            matricula: matricula,
            codigo_individual: codigo,
            nome: nome,
            cargo: cargo,
            ativo: true
          });
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar funcionário com Supabase:', err);
        }
      }

      renderFuncTable();
      funcForm.reset();
      funcForm.classList.add('hidden');
      alert(`Funcionário ${nome} cadastrado com sucesso! Código gerado: ${codigo}`);
    });
  }

  // CRUD Visitantes (T2.2)
  const toggleVisBtn = document.getElementById('toggleVisFormBtn');
  const visForm = document.getElementById('visCrudForm');
  const visTableBody = document.getElementById('visCrudTableBody');

  let visList = JSON.parse(localStorage.getItem('nexus_vis_list') || 'null');
  if (!visList) {
    visList = [
      { nome: 'João Souza', documento: 'CPF 123.456.789-00', motivo: 'Fiscalização Alfandegária', data: '20/09/2026 08:30', por: session.matricula }
    ];
    localStorage.setItem('nexus_vis_list', JSON.stringify(visList));
  }

  function renderVisTable() {
    if (!visTableBody) return;
    visTableBody.innerHTML = visList.map(v => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3 font-bold">${v.nome}</td>
        <td class="p-3 font-mono text-xs">${v.documento}</td>
        <td class="p-3 text-slate-500">${v.motivo}</td>
        <td class="p-3 font-mono text-xs text-slate-400">${v.data}</td>
        <td class="p-3 font-mono text-xs font-bold text-nexus-500">${v.por}</td>
      </tr>
    `).join('');
  }

  renderVisTable();

  if (toggleVisBtn && visForm) {
    toggleVisBtn.addEventListener('click', () => visForm.classList.toggle('hidden'));
  }

  if (visForm) {
    visForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('visNome').value.trim();
      const documento = document.getElementById('visDocumento').value.trim();
      const motivo = document.getElementById('visMotivo').value.trim();

      visList.push({
        nome, documento, motivo,
        data: new Date().toLocaleString('pt-BR'),
        por: session.matricula
      });

      localStorage.setItem('nexus_vis_list', JSON.stringify(visList));

      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('visitantes').insert({
            nome: nome,
            documento: documento,
            motivo: motivo
          });
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar visitante com Supabase:', err);
        }
      }

      renderVisTable();
      visForm.reset();
      visForm.classList.add('hidden');
      alert(`Entrada do visitante ${nome} registrada no livro de visitantes.`);
    });
  }
});

/**
 * Lógica do Módulo do Técnico em Portos e Infraestrutura Portuária (tecnico_portos.html) - NexusPort
 * Gerencia Portos, Berços, Guindastes, Pátios, cálculo de distância PostGIS e busca por proximidade espacial,
 * além de reemissão de códigos (RN 15), CRUD de funcionários e visitantes.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) return;

  // 1. RENDERIZAÇÃO E CRUD DE PORTOS
  const portosTableBody = document.getElementById('portosTableBody');
  const togglePortoBtn = document.getElementById('togglePortoFormBtn');
  const portoForm = document.getElementById('portoForm');

  const calcDistPortoA = document.getElementById('calcDistPortoA');
  const calcDistPortoB = document.getElementById('calcDistPortoB');
  const calcDistBtn = document.getElementById('calcDistBtn');
  const distResultBox = document.getElementById('distResultBox');
  const distResultText = document.getElementById('distResultText');
  const distResultMetersText = document.getElementById('distResultMetersText');
  const distResultNote = document.getElementById('distResultNote');

  async function renderPortosTable() {
    if (!portosTableBody) return;
    const portos = await NexusPostGIS.getPortos();

    portosTableBody.innerHTML = portos.map(p => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3 font-mono font-bold text-nexus-500">${p.codigo}</td>
        <td class="p-3 font-bold text-nexus-900 dark:text-white">${p.nome}</td>
        <td class="p-3 text-slate-500">${p.cidade} / ${p.pais}</td>
        <td class="p-3 font-mono text-xs text-slate-600 dark:text-slate-300">${p.lat}° S, ${p.lon}° W</td>
        <td class="p-3 font-mono text-[11px]"><span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold">Point(${p.lon} ${p.lat})</span></td>
      </tr>
    `).join('');

    // Preenche selects da calculadora de distância entre portos
    const selectOptions = portos.map(p => `<option value="${p.codigo}">${p.nome} (${p.codigo})</option>`).join('');

    if (calcDistPortoA) {
      calcDistPortoA.innerHTML = selectOptions;
      if (portos.length > 0) calcDistPortoA.value = portos[0].codigo;
    }
    if (calcDistPortoB) {
      calcDistPortoB.innerHTML = selectOptions;
      if (portos.length > 1) calcDistPortoB.value = portos[1].codigo;
    }

    // Preenche selects de porto nos formulários de Berço, Guindaste e Pátio
    const formSelectOptions = portos.map(p => `<option value="${p.codigo}">${p.nome}</option>`).join('');
    const elBercoPorto = document.getElementById('bercoPorto');
    const elGuindastePorto = document.getElementById('guindastePorto');
    const elPatioPorto = document.getElementById('patioPorto');

    if (elBercoPorto) elBercoPorto.innerHTML = formSelectOptions;
    if (elGuindastePorto) elGuindastePorto.innerHTML = formSelectOptions;
    if (elPatioPorto) elPatioPorto.innerHTML = formSelectOptions;
  }

  await renderPortosTable();

  if (togglePortoBtn && portoForm) {
    togglePortoBtn.addEventListener('click', () => portoForm.classList.toggle('hidden'));
  }

  if (portoForm) {
    portoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const codigo = document.getElementById('portoCodigo').value.trim().toUpperCase();
      const nome = document.getElementById('portoNome').value.trim();
      const cidadePais = document.getElementById('portoCidade').value.trim();
      const parts = cidadePais.split('/');
      const cidade = parts[0] ? parts[0].trim() : cidadePais;
      const pais = parts[1] ? parts[1].trim() : 'Brasil';
      const lat = parseFloat(document.getElementById('portoLat').value);
      const lon = parseFloat(document.getElementById('portoLon').value);

      await NexusPostGIS.savePorto({ codigo, nome, cidade, pais, lat, lon });
      await renderPortosTable();
      portoForm.reset();
      portoForm.classList.add('hidden');
      alert(`Porto "${nome}" (${codigo}) cadastrado com sucesso com localização PostGIS geography(Point, 4326)!`);
    });
  }

  // Calculadora de Distância entre dois Portos (PostGIS ST_Distance)
  if (calcDistBtn) {
    calcDistBtn.addEventListener('click', async () => {
      const pA = calcDistPortoA.value;
      const pB = calcDistPortoB.value;

      if (!pA || !pB) {
        alert('Selecione ambos os portos para calcular a distância.');
        return;
      }

      const res = await NexusPostGIS.calcularDistanciaPortos(pA, pB);
      if (res.sucesso) {
        if (distResultBox) distResultBox.classList.remove('hidden');
        if (distResultText) distResultText.textContent = `Distância Geográfica Estimada: ${res.distanciaKm.toLocaleString('pt-BR')} km`;
        if (distResultMetersText) distResultMetersText.textContent = `(${res.distanciaMetros.toLocaleString('pt-BR')} metros)`;
        if (distResultNote) distResultNote.textContent = res.notaExplicativa;
      } else {
        alert(res.mensagem || 'Erro ao calcular distância entre portos.');
      }
    });
  }

  // 2. RENDERIZAÇÃO E CRUD DE BERÇOS
  const bercosTableBody = document.getElementById('bercosTableBody');
  const toggleBercoBtn = document.getElementById('toggleBercoFormBtn');
  const bercoForm = document.getElementById('bercoForm');

  async function renderBercosTable() {
    if (!bercosTableBody) return;
    const bercos = await NexusPostGIS.getBercos();

    bercosTableBody.innerHTML = bercos.map(b => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-2.5 font-bold text-nexus-900 dark:text-white">${b.nome_codigo}</td>
        <td class="p-2.5 text-slate-500">${b.porto_nome || b.porto_codigo}</td>
        <td class="p-2.5 font-mono">${(b.capacidade || 50000).toLocaleString('pt-BR')} t</td>
        <td class="p-2.5">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            b.status === 'DISPONIVEL' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
            b.status === 'OCUPADO' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
            'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
          }">${b.status}</span>
        </td>
      </tr>
    `).join('');

    // Preenche select de berços no formulário de guindastes
    const elGuindasteBerco = document.getElementById('guindasteBerco');
    if (elGuindasteBerco) {
      elGuindasteBerco.innerHTML = '<option value="">Nenhum / Não associado</option>' + bercos.map(b => `<option value="${b.nome_codigo}">${b.nome_codigo}</option>`).join('');
    }
  }

  await renderBercosTable();

  if (toggleBercoBtn && bercoForm) {
    toggleBercoBtn.addEventListener('click', () => bercoForm.classList.toggle('hidden'));
  }

  if (bercoForm) {
    bercoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const porto_codigo = document.getElementById('bercoPorto').value;
      const nome_codigo = document.getElementById('bercoNome').value.trim();
      const capacidade = parseFloat(document.getElementById('bercoCapacidade').value) || 50000;
      const status = document.getElementById('bercoStatus').value;

      await NexusPostGIS.saveBerco({ porto_codigo, nome_codigo, capacidade, status });
      await renderBercosTable();
      bercoForm.reset();
      bercoForm.classList.add('hidden');
      alert(`Berço "${nome_codigo}" cadastrado com sucesso e vinculado ao porto ${porto_codigo}!`);
    });
  }

  // 3. RENDERIZAÇÃO E CRUD DE GUINDASTES
  const guindastesTableBody = document.getElementById('guindastesTableBody');
  const toggleGuindasteBtn = document.getElementById('toggleGuindasteFormBtn');
  const guindasteForm = document.getElementById('guindasteForm');

  async function renderGuindastesTable() {
    if (!guindastesTableBody) return;
    const guindastes = await NexusPostGIS.getGuindastes();

    guindastesTableBody.innerHTML = guindastes.map(g => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-2.5 font-mono font-bold text-nexus-500">${g.numero_identificacao}</td>
        <td class="p-2.5 text-xs text-slate-600 dark:text-slate-300">${g.tipo}</td>
        <td class="p-2.5 font-bold">${g.porto_codigo} ${g.berco_nome ? '• ' + g.berco_nome : ''}</td>
        <td class="p-2.5 font-mono">${g.capacidade} t</td>
        <td class="p-2.5">
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            g.status === 'DISPONIVEL' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
            g.status === 'OPERANDO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
            'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
          }">${g.status}</span>
        </td>
      </tr>
    `).join('');
  }

  await renderGuindastesTable();

  if (toggleGuindasteBtn && guindasteForm) {
    toggleGuindasteBtn.addEventListener('click', () => guindasteForm.classList.toggle('hidden'));
  }

  if (guindasteForm) {
    guindasteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const porto_codigo = document.getElementById('guindastePorto').value;
      const numero_identificacao = document.getElementById('guindasteCodigo').value.trim();
      const tipo = document.getElementById('guindasteTipo').value.trim();
      const capacidade = parseFloat(document.getElementById('guindasteCapacidade').value) || 50;
      const status = document.getElementById('guindasteStatus').value;
      const berco_nome = document.getElementById('guindasteBerco').value;

      await NexusPostGIS.saveGuindaste({ porto_codigo, numero_identificacao, tipo, capacidade, status, berco_nome });
      await renderGuindastesTable();
      guindasteForm.reset();
      guindasteForm.classList.add('hidden');
      alert(`Guindaste "${numero_identificacao}" cadastrado e associado!`);
    });
  }

  // 4. RENDERIZAÇÃO E CRUD DE PÁTIOS
  const patiosTableBody = document.getElementById('patiosTableBody');
  const togglePatioBtn = document.getElementById('togglePatioFormBtn');
  const patioForm = document.getElementById('patioForm');

  async function renderPatiosTable() {
    if (!patiosTableBody) return;
    const patios = await NexusPostGIS.getPatios();

    patiosTableBody.innerHTML = patios.map(pt => {
      const pct = Math.round((pt.ocupacao / pt.capacidade) * 100);
      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="p-2.5 font-bold text-nexus-900 dark:text-white">
            ${pt.codigo}
            <span class="block font-normal text-[10px] text-slate-500">${pt.nome}</span>
          </td>
          <td class="p-2.5 text-slate-500">${pt.porto_codigo}</td>
          <td class="p-2.5 font-mono">${pt.capacidade.toLocaleString('pt-BR')} TEUs</td>
          <td class="p-2.5 font-mono text-xs">
            ${pt.ocupacao.toLocaleString('pt-BR')} TEUs
            <span class="block font-bold text-[10px] ${pct > 80 ? 'text-red-600' : 'text-emerald-600'}">(${pct}% Ocupado)</span>
          </td>
          <td class="p-2.5"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono text-[10px] font-bold">${pt.status}</span></td>
        </tr>
      `;
    }).join('');
  }

  await renderPatiosTable();

  if (togglePatioBtn && patioForm) {
    togglePatioBtn.addEventListener('click', () => patioForm.classList.toggle('hidden'));
  }

  if (patioForm) {
    patioForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const porto_codigo = document.getElementById('patioPorto').value;
      const codigo = document.getElementById('patioCodigo').value.trim().toUpperCase();
      const nome = document.getElementById('patioNome').value.trim();
      const capacidade = parseInt(document.getElementById('patioCapacidade').value) || 1000;

      await NexusPostGIS.savePatio({ porto_codigo, codigo, nome, capacidade, ocupacao: 0, status: 'OPERANTE' });
      await renderPatiosTable();
      patioForm.reset();
      patioForm.classList.add('hidden');
      alert(`Pátio "${codigo}" (${nome}) cadastrado com sucesso!`);
    });
  }

  // 5. AUTOMAÇÃO LOGÍSTICA: CONSULTA ESPACIAL POSTGIS DE EQUIPAMENTOS PRÓXIMOS
  const buscarProxBtn = document.getElementById('buscarProxBtn');
  const equipamentosProximosTableBody = document.getElementById('equipamentosProximosTableBody');

  if (buscarProxBtn) {
    buscarProxBtn.addEventListener('click', async () => {
      const lat = parseFloat(document.getElementById('proxLat').value) || -23.9608;
      const lon = parseFloat(document.getElementById('proxLon').value) || -46.3022;

      const proximos = await NexusPostGIS.buscarEquipamentosProximos(lat, lon, 10000);

      if (!equipamentosProximosTableBody) return;

      if (!proximos || proximos.length === 0) {
        equipamentosProximosTableBody.innerHTML = `
          <tr>
            <td colspan="5" class="p-4 text-center text-slate-400 font-mono">Nenhum equipamento localizado no raio selecionado.</td>
          </tr>
        `;
        return;
      }

      equipamentosProximosTableBody.innerHTML = proximos.map(eq => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="p-2 font-mono font-bold text-nexus-500">${eq.codigo}</td>
          <td class="p-2 text-xs">${eq.tipo}</td>
          <td class="p-2 font-mono text-xs">${eq.capacidade} t</td>
          <td class="p-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">${Math.round(eq.distancia_metros)} metros</td>
          <td class="p-2"><span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800">${eq.status}</span></td>
        </tr>
      `).join('');
    });
  }

  // 6. REEMISSÃO DE CÓDIGOS DE ACESSO (RN 15 / T1.8)
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
      selectedEmp = employeeList.find(e => e.matricula === q);

      if (selectedEmp) {
        if (resultBox) resultBox.classList.remove('hidden');
        if (resNome) resNome.textContent = selectedEmp.nome;
        if (resCargo) resCargo.textContent = `${selectedEmp.cargo_nome} (${selectedEmp.matricula})`;

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
    regenBtn.addEventListener('click', () => {
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

        if (resCodigo) resCodigo.textContent = newCode;
        if (newGenCode) newGenCode.textContent = newCode;
        if (regenNotice) regenNotice.classList.remove('hidden');

        alert(`Sucesso! Código antigo invalidado. O novo código de acesso é: ${newCode}`);
      }
    });
  }

  // 7. CRUD FUNCIONÁRIOS
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
        <td class="p-2.5 font-mono font-bold text-nexus-500">${f.matricula}</td>
        <td class="p-2.5 font-bold">${f.nome}</td>
        <td class="p-2.5 text-slate-500">${f.cargo}</td>
        <td class="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">${f.codigo}</td>
      </tr>
    `).join('');
  }

  renderFuncTable();

  if (toggleFuncBtn && funcForm) {
    toggleFuncBtn.addEventListener('click', () => funcForm.classList.toggle('hidden'));
  }

  if (funcForm) {
    funcForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const matricula = document.getElementById('funcMatricula').value.trim();
      const nome = document.getElementById('funcNome').value.trim();
      const cargo = document.getElementById('funcCargo').value;
      const doc = document.getElementById('funcDoc').value.trim();

      const suffix = Math.floor(1000 + Math.random() * 9000);
      const codigo = `NX-${matricula.replace('MAT-', '')}-${suffix}`;

      funcList.push({ matricula, nome, cargo, codigo, doc });
      localStorage.setItem('nexus_func_list', JSON.stringify(funcList));

      renderFuncTable();
      funcForm.reset();
      funcForm.classList.add('hidden');
      alert(`Funcionário ${nome} cadastrado com sucesso! Código gerado: ${codigo}`);
    });
  }

  // 8. CRUD VISITANTES
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
        <td class="p-2.5 font-bold">${v.nome}</td>
        <td class="p-2.5 font-mono text-xs">${v.documento}</td>
        <td class="p-2.5 text-slate-500">${v.motivo}</td>
        <td class="p-2.5 font-mono text-xs text-slate-400">${v.data}</td>
      </tr>
    `).join('');
  }

  renderVisTable();

  if (toggleVisBtn && visForm) {
    toggleVisBtn.addEventListener('click', () => visForm.classList.toggle('hidden'));
  }

  if (visForm) {
    visForm.addEventListener('submit', (e) => {
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
      renderVisTable();
      visForm.reset();
      visForm.classList.add('hidden');
      alert(`Entrada do visitante ${nome} registrada no livro de visitantes.`);
    });
  }
});

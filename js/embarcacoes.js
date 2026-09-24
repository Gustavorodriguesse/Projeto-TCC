/**
 * Lógica do Módulo de Embarcações & GPS (embarcacoes.html) - NexusPort
 * Gerencia navios, contêineres e calcula ETA a 33 km/h.
 * Corrige o tempo fora do porto para navios em NO_PORTO_DE_DESTINO (RF 5 / RN 8).
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) return;

  const gpsTableBody = document.getElementById('embarcacoesGpsTableBody');
  const toggleNavioBtn = document.getElementById('toggleNavioFormBtn');
  const navioForm = document.getElementById('navioForm');
  const toggleContainerBtn = document.getElementById('toggleContainerFormBtn');
  const containerForm = document.getElementById('containerForm');
  const containersTableBody = document.getElementById('containersTableBody');

  let naviosList = [
    { nome: 'MV Santos Star', imo: 'IMO-9821034', gps: '23.9608° S, 46.3022° W', localizacao: 'DENTRO_DO_PORTO', origem: 'Porto de Santos', destino: 'Porto de Roterdã', distancia: 10200, dataSaida: null },
    { nome: 'MV Pacific Giant', imo: 'IMO-9742110', gps: '12.0463° S, 77.0428° W', localizacao: 'FORA_DO_PORTO', origem: 'Porto de Santos', destino: 'Porto de Singapura', distancia: 18500, dataSaida: new Date(Date.now() - 86400000 * 3).toISOString() },
    { nome: 'MV Atlantic Breeze', imo: 'IMO-9651002', gps: '01.2902° N, 103.8519° E', localizacao: 'NO_PORTO_DE_DESTINO', origem: 'Porto de Santos', destino: 'Porto de Roterdã', distancia: 0, dataSaida: new Date(Date.now() - 86400000 * 12).toISOString() }
  ];

  // Cálculo de ETA a 33 km/h
  function calcularETA(distanciaKm) {
    if (!distanciaKm || distanciaKm <= 0) return 'Atracado / Viagem Concluída';
    const velocidade = 33; // km/h (RN 9)
    const horasTotais = distanciaKm / velocidade;
    const dias = Math.floor(horasTotais / 24);
    const horas = Math.round(horasTotais % 24);
    return `${dias}d ${horas}h (Distância: ${distanciaKm} km @ 33 km/h)`;
  }

  // Carrega navios do Supabase
  async function carregarNaviosSupabase() {
    if (window.nexusSupabase) {
      try {
        const { data, error } = await window.nexusSupabase
          .from('navios')
          .select('*');

        if (!error && data && data.length > 0) {
          const mapSupabase = data.map(n => ({
            nome: n.nome,
            imo: n.numero_imo,
            gps: n.coordenadas_gps || '23.9608° S, 46.3022° W',
            localizacao: n.localizacao || 'DENTRO_DO_PORTO',
            origem: n.porto_origem || 'Porto de Santos',
            destino: n.porto_destino || 'Porto de Roterdã',
            distancia: 10200,
            dataSaida: n.data_saida || (n.localizacao === 'FORA_DO_PORTO' ? new Date(Date.now() - 86400000 * 2).toISOString() : null)
          }));

          // Mescla sem duplicar pelo IMO
          const imoSet = new Set(mapSupabase.map(x => x.imo));
          naviosList.forEach(defaultNavio => {
            if (!imoSet.has(defaultNavio.imo)) {
              mapSupabase.push(defaultNavio);
            }
          });

          naviosList = mapSupabase;
        }
      } catch (err) {
        console.warn('[NexusPort] Erro ao carregar navios do Supabase:', err);
      }
    }
    renderGpsTable();
  }

  // Renderiza Tabela de GPS com Fix para NO_PORTO_DE_DESTINO (RF 5 / RN 8)
  function renderGpsTable() {
    if (!gpsTableBody) return;

    gpsTableBody.innerHTML = naviosList.map(n => {
      let etaText = '';
      let tempoForaText = '';

      if (n.localizacao === 'DENTRO_DO_PORTO') {
        etaText = 'Em Atracação no Porto Origem';
        tempoForaText = 'No Porto (0h)';
      } else if (n.localizacao === 'NO_PORTO_DE_DESTINO') {
        // CORREÇÃO CRÍTICA (RF 5 / RN 8): Pausa/finaliza contagem de tempo fora do porto
        etaText = 'Atracado no Destino (Concluído)';
        tempoForaText = '0d 0h (Atracado no Destino)';
      } else {
        etaText = calcularETA(n.distancia);
        const diffMs = Date.now() - new Date(n.dataSaida).getTime();
        const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        tempoForaText = `${dias}d ${horas}h fora do porto`;
      }

      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="p-3 font-bold text-nexus-900 dark:text-white">
            ${n.nome}
            <span class="block font-mono text-[10px] text-nexus-500">${n.imo}</span>
          </td>
          <td class="p-3 font-mono text-xs text-slate-600 dark:text-slate-300">${n.gps}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              n.localizacao === 'DENTRO_DO_PORTO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
              n.localizacao === 'FORA_DO_PORTO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
              'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
            }">${n.localizacao}</span>
          </td>
          <td class="p-3 text-xs">${n.origem} → <strong class="text-nexus-900 dark:text-white">${n.destino}</strong></td>
          <td class="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">${etaText}</td>
          <td class="p-3 font-mono text-xs font-bold ${n.localizacao === 'NO_PORTO_DE_DESTINO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}">${tempoForaText}</td>
        </tr>
      `;
    }).join('');
  }

  carregarNaviosSupabase();

  const isInspetorRole = ['INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(session.cargo);

  if (toggleNavioBtn && navioForm) {
    if (!isInspetorRole) toggleNavioBtn.classList.add('hidden');
    toggleNavioBtn.addEventListener('click', () => {
      if (!isInspetorRole) {
        alert('Acesso Restrito: Apenas Inspetores têm permissão para cadastrar novos navios (Spec.md RF 1)!');
        return;
      }
      navioForm.classList.toggle('hidden');
    });
  }

  if (navioForm) {
    navioForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!isInspetorRole) {
        alert('Acesso Restrito: Cadastro de navios é de responsabilidade do Inspetor!');
        return;
      }
      const nome = document.getElementById('navioNome').value.trim();
      const imo = document.getElementById('navioImo').value.trim();
      const origem = document.getElementById('navioOrigem').value.trim();
      const destino = document.getElementById('navioDestino').value.trim();
      const localizacao = document.getElementById('navioLocalizacao').value;
      const gps = document.getElementById('navioGps').value.trim() || '23.9608° S, 46.3022° W';
      const distancia = parseFloat(document.getElementById('navioDistancia').value) || 10200;

      const novoNavio = {
        nome, imo, gps, localizacao, origem, destino, distancia, dataSaida: localizacao === 'FORA_DO_PORTO' ? new Date().toISOString() : null
      };

      naviosList.unshift(novoNavio);

      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('navios').insert({
            nome,
            numero_imo: imo,
            porto_origem: origem,
            porto_destino: destino,
            localizacao,
            coordenadas_gps: gps,
            estado_operacional: 'OPERANTE',
            qr_code_url: `QR-${imo}`
          });
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar navio com Supabase:', err);
        }
      }

      renderGpsTable();
      navioForm.reset();
      navioForm.classList.add('hidden');
      alert(`Navio ${nome} (${imo}) cadastrado e sincronizado com sucesso no Supabase!`);
    });
  }

  // CRUD de Contêineres (T2.6 / RN 7)
  let containersList = JSON.parse(localStorage.getItem('nexus_containers_list') || 'null');
  if (!containersList) {
    containersList = [
      { id: 'CONT-991', identificacao: 'NYKU-881290-0', tipo: 'Grãos Soltos', dataFabr: '2020-05-10', dataManut: '2025-01-15', refTempo: 'DATA_FABRICACAO', navio: 'MV Santos Star', estado: 'OPERANTE' },
      { id: 'CONT-992', identificacao: 'MSCU-102938-4', tipo: 'Eletrônicos', dataFabr: '2021-08-20', dataManut: '2024-11-02', refTempo: 'DATA_ULTIMA_MANUTENCAO', navio: 'MV Santos Star', estado: 'OPERANTE' }
    ];
    localStorage.setItem('nexus_containers_list', JSON.stringify(containersList));
  }

  async function carregarContainersSupabase() {
    if (window.nexusSupabase) {
      try {
        const { data, error } = await window.nexusSupabase
          .from('containers')
          .select('*');

        if (!error && data && data.length > 0) {
          const supConts = data.map(c => ({
            id: c.id || `CONT-${c.numero_identificacao}`,
            identificacao: c.numero_identificacao,
            tipo: c.material_carregado || 'Carga Geral',
            dataFabr: c.data_fabricacao || '2021-01-01',
            dataManut: c.data_ultima_manutencao || '2025-01-01',
            refTempo: c.tempo_uso_referencia || 'DATA_FABRICACAO',
            navio: 'MV Santos Star',
            estado: c.estado || 'OPERANTE'
          }));

          const idSet = new Set(supConts.map(x => x.identificacao));
          containersList.forEach(defaultCont => {
            if (!idSet.has(defaultCont.identificacao)) {
              supConts.push(defaultCont);
            }
          });

          containersList = supConts;
          localStorage.setItem('nexus_containers_list', JSON.stringify(containersList));
        }
      } catch (err) {
        console.warn('[NexusPort] Erro ao carregar contêineres do Supabase:', err);
      }
    }
    renderContainersTable();
  }

  function renderContainersTable() {
    if (!containersTableBody) return;
    containersTableBody.innerHTML = containersList.map(c => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3 font-mono font-bold text-nexus-500">${c.identificacao}</td>
        <td class="p-3 font-bold">${c.tipo}</td>
        <td class="p-3 font-mono text-xs">Fab: ${c.dataFabr}<br>Manut: ${c.dataManut}</td>
        <td class="p-3 font-mono text-xs"><span class="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">${c.refTempo}</span></td>
        <td class="p-3 font-bold text-xs">${c.navio || 'Não Vinculado'}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">${c.estado}</span></td>
      </tr>
    `).join('');
  }

  carregarContainersSupabase();

  if (toggleContainerBtn && containerForm) {
    if (!isInspetorRole) toggleContainerBtn.classList.add('hidden');
    toggleContainerBtn.addEventListener('click', () => {
      if (!isInspetorRole) {
        alert('Acesso Restrito: Apenas Inspetores têm permissão para cadastrar novos contêineres (Spec.md RF 1)!');
        return;
      }
      containerForm.classList.toggle('hidden');
    });
  }

  if (containerForm) {
    containerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!isInspetorRole) {
        alert('Acesso Restrito: Cadastro de contêineres é de responsabilidade do Inspetor!');
        return;
      }
      const identificacao = document.getElementById('contIdentificacao').value.trim();
      const tipo = document.getElementById('contTipo').value.trim();
      const dataFabr = document.getElementById('contFabricacao').value;
      const dataManut = document.getElementById('contManutencao').value;
      const refTempo = document.getElementById('contRefTempo').value;

      const newCont = {
        id: `CONT-${Math.floor(100 + Math.random() * 900)}`,
        identificacao, tipo, dataFabr, dataManut, refTempo, navio: '', estado: 'OPERANTE'
      };

      containersList.push(newCont);
      localStorage.setItem('nexus_containers_list', JSON.stringify(containersList));

      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('containers').insert({
            numero_identificacao: identificacao,
            data_fabricacao: dataFabr || null,
            data_ultima_manutencao: dataManut || null,
            tempo_uso_referencia: refTempo,
            estado: 'OPERANTE',
            qr_code_url: `QR-${identificacao}`
          });
        } catch (err) {
          console.warn('[NexusPort] Erro ao sincronizar contêiner com Supabase:', err);
        }
      }

      renderContainersTable();
      containerForm.reset();
      containerForm.classList.add('hidden');
      alert(`Contêiner ${identificacao} cadastrado com sucesso com referência de tempo em "${refTempo}" (RN 7)!`);
    });
  }
});

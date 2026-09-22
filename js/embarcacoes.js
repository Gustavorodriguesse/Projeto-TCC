/**
 * Lógica do Módulo de Embarcações, Rotas, ETA e Mapa (embarcacoes.html) - NexusPort
 * Integra cálculo de ETA por velocidade média configurável da embarcação via PostGIS,
 * mapa interativo Leaflet.js e controle de contêineres/GPS.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) return;

  const rotaPortoOrigem = document.getElementById('rotaPortoOrigem');
  const rotaPortoDestino = document.getElementById('rotaPortoDestino');
  const rotaNavio = document.getElementById('rotaNavio');
  const rotaDataPartida = document.getElementById('rotaDataPartida');
  const calcularRotaBtn = document.getElementById('calcularRotaBtn');

  const etaResultPanel = document.getElementById('etaResultPanel');
  const etaOrigemDestinoText = document.getElementById('etaOrigemDestinoText');
  const etaDistanciaText = document.getElementById('etaDistanciaText');
  const etaVelocidadeText = document.getElementById('etaVelocidadeText');
  const etaTempoText = document.getElementById('etaTempoText');
  const etaForecastText = document.getElementById('etaForecastText');
  const etaPartidaSub = document.getElementById('etaPartidaSub');

  const etaErrorPanel = document.getElementById('etaErrorPanel');
  const etaErrorMsg = document.getElementById('etaErrorMsg');

  const gpsTableBody = document.getElementById('embarcacoesGpsTableBody');
  const toggleContainerBtn = document.getElementById('toggleContainerFormBtn');
  const containerForm = document.getElementById('containerForm');
  const containersTableBody = document.getElementById('containersTableBody');

  // Define data de partida padrão para agora no input
  if (rotaDataPartida) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    rotaDataPartida.value = now.toISOString().slice(0, 16);
  }

  // Populate selects para simulador de rota
  async function setupSimuladorSelects() {
    const portos = await NexusPostGIS.getPortos();
    const navios = await NexusPostGIS.getNavios();

    const portoOptions = portos.map(p => `<option value="${p.codigo}">${p.nome} (${p.codigo})</option>`).join('');
    if (rotaPortoOrigem) {
      rotaPortoOrigem.innerHTML = portoOptions;
      if (portos.length > 0) rotaPortoOrigem.value = portos[0].codigo;
    }
    if (rotaPortoDestino) {
      rotaPortoDestino.innerHTML = portoOptions;
      if (portos.length > 1) rotaPortoDestino.value = portos[1].codigo;
    }

    if (rotaNavio) {
      rotaNavio.innerHTML = navios.map(n => `<option value="${n.imo}">${n.nome} (${n.imo}) - Vel. Média: ${n.velocidade_media ? n.velocidade_media + ' km/h' : 'Sem cadastro'}</option>`).join('');
    }
  }

  await setupSimuladorSelects();

  // Handler do cálculo de Rota e ETA
  if (calcularRotaBtn) {
    calcularRotaBtn.addEventListener('click', async () => {
      const origemCode = rotaPortoOrigem.value;
      const destinoCode = rotaPortoDestino.value;
      const navioImo = rotaNavio.value;
      const partidaStr = rotaDataPartida.value;

      if (!origemCode || !destinoCode || !navioImo) {
        alert('Selecione origem, destino e embarcação para o cálculo de ETA.');
        return;
      }

      const res = await NexusPostGIS.calcularRotaETempo(origemCode, destinoCode, navioImo, partidaStr);

      if (res.sucesso) {
        if (etaErrorPanel) etaErrorPanel.classList.add('hidden');
        if (etaResultPanel) etaResultPanel.classList.remove('hidden');

        if (etaOrigemDestinoText) etaOrigemDestinoText.textContent = `${res.portoOrigem.nome} → ${res.portoDestino.nome}`;
        if (etaDistanciaText) etaDistanciaText.textContent = `${res.distanciaKm.toLocaleString('pt-BR')} km`;
        if (etaVelocidadeText) etaVelocidadeText.textContent = `${res.velocidadeMedia} km/h`;
        if (etaTempoText) etaTempoText.textContent = res.tempoFormatado;
        if (etaForecastText) etaForecastText.textContent = res.previsaoChegada.toLocaleString('pt-BR');
        if (etaPartidaSub) etaPartidaSub.textContent = `Partida: ${res.dataPartida.toLocaleString('pt-BR')}`;
      } else {
        if (etaResultPanel) etaResultPanel.classList.add('hidden');
        if (etaErrorPanel) etaErrorPanel.classList.remove('hidden');
        if (etaErrorMsg) etaErrorMsg.textContent = res.mensagem || 'Não foi possível calcular a previsão de chegada.';
      }
    });
  }

  // MAPA INTERATIVO PORTUÁRIO & MARÍTIMO (LEAFLET.JS)
  function initMapaPortuario() {
    const mapElem = document.getElementById('mapaPortuario');
    if (!mapElem || typeof L === 'undefined') return;

    const map = L.map('mapaPortuario').setView([-23.9608, -46.3022], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors | NexusPort PostGIS'
    }).addTo(map);

    // Carregar marcadores de Portos, Berços, Guindastes, Pátios e Navios
    async function loadMarkers() {
      const portos = await NexusPostGIS.getPortos();
      const bercos = await NexusPostGIS.getBercos();
      const guindastes = await NexusPostGIS.getGuindastes();
      const patios = await NexusPostGIS.getPatios();
      const navios = await NexusPostGIS.getNavios();

      // Portos (Azul)
      portos.forEach(p => {
        if (p.lat && p.lon) {
          L.marker([p.lat, p.lon])
            .addTo(map)
            .bindPopup(`<b>${p.nome} (${p.codigo})</b><br>${p.cidade} / ${p.pais}<br>Coordenadas: ${p.lat}, ${p.lon}`);
        }
      });

      // Guindastes (Círculos Laranja)
      guindastes.forEach(g => {
        if (g.lat && g.lon) {
          L.circleMarker([g.lat, g.lon], { radius: 6, color: '#D97706', fillColor: '#F59E0B', fillOpacity: 0.8 })
            .addTo(map)
            .bindPopup(`<b>Guindaste ${g.numero_identificacao}</b><br>Tipo: ${g.tipo}<br>Capacidade: ${g.capacidade} t<br>Status: ${g.status}`);
        }
      });

      // Pátios (Círculos Roxo)
      patios.forEach(pt => {
        if (pt.lat && pt.lon) {
          L.circleMarker([pt.lat, pt.lon], { radius: 8, color: '#7C3AED', fillColor: '#A855F7', fillOpacity: 0.7 })
            .addTo(map)
            .bindPopup(`<b>Pátio ${pt.codigo}</b><br>${pt.nome}<br>Capacidade: ${pt.capacidade} TEUs (${pt.ocupacao} ocupados)`);
        }
      });

      // Navios (Círculos Esmeralda)
      navios.forEach(n => {
        if (n.lat && n.lon) {
          L.circleMarker([n.lat, n.lon], { radius: 7, color: '#059669', fillColor: '#10B981', fillOpacity: 0.9 })
            .addTo(map)
            .bindPopup(`<b>Navio ${n.nome}</b><br>IMO: ${n.imo}<br>Velocidade Média: ${n.velocidade_media ? n.velocidade_media + ' km/h' : 'N/A'}<br>Status: ${n.status}`);
        }
      });
    }

    loadMarkers();
  }

  initMapaPortuario();

  // Renderiza Tabela de GPS com Fix para NO_PORTO_DE_DESTINO
  async function renderGpsTable() {
    if (!gpsTableBody) return;

    const navios = await NexusPostGIS.getNavios();

    gpsTableBody.innerHTML = navios.map(n => {
      let etaText = '';
      let tempoForaText = '';

      if (n.status === 'DENTRO_DO_PORTO') {
        etaText = 'Em Atracação no Porto Origem';
        tempoForaText = 'No Porto (0h)';
      } else if (n.status === 'NO_PORTO_DE_DESTINO') {
        etaText = 'Atracado no Destino (Concluído)';
        tempoForaText = '0d 0h (Atracado no Destino)';
      } else {
        const velStr = n.velocidade_media ? `${n.velocidade_media} km/h` : 'Sem vel. cadastrada';
        etaText = `Em Viagem (${velStr})`;
        tempoForaText = `Fora do Porto`;
      }

      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="p-3 font-bold text-nexus-900 dark:text-white">
            ${n.nome}
            <span class="block font-mono text-[10px] text-nexus-500">${n.imo}</span>
          </td>
          <td class="p-3 font-mono text-xs text-slate-600 dark:text-slate-300">${n.lat}° S, ${n.lon}° W</td>
          <td class="p-3 font-mono text-xs font-bold text-nexus-500">${n.velocidade_media ? n.velocidade_media + ' km/h' : '<span class="text-amber-600">Não cadastrada</span>'}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              n.status === 'DENTRO_DO_PORTO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
              n.status === 'FORA_DO_PORTO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
              'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
            }">${n.status}</span>
          </td>
          <td class="p-3 text-xs">${n.porto_origem || 'Santos'} → <strong class="text-nexus-900 dark:text-white">${n.porto_destino || 'Destino'}</strong></td>
          <td class="p-3 font-mono text-xs font-bold ${n.status === 'NO_PORTO_DE_DESTINO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}">${tempoForaText}</td>
        </tr>
      `;
    }).join('');
  }

  await renderGpsTable();

  // CRUD de Contêineres (T2.6 / RN 7)
  let containersList = JSON.parse(localStorage.getItem('nexus_containers_list') || 'null');
  if (!containersList) {
    containersList = [
      { id: 'CONT-991', identificacao: 'NYKU-881290-0', tipo: 'Grãos Soltos', dataFabr: '2020-05-10', dataManut: '2025-01-15', refTempo: 'DATA_FABRICACAO', navio: 'MV Santos Star', estado: 'OPERANTE' },
      { id: 'CONT-992', identificacao: 'MSCU-102938-4', tipo: 'Eletrônicos', dataFabr: '2021-08-20', dataManut: '2024-11-02', refTempo: 'DATA_ULTIMA_MANUTENCAO', navio: 'MV Santos Star', estado: 'OPERANTE' }
    ];
    localStorage.setItem('nexus_containers_list', JSON.stringify(containersList));
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

  renderContainersTable();

  if (toggleContainerBtn && containerForm) {
    toggleContainerBtn.addEventListener('click', () => containerForm.classList.toggle('hidden'));
  }

  if (containerForm) {
    containerForm.addEventListener('submit', (e) => {
      e.preventDefault();
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

      renderContainersTable();
      containerForm.reset();
      containerForm.classList.add('hidden');
      alert(`Contêiner ${identificacao} cadastrado com sucesso com referência de tempo em "${refTempo}" (RN 7)!`);
    });
  }
});

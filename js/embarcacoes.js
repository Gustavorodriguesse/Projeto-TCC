/**
 * Lógica do Módulo de Embarcações & GPS (embarcacoes.html) - NexusPort
 * Gerencia navios, contêineres e calcula ETA a 33 km/h.
 * Corrige o tempo fora do porto para navios em NO_PORTO_DE_DESTINO (RF 5 / RN 8).
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) return;

  const gpsTableBody = document.getElementById('embarcacoesGpsTableBody');
  const toggleContainerBtn = document.getElementById('toggleContainerFormBtn');
  const containerForm = document.getElementById('containerForm');
  const containersTableBody = document.getElementById('containersTableBody');

  // Cálculo de ETA a 33 km/h
  function calcularETA(distanciaKm) {
    if (!distanciaKm || distanciaKm <= 0) return 'Atracado / Viagem Concluída';
    const velocidade = 33; // km/h (RN 9)
    const horasTotais = distanciaKm / velocidade;
    const dias = Math.floor(horasTotais / 24);
    const horas = Math.round(horasTotais % 24);
    return `${dias}d ${horas}h (Distância: ${distanciaKm} km @ 33 km/h)`;
  }

  // Renderiza Tabela de GPS com Fix para NO_PORTO_DE_DESTINO (RF 5 / RN 8)
  function renderGpsTable() {
    if (!gpsTableBody) return;

    const navios = [
      { nome: 'MV Santos Star', imo: 'IMO-9821034', gps: '23.9608° S, 46.3022° W', localizacao: 'DENTRO_DO_PORTO', origem: 'Porto de Santos', destino: 'Porto de Roterdã', distancia: 10200, dataSaida: null },
      { nome: 'MV Pacific Giant', imo: 'IMO-9742110', gps: '12.0463° S, 77.0428° W', localizacao: 'FORA_DO_PORTO', origem: 'Porto de Santos', destino: 'Porto de Singapura', distancia: 18500, dataSaida: new Date(Date.now() - 86400000 * 3).toISOString() },
      { nome: 'MV Atlantic Breeze', imo: 'IMO-9651002', gps: '01.2902° N, 103.8519° E', localizacao: 'NO_PORTO_DE_DESTINO', origem: 'Porto de Santos', destino: 'Porto de Roterdã', distancia: 0, dataSaida: new Date(Date.now() - 86400000 * 12).toISOString() }
    ];

    gpsTableBody.innerHTML = navios.map(n => {
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

  renderGpsTable();

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
    containerForm.addEventListener('submit', async (e) => {
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

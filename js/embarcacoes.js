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

  let naviosList = [];

  // Cálculo de ETA a 33 km/h
  function calcularETA(distanciaKm) {
    if (!distanciaKm || distanciaKm <= 0) return 'Atracado / Viagem Concluída';
    const velocidade = 33; // km/h (RN 9)
    const horasTotais = distanciaKm / velocidade;
    const dias = Math.floor(horasTotais / 24);
    const horas = Math.round(horasTotais % 24);
    return `${dias}d ${horas}h (Distância: ${distanciaKm} km @ 33 km/h)`;
  }

  // Carrega navios mantendo persistência rigorosa de dataSaida do Supabase / Local
  async function carregarNaviosSupabase() {
    const savedNaviosRaw = localStorage.getItem('nexus_navios_list');
    let savedNavios = savedNaviosRaw ? JSON.parse(savedNaviosRaw) : null;

    if (window.nexusSupabase) {
      try {
        const { data, error } = await window.nexusSupabase
          .from('navios')
          .select('*');

        if (!error && data && data.length > 0) {
          const mapSupabase = data.map(n => {
            const matchLocal = savedNavios ? savedNavios.find(l => l.imo === n.numero_imo) : null;
            return {
              nome: n.nome,
              imo: n.numero_imo,
              gps: n.coordenadas_gps || '23.9608° S, 46.3022° W',
              localizacao: n.localizacao || 'DENTRO_DO_PORTO',
              origem: n.porto_origem || 'Porto de Santos',
              destino: n.porto_destino || 'Porto de Roterdã',
              distancia: 10200,
              dataSaida: n.data_saida || (matchLocal ? matchLocal.dataSaida : (n.localizacao === 'FORA_DO_PORTO' ? new Date(Date.now() - 86400000 * 2).toISOString() : null))
            };
          });

          const imoSet = new Set(mapSupabase.map(x => x.imo));
          naviosList.forEach(defaultNavio => {
            if (!imoSet.has(defaultNavio.imo)) {
              mapSupabase.push(defaultNavio);
            }
          });

          naviosList = mapSupabase;
          localStorage.setItem('nexus_navios_list', JSON.stringify(naviosList));
        }
      } catch (err) {
        console.warn('[NexusPort] Erro ao carregar navios do Supabase:', err);
      }
    } else if (savedNavios) {
      naviosList = savedNavios;
    }

    renderGpsTable();
  }

  // Renderiza Tabela de GPS com atualização viva em tempo real e entrega automática
  function renderGpsTable() {
    if (!gpsTableBody) return;

    if (naviosList.length === 0) {
      gpsTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="p-4 text-center text-slate-400 italic">Nenhuma embarcação cadastrada no banco de dados.</td>
        </tr>
      `;
      return;
    }

    // C10 & RN 12: Atualização automática do status das cargas quando o navio chega ao porto de destino
    const cargasFluxo = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');
    let cargasAtualizadas = false;

    naviosList.forEach(n => {
      if (n.localizacao === 'NO_PORTO_DE_DESTINO') {
        cargasFluxo.forEach(c => {
          if (c.navio && c.navio.toLowerCase() === n.nome.toLowerCase() && c.status !== 'ENTREGUE' && c.status !== 'CANCELADA') {
            c.status = 'ENTREGUE';
            cargasAtualizadas = true;
          }
        });
      }
    });

    if (cargasAtualizadas) {
      localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(cargasFluxo));
      if (window.nexusSupabase) {
        window.nexusSupabase.from('cargas')
          .update({ status_fluxo: 'ENTREGUE' })
          .eq('status_fluxo', 'EM_TRANSITO')
          .then().catch(e => console.warn('[NexusPort] Erro ao atualizar entregue no Supabase:', e));
      }
    }

    // Exibe apenas navios que possuam ao menos uma carga vinculada
    const naviosComCarga = naviosList.filter(n => {
      const cargasDoNavio = cargasFluxo.filter(c => c.navio && c.navio.toLowerCase() === n.nome.toLowerCase() && c.status !== 'CANCELADA');
      return cargasDoNavio.length > 0;
    });

    if (naviosComCarga.length === 0) {
      gpsTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="p-4 text-center text-slate-400 italic">Nenhum navio com cargas vinculadas no momento.</td>
        </tr>
      `;
      return;
    }

    gpsTableBody.innerHTML = naviosComCarga.map(n => {
      let etaText = '';
      let tempoForaText = '';

      if (n.localizacao === 'DENTRO_DO_PORTO') {
        etaText = 'Em Atracação no Porto Origem';
        tempoForaText = 'No Porto (0s)';
      } else if (n.localizacao === 'NO_PORTO_DE_DESTINO') {
        // CORREÇÃO CRÍTICA (RF 5 / RN 8): Pausa/finaliza contagem de tempo fora do porto
        etaText = 'Atracado no Destino (Concluído)';
        tempoForaText = '0d 0h 0s (Atracado no Destino)';
      } else {
        // C6 & A4: Cálculo de ETA e tempo decorrido dinâmico baseado em tempo real
        const horaSaidaTime = n.dataSaida ? new Date(n.dataSaida).getTime() : Date.now();
        const diffMs = Math.max(0, Date.now() - horaSaidaTime);

        const diasDecorridos = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const horasDecorridas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutosDecorridos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const segundosDecorridos = Math.floor((diffMs % (1000 * 60)) / 1000);

        tempoForaText = `${diasDecorridos}d ${horasDecorridas}h ${minutosDecorridos}m ${segundosDecorridos}s fora`;

        // Cálculo dinâmico do tempo total previsto
        const horasTotaisPrevistas = (n.distancia || 10200) / 33; // 33 km/h
        const msTotaisPrevistos = horasTotaisPrevistas * 3600 * 1000;
        const msRestantes = Math.max(0, msTotaisPrevistos - diffMs);

        const diasRestantes = Math.floor(msRestantes / (1000 * 60 * 60 * 24));
        const horasRestantes = Math.floor((msRestantes % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minRestantes = Math.floor((msRestantes % (1000 * 60 * 60)) / (1000 * 60));
        const segRestantes = Math.floor((msRestantes % (1000 * 60)) / 1000);

        etaText = `ETA: ${diasRestantes}d ${horasRestantes}h ${minRestantes}m ${segRestantes}s (@33km/h)`;
      }

      // Busca cargas do localstorage ou Supabase associadas a este navio (C2, C3)
      const cargasDoNavio = cargasFluxo.filter(c => c.navio && c.navio.toLowerCase() === n.nome.toLowerCase());

      let bercosInfoHtml = '<span class="text-slate-400 italic text-[11px]">Sem carga vinculada</span>';
      if (cargasDoNavio.length > 0) {
        bercosInfoHtml = cargasDoNavio.map(c => `
          <div class="text-[11px] leading-tight">
            <strong class="text-nexus-500">${c.id}</strong>: <span class="font-bold text-slate-700 dark:text-slate-200">${c.portoDescarga || 'Berço não atrelado'}</span>
            <span class="block text-[10px] text-slate-400">Contêiner: ${c.container || 'Não vinculado'}</span>
          </div>
        `).join('');
      }

      // C5, A4, A5: Ações exclusivas do Diretor de Operações e Logística
      const isDiretorOperacoes = session.cargo === 'DIRETOR_OPERACOES_LOGISTICA';
      let acoesHtml = '';

      if (isDiretorOperacoes) {
        if (n.localizacao === 'DENTRO_DO_PORTO') {
          acoesHtml = `<button type="button" onclick="window.liberarNavioPeloDiretor('${n.imo}')" class="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]">Liberar Saída</button>`;
        } else if (n.localizacao === 'FORA_DO_PORTO' || n.localizacao === 'NO_PORTO_DE_DESTINO') {
          acoesHtml = `<button type="button" onclick="window.autorizarRetornoNavio('${n.imo}')" class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]">Autorizar Retorno</button>`;
        }
      } else {
        acoesHtml = `<span class="text-slate-400 font-mono italic text-[10px]">Exclusivo Diretor</span>`;
      }

      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="p-3 font-bold text-nexus-900 dark:text-white">
            ${n.nome}
            <span class="block font-mono text-[10px] text-nexus-500">${n.imo}</span>
          </td>
          <td class="p-3 font-mono text-xs">${bercosInfoHtml}</td>
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
          <td class="p-3 text-right whitespace-nowrap">${acoesHtml}</td>
        </tr>
      `;
    }).join('');
  }

  // C5 & A4: Função para Liberação de Saída de Navios Exclusiva do Diretor de Operações e Logística
  window.liberarNavioPeloDiretor = async function(imo) {
    if (session.cargo !== 'DIRETOR_OPERACOES_LOGISTICA') {
      alert('Acesso Negado (C5): Apenas o Diretor de Operações e Logística pode autorizar a liberação de navios!');
      return;
    }

    const navio = naviosList.find(n => n.imo === imo);
    if (!navio) return;

    if (await window.nexusConfirm('Liberar Saída de Navio', `Confirmar liberação de saída do navio ${navio.nome} (${navio.imo})?`)) {
      const horaSaida = new Date().toISOString();
      navio.localizacao = 'FORA_DO_PORTO';
      navio.dataSaida = horaSaida;

      localStorage.setItem('nexus_navios_list', JSON.stringify(naviosList));

      // Sincroniza Supabase
      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('navios')
            .update({ localizacao: 'FORA_DO_PORTO', data_saida: horaSaida })
            .eq('numero_imo', imo);
        } catch (err) { console.warn('Erro ao liberar navio no Supabase:', err); }
      }

      // Registra no Trail de Decisões Críticas
      if (window.registrarTrailDecisao) {
        window.registrarTrailDecisao(`Liberou Navio ${navio.nome}`, 'NAVIO', `Horário de saída registrado pelo Diretor: ${new Date(horaSaida).toLocaleString('pt-BR')}`);
      }

      renderGpsTable();
      alert(`Navio ${navio.nome} liberado com sucesso pelo Diretor de Operações e Logística. Horário de saída: ${new Date(horaSaida).toLocaleString('pt-BR')}.`);
    }
  };

  // A5: Configuração de retorno do navio ao porto de origem
  window.autorizarRetornoNavio = async function(imo) {
    if (session.cargo !== 'DIRETOR_OPERACOES_LOGISTICA') {
      alert('Acesso Negado: Apenas o Diretor de Operações e Logística pode autorizar o retorno de navios!');
      return;
    }

    const navio = naviosList.find(n => n.imo === imo);
    if (!navio) return;

    if (await window.nexusConfirm('Autorizar Retorno de Embarcação', `Autorizar o retorno da embarcação ${navio.nome} ao Porto de Origem (${navio.origem})?`)) {
      // Inverte Origem e Destino para a viagem de regresso
      const antigoDestino = navio.destino;
      navio.destino = navio.origem;
      navio.origem = antigoDestino;
      navio.localizacao = 'FORA_DO_PORTO';
      navio.dataSaida = new Date().toISOString();

      if (window.nexusSupabase) {
        try {
          await window.nexusSupabase.from('navios')
            .update({
              porto_origem: navio.origem,
              porto_destino: navio.destino,
              localizacao: 'FORA_DO_PORTO',
              data_saida: navio.dataSaida
            })
            .eq('numero_imo', imo);
        } catch (err) { console.warn('Erro ao atualizar retorno do navio no Supabase:', err); }
      }

      if (window.registrarTrailDecisao) {
        window.registrarTrailDecisao(`Autorizou Retorno do Navio ${navio.nome}`, 'NAVIO', `Retorno autorizado para ${navio.destino}`);
      }

      renderGpsTable();
      alert(`Retorno do navio ${navio.nome} ao porto ${navio.destino} autorizado com sucesso pelo Diretor!`);
    }
  };

  carregarNaviosSupabase();

  // C6: Relógio em tempo real que atualiza continuamente a contagem de ETA e tempo fora do porto
  setInterval(renderGpsTable, 1000);

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

  // Validador de Coordenadas GPS Reais (Item 12)
  function validarCoordenadaGPS(gpsStr) {
    if (!gpsStr) return false;
    const clean = gpsStr.trim();
    const regexCoords = /^[-+]?\d+(\.\d+)?\s*°?\s*([NSns])?\s*,\s*[-+]?\d+(\.\d+)?\s*°?\s*([EWEOewoe])?$/;
    if (!regexCoords.test(clean)) return false;

    const numbers = clean.match(/[-+]?\d+(\.\d+)?/g);
    if (!numbers || numbers.length < 2) return false;
    const lat = Math.abs(parseFloat(numbers[0]));
    const lon = Math.abs(parseFloat(numbers[1]));
    return lat <= 90 && lon <= 180;
  }

  if (navioForm) {
    navioForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!isInspetorRole) {
        alert('Acesso Restrito: Cadastro de navios é de responsabilidade do Inspetor!');
        return;
      }
      const nome = document.getElementById('navioNome').value.trim();
      const imo = document.getElementById('navioImo').value.trim().toUpperCase().replace(/\s+/g, '');
      const origem = document.getElementById('navioOrigem').value.trim();
      const destino = document.getElementById('navioDestino').value.trim();
      const localizacao = document.getElementById('navioLocalizacao').value;
      const gps = document.getElementById('navioGps').value.trim();
      const distancia = parseFloat(document.getElementById('navioDistancia').value) || 10200;

      // Item 11: Validação do padrão do Número IMO (3 letras + 7 números)
      const imoRegex = /^[A-Z]{3}\d{7}$/;
      if (!imoRegex.test(imo)) {
        alert('FORMATO DE IMO INVÁLIDO (Item 11): O número IMO deve seguir obrigatoriamente a estrutura fixa de 3 letras + 7 números (ex.: IMO1234567 ou ABC1234567).');
        return;
      }

      // Item 11: Validação de unicidade do IMO
      const imoExistente = naviosList.find(n => (n.imo || '').toUpperCase().replace(/\s+/g, '') === imo);
      if (imoExistente) {
        alert(`BLOQUEIO DE DUPLICIDADE (Item 11): Já existe um navio cadastrado com o número IMO "${imo}" (${imoExistente.nome}). Cada embarcação deve possuir IMO único!`);
        return;
      }

      // Item 12: Validação de Coordenada GPS Real
      if (!validarCoordenadaGPS(gps)) {
        alert('COORDENADA GPS INVÁLIDA (Item 12): Informe uma coordenada geográfica real dentro dos limites válidos (ex.: "-23.9608, -46.3022" ou "23.9608° S, 46.3022° W").');
        return;
      }

      // Item 12: Bloqueio de coordenadas GPS duplicadas
      const gpsExistente = naviosList.find(n => n.gps && n.gps.trim() === gps);
      if (gpsExistente) {
        alert(`BLOQUEIO DE LOCALIZAÇÃO (Item 12): já existe navio nesta localização (${gpsExistente.nome}). Dois navios não podem ocupar exatamente a mesma coordenada GPS simultaneamente!`);
        return;
      }

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
  let containersList = JSON.parse(localStorage.getItem('nexus_containers_list') || '[]');

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

    if (containersList.length === 0) {
      containersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="p-4 text-center text-slate-400 italic">Nenhum contêiner cadastrado no banco de dados.</td>
        </tr>
      `;
      return;
    }

    containersTableBody.innerHTML = containersList.map(c => {
      // C3: Busca cargas vinculadas a este contêiner
      const cargasFluxo = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');
      const cargasDoCont = cargasFluxo.filter(crg => crg.container && (crg.container.toLowerCase() === c.identificacao.toLowerCase() || crg.container.toLowerCase() === c.id.toLowerCase()));

      let cargasVinculadasHtml = '<span class="text-slate-400 italic text-[11px]">Nenhuma carga</span>';
      if (cargasDoCont.length > 0) {
        cargasVinculadasHtml = cargasDoCont.map(crg => `
          <span class="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-nexus-500 font-bold">${crg.id} (${crg.volume})</span>
        `).join(' ');
      }

      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="p-3 font-mono font-bold text-nexus-500">${c.identificacao}</td>
          <td class="p-3 font-bold">${c.tipo}</td>
          <td class="p-3 font-mono text-xs">${cargasVinculadasHtml}</td>
          <td class="p-3 font-mono text-xs">Fab: ${c.dataFabr}<br>Manut: ${c.dataManut}</td>
          <td class="p-3 font-mono text-xs"><span class="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-bold">${c.refTempo}</span></td>
          <td class="p-3 font-bold text-xs">${c.navio || 'Não Vinculado'}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">${c.estado}</span></td>
        </tr>
      `;
    }).join('');
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
      const identificacao = document.getElementById('contIdentificacao').value.trim().toUpperCase();
      const tipo = document.getElementById('contTipo').value.trim();
      const dataFabr = document.getElementById('contFabricacao').value;
      const dataManut = document.getElementById('contManutencao').value;
      const refTempo = document.getElementById('contRefTempo').value;

      // Item 13: Validação de unicidade do código de contêiner
      const contExistente = containersList.find(c => (c.identificacao || '').toUpperCase() === identificacao);
      if (contExistente) {
        alert(`BLOQUEIO DE DUPLICIDADE (Item 13): O código de contêiner "${identificacao}" já está cadastrado no sistema. Não é permitido duplicar contêineres!`);
        return;
      }

      // Item 14: Validação de coerência entre data de fabricação e manutenção
      if (dataFabr && dataManut && new Date(dataManut) < new Date(dataFabr)) {
        alert('DATA INCONSISTENTE (Item 14): A data da última manutenção não pode ser anterior à data de fabricação do contêiner!');
        return;
      }

      const newCont = {
        id: `CONT-${Math.floor(100 + Math.random() * 900)}`,
        identificacao, tipo, dataFabr, dataManut, refTempo, navio: '', estado: 'DISPONIVEL'
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

  // Sincronização viva em tempo real (Item 2)
  window.addEventListener('nexus_data_changed', () => {
    carregarNaviosSupabase();
    carregarContainersSupabase();
  });
});

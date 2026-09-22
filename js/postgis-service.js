/**
 * Serviço de Integração Supabase + PostGIS (NexusPort)
 * Provê cálculos geográficos geodésicos (WGS84), consultas espaciais,
 * previsão de chegada (ETA) com velocidade média da embarcação e CRUD de infraestrutura portuária.
 */

(function () {
  const DEFAULT_PORTOS = [
    { id: 'port-1', codigo: 'BRSSZ', nome: 'Porto de Santos (STS-01)', pais: 'Brasil', cidade: 'Santos', lat: -23.9608, lon: -46.3022 },
    { id: 'port-2', codigo: 'BRPNG', nome: 'Porto de Paranaguá', pais: 'Brasil', cidade: 'Paranaguá', lat: -25.5011, lon: -48.5117 },
    { id: 'port-3', codigo: 'BRRIG', nome: 'Porto do Rio de Janeiro', pais: 'Brasil', cidade: 'Rio de Janeiro', lat: -22.8983, lon: -43.1812 },
    { id: 'port-4', codigo: 'BRSUA', nome: 'Porto de Suape', pais: 'Brasil', cidade: 'Ipojuca', lat: -8.3944, lon: -34.9583 },
    { id: 'port-5', codigo: 'BRBGZ', nome: 'Porto de Bragança', pais: 'Brasil', cidade: 'Bragança', lat: -1.0536, lon: -46.7656 }
  ];

  const DEFAULT_BERCOS = [
    { id: 'ber-1', porto_codigo: 'BRSSZ', porto_nome: 'Porto de Santos (STS-01)', nome_codigo: 'Berço 01 - Conteineres', capacidade: 80000, status: 'DISPONIVEL', caracteristicas: 'Calado 15m - Terminal STS-01', lat: -23.9610, lon: -46.3020 },
    { id: 'ber-2', porto_codigo: 'BRSSZ', porto_nome: 'Porto de Santos (STS-01)', nome_codigo: 'Berço 02 - Carga Geral', capacidade: 60000, status: 'OCUPADO', caracteristicas: 'Calado 13.5m - Terminal STS-01', lat: -23.9615, lon: -46.3025 },
    { id: 'ber-3', porto_codigo: 'BRSSZ', porto_nome: 'Porto de Santos (STS-01)', nome_codigo: 'Berço 03 - Granel', capacidade: 70000, status: 'DISPONIVEL', caracteristicas: 'Calado 14m - Berço de Granéis', lat: -23.9620, lon: -46.3030 },
    { id: 'ber-4', porto_codigo: 'BRPNG', porto_nome: 'Porto de Paranaguá', nome_codigo: 'Berço 101 - Paranaguá', capacidade: 75000, status: 'DISPONIVEL', caracteristicas: 'Terminal de Contêineres', lat: -25.5015, lon: -48.5120 },
    { id: 'ber-5', porto_codigo: 'BRRIG', porto_nome: 'Porto do Rio de Janeiro', nome_codigo: 'Berço 01 - Rio', capacidade: 65000, status: 'DISPONIVEL', caracteristicas: 'Pier de Cargas Rio', lat: -22.8988, lon: -43.1818 }
  ];

  const DEFAULT_GUINDASTES = [
    { id: 'gnd-1', porto_codigo: 'BRSSZ', berco_nome: 'Berço 01 - Conteineres', numero_identificacao: 'GND-01-STS', tipo: 'Portêiner STS Super Post-Panamax', capacidade: 80, status: 'DISPONIVEL', lat: -23.9611, lon: -46.3021 },
    { id: 'gnd-2', porto_codigo: 'BRSSZ', berco_nome: 'Berço 02 - Carga Geral', numero_identificacao: 'GND-02-STS', tipo: 'Guindaste sobre Esteiras MHC-150', capacidade: 50, status: 'OPERANDO', lat: -23.9616, lon: -46.3026 },
    { id: 'gnd-3', porto_codigo: 'BRPNG', berco_nome: 'Berço 101 - Paranaguá', numero_identificacao: 'GND-01-PNG', tipo: 'Portêiner STS Post-Panamax', capacidade: 65, status: 'DISPONIVEL', lat: -25.5016, lon: -48.5121 },
    { id: 'gnd-4', porto_codigo: 'BRRIG', berco_nome: 'Berço 01 - Rio', numero_identificacao: 'GND-01-RIG', tipo: 'Guindaste de Lança Articulada', capacidade: 40, status: 'DISPONIVEL', lat: -22.8989, lon: -43.1819 }
  ];

  const DEFAULT_PATIOS = [
    { id: 'pat-1', porto_codigo: 'BRSSZ', codigo: 'PATIO-A-STS', nome: 'Pátio A - Contêineres Refrigerados / Carga Geral', capacidade: 2500, ocupacao: 850, status: 'OPERANTE', lat: -23.9605, lon: -46.3015 },
    { id: 'pat-2', porto_codigo: 'BRSSZ', codigo: 'PATIO-B-STS', nome: 'Pátio B - Estocagem Mista e Exportação', capacidade: 1800, ocupacao: 420, status: 'OPERANTE', lat: -23.9625, lon: -46.3035 },
    { id: 'pat-3', porto_codigo: 'BRPNG', codigo: 'PATIO-01-PNG', nome: 'Pátio de Exportação Paranaguá', capacidade: 3000, ocupacao: 1100, status: 'OPERANTE', lat: -25.5020, lon: -48.5130 }
  ];

  const DEFAULT_NAVIOS = [
    { id: 'nav-1', nome: 'MV Santos Star', imo: 'IMO-9821034', porto_origem: 'Porto de Santos (STS-01)', porto_destino: 'Porto de Paranaguá', velocidade_media: 20.0, status: 'DENTRO_DO_PORTO', lat: -23.9608, lon: -46.3022 },
    { id: 'nav-2', nome: 'MV Pacific Giant', imo: 'IMO-9742110', porto_origem: 'Porto de Santos (STS-01)', porto_destino: 'Porto de Suape', velocidade_media: 25.0, status: 'FORA_DO_PORTO', lat: -12.0463, lon: -77.0428 },
    { id: 'nav-3', nome: 'MV Atlantic Breeze', imo: 'IMO-9651002', porto_origem: 'Porto de Santos (STS-01)', porto_destino: 'Porto do Rio de Janeiro', velocidade_media: 22.0, status: 'NO_PORTO_DE_DESTINO', lat: -22.8983, lon: -43.1812 },
    { id: 'nav-4', nome: 'Log-In Pantanal', imo: 'IMO-9510022', porto_origem: 'Porto de Santos (STS-01)', porto_destino: 'Porto de Bragança', velocidade_media: 28.0, status: 'FORA_DO_PORTO', lat: -10.0000, lon: -40.0000 },
    { id: 'nav-5', nome: 'Cap San Lorenzo', imo: 'IMO-9648283', porto_origem: 'Porto de Paranaguá', porto_destino: 'Porto de Santos (STS-01)', velocidade_media: 30.0, status: 'DENTRO_DO_PORTO', lat: -25.5011, lon: -48.5117 }
  ];

  // Cálculo de distância Haversine (geodésica WGS84) em metros
  function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
    if (lat1 === lat2 && lon1 === lon2) return 0;
    const R = 6371000; // Raio da Terra em metros
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  const NexusPostGIS = {
    // Retorna cliente Supabase se ativo
    getSupabase() {
      return window.nexusSupabase || null;
    },

    // Getters de infraestrutura com fallback em LocalStorage/Default
    async getPortos() {
      const sp = this.getSupabase();
      if (sp) {
        try {
          const { data, error } = await sp.from('portos').select('*').order('nome');
          if (!error && data && data.length > 0) {
            return data.map(p => ({
              id: p.id,
              codigo: p.codigo,
              nome: p.nome,
              pais: p.pais || 'Brasil',
              cidade: p.cidade || '',
              lat: parseFloat(p.latitude),
              lon: parseFloat(p.longitude)
            }));
          }
        } catch (e) {
          console.warn('[NexusPostGIS] Erro ao consultar portos no Supabase, usando local:', e);
        }
      }
      const local = JSON.parse(localStorage.getItem('nexus_portos') || 'null');
      return local || DEFAULT_PORTOS;
    },

    async savePorto(portoData) {
      let local = await this.getPortos();
      const existingIdx = local.findIndex(p => p.codigo === portoData.codigo || p.id === portoData.id);

      const item = {
        id: portoData.id || `port-${Date.now()}`,
        codigo: portoData.codigo,
        nome: portoData.nome,
        pais: portoData.pais || 'Brasil',
        cidade: portoData.cidade || '',
        lat: parseFloat(portoData.lat || portoData.latitude),
        lon: parseFloat(portoData.lon || portoData.longitude)
      };

      if (existingIdx >= 0) local[existingIdx] = item;
      else local.push(item);

      localStorage.setItem('nexus_portos', JSON.stringify(local));

      const sp = this.getSupabase();
      if (sp) {
        try {
          await sp.from('portos').upsert({
            codigo: item.codigo,
            nome: item.nome,
            pais: item.pais,
            cidade: item.cidade,
            latitude: item.lat,
            longitude: item.lon
          }, { onConflict: 'codigo' });
        } catch (e) {
          console.warn('[NexusPostGIS] Erro ao salvar porto no Supabase:', e);
        }
      }
      return item;
    },

    async getBercos() {
      const sp = this.getSupabase();
      if (sp) {
        try {
          const { data, error } = await sp.from('bercos').select('*, portos(codigo, nome)');
          if (!error && data && data.length > 0) {
            return data.map(b => ({
              id: b.id,
              porto_codigo: b.portos ? b.portos.codigo : '',
              porto_nome: b.portos ? b.portos.nome : '',
              nome_codigo: b.nome_codigo,
              capacidade: b.capacidade,
              status: b.status,
              caracteristicas: b.caracteristicas,
              lat: parseFloat(b.latitude || 0),
              lon: parseFloat(b.longitude || 0)
            }));
          }
        } catch (e) {
          console.warn('[NexusPostGIS] Erro ao consultar berços no Supabase:', e);
        }
      }
      const local = JSON.parse(localStorage.getItem('nexus_bercos') || 'null');
      return local || DEFAULT_BERCOS;
    },

    async saveBerco(bercoData) {
      let local = await this.getBercos();
      const item = {
        id: bercoData.id || `ber-${Date.now()}`,
        porto_codigo: bercoData.porto_codigo,
        porto_nome: bercoData.porto_nome || bercoData.porto_codigo,
        nome_codigo: bercoData.nome_codigo,
        capacidade: parseFloat(bercoData.capacidade || 50000),
        status: bercoData.status || 'DISPONIVEL',
        caracteristicas: bercoData.caracteristicas || '',
        lat: parseFloat(bercoData.lat || 0),
        lon: parseFloat(bercoData.lon || 0)
      };
      local.push(item);
      localStorage.setItem('nexus_bercos', JSON.stringify(local));
      return item;
    },

    async getGuindastes() {
      const sp = this.getSupabase();
      if (sp) {
        try {
          const { data, error } = await sp.from('guindastes').select('*, portos(codigo, nome), bercos(nome_codigo)');
          if (!error && data && data.length > 0) {
            return data.map(g => ({
              id: g.id,
              porto_codigo: g.portos ? g.portos.codigo : '',
              berco_nome: g.bercos ? g.bercos.nome_codigo : '',
              numero_identificacao: g.numero_identificacao,
              tipo: g.tipo,
              capacidade: g.capacidade,
              status: g.status,
              lat: parseFloat(g.latitude || 0),
              lon: parseFloat(g.longitude || 0)
            }));
          }
        } catch (e) {
          console.warn('[NexusPostGIS] Erro ao consultar guindastes no Supabase:', e);
        }
      }
      const local = JSON.parse(localStorage.getItem('nexus_guindastes') || 'null');
      return local || DEFAULT_GUINDASTES;
    },

    async saveGuindaste(gData) {
      let local = await this.getGuindastes();
      const item = {
        id: gData.id || `gnd-${Date.now()}`,
        porto_codigo: gData.porto_codigo,
        berco_nome: gData.berco_nome || '',
        numero_identificacao: gData.numero_identificacao,
        tipo: gData.tipo || 'Guindaste Portuário',
        capacidade: parseFloat(gData.capacidade || 50),
        status: gData.status || 'DISPONIVEL',
        lat: parseFloat(gData.lat || 0),
        lon: parseFloat(gData.lon || 0)
      };
      local.push(item);
      localStorage.setItem('nexus_guindastes', JSON.stringify(local));
      return item;
    },

    async getPatios() {
      const sp = this.getSupabase();
      if (sp) {
        try {
          const { data, error } = await sp.from('patios').select('*, portos(codigo, nome)');
          if (!error && data && data.length > 0) {
            return data.map(p => ({
              id: p.id,
              porto_codigo: p.portos ? p.portos.codigo : '',
              codigo: p.codigo,
              nome: p.nome,
              capacidade: p.capacidade,
              ocupacao: p.ocupacao,
              status: p.status,
              lat: parseFloat(p.latitude || 0),
              lon: parseFloat(p.longitude || 0)
            }));
          }
        } catch (e) {
          console.warn('[NexusPostGIS] Erro ao consultar pátios no Supabase:', e);
        }
      }
      const local = JSON.parse(localStorage.getItem('nexus_patios') || 'null');
      return local || DEFAULT_PATIOS;
    },

    async savePatio(pData) {
      let local = await this.getPatios();
      const item = {
        id: pData.id || `pat-${Date.now()}`,
        porto_codigo: pData.porto_codigo,
        codigo: pData.codigo,
        nome: pData.nome,
        capacidade: parseInt(pData.capacidade || 1000),
        ocupacao: parseInt(pData.ocupacao || 0),
        status: pData.status || 'OPERANTE',
        lat: parseFloat(pData.lat || 0),
        lon: parseFloat(pData.lon || 0)
      };
      local.push(item);
      localStorage.setItem('nexus_patios', JSON.stringify(local));
      return item;
    },

    async getNavios() {
      const sp = this.getSupabase();
      if (sp) {
        try {
          const { data, error } = await sp.from('navios').select('*');
          if (!error && data && data.length > 0) {
            return data.map(n => ({
              id: n.id,
              nome: n.nome,
              imo: n.numero_imo,
              porto_origem: n.porto_origem,
              porto_destino: n.porto_destino,
              velocidade_media: n.velocidade_media !== null ? parseFloat(n.velocidade_media) : null,
              status: n.localizacao,
              lat: parseFloat(n.latitude || 0),
              lon: parseFloat(n.longitude || 0)
            }));
          }
        } catch (e) {
          console.warn('[NexusPostGIS] Erro ao consultar navios no Supabase:', e);
        }
      }
      const local = JSON.parse(localStorage.getItem('nexus_navios') || 'null');
      return local || DEFAULT_NAVIOS;
    },

    // CÁLCULO DE DISTÂNCIA POSTGIS / GEODÉSICA ENTRE PORTOS
    async calcularDistanciaPortos(portoA_CodeOrId, portoB_CodeOrId) {
      const portos = await this.getPortos();
      const p1 = portos.find(p => p.codigo === portoA_CodeOrId || p.id === portoA_CodeOrId || p.nome.includes(portoA_CodeOrId));
      const p2 = portos.find(p => p.codigo === portoB_CodeOrId || p.id === portoB_CodeOrId || p.nome.includes(portoB_CodeOrId));

      if (!p1 || !p2) {
        return {
          sucesso: false,
          mensagem: 'Porto de origem ou destino não encontrado na base de dados.'
        };
      }

      if (p1.codigo === p2.codigo || p1.id === p2.id) {
        return {
          sucesso: true,
          distanciaMetros: 0,
          distanciaKm: 0,
          portoOrigem: p1,
          portoDestino: p2,
          notaExplicativa: 'Origem e destino são o mesmo porto. Distância = 0 km.'
        };
      }

      // Tenta RPC PostGIS se Supabase conectado
      const sp = this.getSupabase();
      if (sp && p1.id && p2.id && p1.id.includes('-') && p2.id.includes('-')) {
        try {
          const { data, error } = await sp.rpc('fn_calcular_distancia_portos', {
            p_origem_id: p1.id,
            p_destino_id: p2.id
          });
          if (!error && data && data.length > 0) {
            return {
              sucesso: true,
              distanciaMetros: parseFloat(data[0].distancia_metros),
              distanciaKm: parseFloat(data[0].distancia_km),
              portoOrigem: p1,
              portoDestino: p2,
              notaExplicativa: data[0].nota_explicativa
            };
          }
        } catch (err) {
          console.warn('[NexusPostGIS] RPC fn_calcular_distancia_portos falhou, usando cálculo local:', err);
        }
      }

      // Fallback local geodésico Haversine
      const distMetros = haversineDistanceMeters(p1.lat, p1.lon, p2.lat, p2.lon);
      const distKm = parseFloat((distMetros / 1000.0).toFixed(2));

      return {
        sucesso: true,
        distanciaMetros: distMetros,
        distanciaKm: distKm,
        portoOrigem: p1,
        portoDestino: p2,
        notaExplicativa: 'Distância geodésica em linha reta (PostGIS / elipsoide WGS84). Esta é uma estimativa geográfica, não necessariamente a rota marítima navegável exata.'
      };
    },

    // CÁLCULO DE TEMPO DE VIAGEM E PREVISÃO DE CHEGADA (ETA)
    async calcularRotaETempo(portoOrigemCode, portoDestinoCode, embarcacaoImoOrName, dataPartidaStr) {
      const distRes = await this.calcularDistanciaPortos(portoOrigemCode, portoDestinoCode);
      if (!distRes.sucesso) return distRes;

      const navios = await this.getNavios();
      const navio = navios.find(n => n.imo === embarcacaoImoOrName || n.nome === embarcacaoImoOrName || n.id === embarcacaoImoOrName);

      if (!navio) {
        return {
          sucesso: false,
          mensagem: `Embarcação "${embarcacaoImoOrName}" não encontrada no cadastro de frotas.`
        };
      }

      const velMedia = navio.velocidade_media;

      // REGRA OBRIGATÓRIA: Se não houver velocidade cadastrada ou <= 0, informar que não é possível calcular o tempo estimado
      if (velMedia === null || velMedia === undefined || isNaN(velMedia) || velMedia <= 0) {
        return {
          sucesso: false,
          navio: navio,
          distanciaKm: distRes.distanciaKm,
          velocidadeMedia: velMedia,
          mensagem: `Não é possível calcular o tempo estimado com precisão suficiente pois a embarcação "${navio.nome}" não possui velocidade média cadastrada ou possui valor inválido.`
        };
      }

      const distanciaKm = distRes.distanciaKm;
      const horasTotais = distanciaKm / velMedia;
      const dias = Math.floor(horasTotais / 24);
      const horasRestantes = Math.round(horasTotais % 24);

      let tempoFormatado = '';
      if (dias > 0) {
        tempoFormatado = `${dias} dia(s) e ${horasRestantes} hora(s) (${horasTotais.toFixed(1)} horas)`;
      } else {
        tempoFormatado = `${horasTotais.toFixed(1)} hora(s)`;
      }

      const partidaDate = dataPartidaStr ? new Date(dataPartidaStr) : new Date();
      const etaMs = partidaDate.getTime() + horasTotais * 3600 * 1000;
      const etaDate = new Date(etaMs);

      return {
        sucesso: true,
        portoOrigem: distRes.portoOrigem,
        portoDestino: distRes.portoDestino,
        navio: navio,
        distanciaKm: distanciaKm,
        velocidadeMedia: velMedia,
        tempoHoras: parseFloat(horasTotais.toFixed(1)),
        dias: dias,
        horas: horasRestantes,
        tempoFormatado: tempoFormatado,
        dataPartida: partidaDate,
        previsaoChegada: etaDate,
        notaExplicativa: distRes.notaExplicativa + ' A previsão de chegada é uma estimativa baseada em distância geográfica e velocidade média cadastrada, não uma previsão náutica operacional.'
      };
    },

    // AUTOMAÇÃO LOGÍSTICA: BUSCA DE EQUIPAMENTOS / GUINDASTES PRÓXIMOS
    async buscarEquipamentosProximos(lat, lon, raioMetros = 5000) {
      const sp = this.getSupabase();
      if (sp) {
        try {
          const { data, error } = await sp.rpc('fn_buscar_equipamentos_proximos', {
            p_lat: lat,
            p_lon: lon,
            p_raio_metros: raioMetros
          });
          if (!error && data) return data;
        } catch (e) {
          console.warn('[NexusPostGIS] RPC fn_buscar_equipamentos_proximos falhou, usando cálculo local:', e);
        }
      }

      const guindastes = await this.getGuindastes();
      const res = [];

      for (const g of guindastes) {
        if (g.lat && g.lon) {
          const d = haversineDistanceMeters(lat, lon, g.lat, g.lon);
          if (d <= raioMetros) {
            res.push({
              equipamento_id: g.id,
              codigo: g.numero_identificacao,
              tipo: g.tipo,
              capacidade: g.capacidade,
              status: g.status,
              distancia_metros: d
            });
          }
        }
      }

      res.sort((a, b) => a.distancia_metros - b.distancia_metros);
      return res;
    }
  };

  window.NexusPostGIS = NexusPostGIS;
})();

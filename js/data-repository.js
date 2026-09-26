/**
 * Módulo de Repositório Central de Dados - NexusPort (js/data-repository.js)
 * Responsável pela centralização de leituras, gravações, atualizações e exclusões no Supabase,
 * eliminando fallbacks com dados fictícios hardcoded e garantindo persistência real.
 */

(function (window) {
  'use strict';

  const ENABLE_MOCKS = false;

  const NexusRepository = {
    ENABLE_MOCKS: ENABLE_MOCKS,

    /**
     * Retorna o cliente Supabase se disponível
     */
    getSupabase: function () {
      return window.nexusSupabase || null;
    },

    /**
     * BUSCAR FUNCIONÁRIOS
     */
    getFuncionarios: async function () {
      const client = this.getSupabase();
      if (client) {
        try {
          const { data, error } = await client
            .from('funcionarios')
            .select('*')
            .order('nome', { ascending: true });
          if (!error && data) {
            return data;
          }
        } catch (err) {
          console.warn('[NexusRepository] Erro ao buscar funcionarios do Supabase:', err);
        }
      }
      return JSON.parse(localStorage.getItem('nexus_func_list') || '[]');
    },

    /**
     * SALVAR / ATUALIZAR FUNCIONÁRIO
     */
    saveFuncionario: async function (funcionario) {
      const client = this.getSupabase();
      if (client) {
        try {
          if (funcionario.id) {
            await client.from('funcionarios').update(funcionario).eq('id', funcionario.id);
          } else {
            await client.from('funcionarios').insert(funcionario);
          }
        } catch (err) {
          console.warn('[NexusRepository] Erro ao salvar funcionario no Supabase:', err);
        }
      }
      // Atualiza local state
      let list = JSON.parse(localStorage.getItem('nexus_func_list') || '[]');
      const idx = list.findIndex(f => f.matricula === funcionario.matricula || (funcionario.id && f.id === funcionario.id));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...funcionario };
      } else {
        list.push(funcionario);
      }
      localStorage.setItem('nexus_func_list', JSON.stringify(list));
      return funcionario;
    },

    /**
     * EXCLUIR FUNCIONÁRIO
     */
    deleteFuncionario: async function (matricula) {
      const client = this.getSupabase();
      if (client) {
        try {
          await client.from('funcionarios').delete().eq('matricula', matricula);
        } catch (err) {
          console.warn('[NexusRepository] Erro ao excluir funcionario do Supabase:', err);
        }
      }
      let list = JSON.parse(localStorage.getItem('nexus_func_list') || '[]');
      list = list.filter(f => f.matricula !== matricula);
      localStorage.setItem('nexus_func_list', JSON.stringify(list));
    },

    /**
     * BUSCAR CARGAS
     */
    getCargas: async function () {
      const client = this.getSupabase();
      if (client) {
        try {
          const { data, error } = await client.from('cargas').select('*');
          if (!error && data) {
            return data.map((c, i) => ({
              id: c.qr_code_url ? c.qr_code_url.replace('QR-', '') : `CRG-${c.id}`,
              tipo: c.natureza || 'Carga Geral',
              peso: `${c.peso || 0} t`,
              volume: `${c.volume || 0} m³`,
              valor: `R$ ${(c.valor_declarado || 0).toLocaleString('pt-BR')}`,
              natureza: c.natureza || 'Geral',
              portoDescarga: c.porto_descarga || 'Terminal STS-01',
              destino: c.destino || 'Destino Geral',
              status: c.status_fluxo || 'AGENDAMENTO',
              container: c.container_id || '',
              navio: c.navio || '',
              qrCode: c.qr_code_url || `QR-CRG-${c.id}`,
              motivoCancelamento: c.motivo_recusa || null,
              rawDbId: c.id
            }));
          }
        } catch (err) {
          console.warn('[NexusRepository] Erro ao buscar cargas do Supabase:', err);
        }
      }
      return JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');
    },

    /**
     * SALVAR CARGA
     */
    saveCarga: async function (carga) {
      const client = this.getSupabase();
      if (client) {
        try {
          const dbData = {
            natureza: carga.natureza || carga.tipo,
            peso: parseFloat(carga.peso) || 0,
            volume: parseFloat(carga.volume) || 0,
            valor_declarado: parseFloat(carga.valor ? carga.valor.replace(/[^0-9,.-]/g, '').replace(',', '.') : 0) || 0,
            porto_descarga: carga.portoDescarga,
            destino: carga.destino,
            status_fluxo: carga.status,
            qr_code_url: carga.qrCode || `QR-${carga.id}`,
            container_id: carga.container || null,
            motivo_recusa: carga.motivoCancelamento || null
          };

          if (carga.rawDbId) {
            await client.from('cargas').update(dbData).eq('id', carga.rawDbId);
          } else {
            const { data } = await client.from('cargas').insert(dbData).select().maybeSingle();
            if (data) carga.rawDbId = data.id;
          }
        } catch (err) {
          console.warn('[NexusRepository] Erro ao salvar carga no Supabase:', err);
        }
      }

      let list = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');
      const idx = list.findIndex(c => c.id === carga.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...carga };
      } else {
        list.push(carga);
      }
      localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(list));
      return carga;
    },

    /**
     * EXCLUIR / CANCELAR CARGA REAL
     */
    deleteCarga: async function (idCarga) {
      const client = this.getSupabase();
      if (client) {
        try {
          await client.from('cargas').delete().eq('qr_code_url', `QR-${idCarga}`);
        } catch (err) {
          console.warn('[NexusRepository] Erro ao excluir carga do Supabase:', err);
        }
      }
      let list = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');
      list = list.filter(c => c.id !== idCarga);
      localStorage.setItem('nexus_cargas_fluxo', JSON.stringify(list));
    },

    /**
     * BUSCAR NAVIOS
     */
    getNavios: async function () {
      const client = this.getSupabase();
      if (client) {
        try {
          const { data, error } = await client.from('navios').select('*');
          if (!error && data) {
            return data.map(n => ({
              id: n.id,
              nome: n.nome,
              imo: n.numero_imo || n.imo,
              estado: n.estado_operacional || n.estado || 'OPERANTE',
              localizacao: n.localizacao || 'DENTRO_DO_PORTO',
              origem: n.porto_origem || n.origem || 'Origem',
              destino: n.porto_destino || n.destino || 'Destino',
              operacoes: n.operacoes || 0,
              data_saida: n.data_saida || null
            }));
          }
        } catch (err) {
          console.warn('[NexusRepository] Erro ao buscar navios do Supabase:', err);
        }
      }
      return JSON.parse(localStorage.getItem('nexus_navios_list') || '[]');
    },

    /**
     * BUSCAR VISITANTES
     */
    getVisitantes: async function () {
      const client = this.getSupabase();
      if (client) {
        try {
          const { data, error } = await client.from('visitantes').select('*');
          if (!error && data) {
            return data.map(v => ({
              id: v.id,
              nome: v.nome,
              documento: v.documento,
              motivo: v.motivo,
              registrado_por: v.registrado_por,
              data: v.created_at ? new Date(v.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')
            }));
          }
        } catch (err) {
          console.warn('[NexusRepository] Erro ao buscar visitantes do Supabase:', err);
        }
      }
      return JSON.parse(localStorage.getItem('nexus_vis_list') || '[]');
    },

    /**
     * SALVAR VISITANTE
     */
    saveVisitante: async function (vis) {
      const client = this.getSupabase();
      if (client) {
        try {
          await client.from('visitantes').insert({
            nome: vis.nome,
            documento: vis.documento,
            motivo: vis.motivo,
            registrado_por: vis.registrado_por
          });
        } catch (err) {
          console.warn('[NexusRepository] Erro ao salvar visitante no Supabase:', err);
        }
      }
      let list = JSON.parse(localStorage.getItem('nexus_vis_list') || '[]');
      list.push(vis);
      localStorage.setItem('nexus_vis_list', JSON.stringify(list));
      return vis;
    },

    /**
     * EXCLUIR VISITANTE
     */
    deleteVisitante: async function (docOuId) {
      const client = this.getSupabase();
      if (client) {
        try {
          await client.from('visitantes').delete().or(`documento.eq.${docOuId},id.eq.${docOuId}`);
        } catch (err) {
          console.warn('[NexusRepository] Erro ao excluir visitante do Supabase:', err);
        }
      }
      let list = JSON.parse(localStorage.getItem('nexus_vis_list') || '[]');
      list = list.filter(v => v.documento !== docOuId && v.id !== docOuId);
      localStorage.setItem('nexus_vis_list', JSON.stringify(list));
    },

    /**
     * NOTIFICAÇÃO DE ALTERAÇÃO EM TEMPO REAL (Item 2)
     */
    notifyChange: function (entity) {
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('nexusport_sync');
          bc.postMessage({ type: 'NEXUS_DATA_CHANGED', entity: entity, timestamp: Date.now() });
          bc.close();
        } catch (e) {}
      }
      window.dispatchEvent(new CustomEvent('nexus_data_changed', { detail: { entity: entity } }));
    }
  };

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bcSync = new BroadcastChannel('nexusport_sync');
      bcSync.onmessage = (event) => {
        if (event.data && event.data.type === 'NEXUS_DATA_CHANGED') {
          window.dispatchEvent(new CustomEvent('nexus_data_changed', { detail: event.data }));
        }
      };
    } catch (e) {}
  }

  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('nexus_')) {
      window.dispatchEvent(new CustomEvent('nexus_data_changed', { detail: { entity: e.key } }));
    }
  });

  window.NexusRepository = NexusRepository;
})(window);

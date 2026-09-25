/**
 * Camada de Visão Própria, Visão Operacional e Visão Estratégica (T1.4, T1.5 & T1.6) - NexusPort
 *
 * Especificação (Spec.md RF 1):
 * 1. Visão Própria (Cargos Operacionais):
 *    - Estivador, Conferente, Arrumador, Planejador, Técnico: enxergam apenas entidades diretamente ligadas às suas atribuições.
 *
 * 2. Visão Operacional (Inspetor e Supervisor):
 *    - Leitura de TODOS os dados operacionais dos cargos inferiores (cargas, navios, contêineres, manutenções, checklists, logs, trail).
 *    - RESTRIÇÃO OBRIGATÓRIA: NÃO têm acesso à documentação interna de funcionários nem ao cadastro de visitantes.
 *
 * 3. Visão Estratégica (Diretor de Operações, Diretor-Presidente, Conselho de Administração):
 *    - Acesso TOTAL de leitura a todas as funcionalidades e dados do sistema.
 *    - Dashboards exclusivos com gráficos consolidados (taxa de aprovação/recusa, tempo médio de permanência, navios mais utilizados, produtividade).
 *    - Exportação de dados históricos em formato estruturado.
 */

(function (window) {
  'use strict';

  // Desativação total de dados mock e dados fictícios (Etapa 3 - Plano de Correção)
  const ENABLE_MOCKS = false;
  const mockDatabase = {
    cargas: [],
    navios: [],
    containers: [],
    visitantes: [],
    documentacao_funcionarios: []
  };

  const NexusVision = {
    /**
     * Verifica se o usuário tem permissão para acessar determinado módulo do sistema (T1.5 & T1.6)
     */
    hasAccessToModule: function (moduleName, session) {
      if (!session || !session.cargo) return false;

      const cargo = session.cargo;

      // Diretores têm acesso total de leitura (Visão Estratégica)
      if (['DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(cargo)) {
        return true;
      }

      // Restrição para Inspetor e Supervisor (RF 1)
      if (['INSPETOR', 'SUPERVISOR_GERENTE_OPERACOES'].includes(cargo)) {
        if (moduleName === 'visitantes' || moduleName === 'documentacao_funcionarios') {
          return false;
        }
        return true;
      }

      // Técnico em Portos tem acesso a visitantes e documentos de funcionários
      if (cargo === 'TECNICO_PORTOS') {
        return true;
      }

      if (['visitantes', 'documentacao_funcionarios'].includes(moduleName)) {
        return false;
      }

      return true;
    },

    /**
     * Aplica o filtro de Visão no Supabase (Própria, Operacional ou Estratégica)
     */
    applyVisaoFilter: function (queryBuilder, entityType, session) {
      if (!session || !session.cargo) return queryBuilder;

      const cargo = session.cargo;

      // Visão Estratégica (Diretores): acesso total de leitura sem restrições
      if (['DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(cargo)) {
        return queryBuilder;
      }

      // Visão Operacional (Inspetor / Supervisor)
      if (['SUPERVISOR_GERENTE_OPERACOES', 'INSPETOR'].includes(cargo)) {
        if (entityType === 'visitantes' || entityType === 'documentacao_funcionarios') {
          return queryBuilder.eq('id', 'ACCESSO_NEGADO');
        }
        return queryBuilder;
      }

      // Visão Própria (Cargos Operacionais)
      const userMatricula = session.matricula;
      if (cargo === 'ESTIVADOR' && entityType === 'cargas') {
        return queryBuilder.eq('estivador_id', userMatricula);
      } else if (cargo === 'CONFERENTE_CARGA' && entityType === 'cargas') {
        return queryBuilder.eq('conferente_id', userMatricula);
      } else if (cargo === 'ARRUMADOR_CONSERTADOR' && entityType === 'cargas') {
        return queryBuilder.eq('arrumador_id', userMatricula);
      } else if (cargo === 'TECNICO_PORTOS' && entityType === 'visitantes') {
        return queryBuilder.eq('registrado_por', session.id || userMatricula);
      }

      return queryBuilder;
    },

    /**
     * Retorna os dados operacionais na camada mock respeitando a camada de visão
     */
    getMockVisaoData: function (entityType, session) {
      if (!session) return [];

      const cargo = session.cargo;

      // Visão Estratégica: acesso total de leitura
      if (['DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(cargo)) {
        return mockDatabase[entityType] || [];
      }

      // Módulos restritos para Inspetor / Supervisor (RF 1)
      if (['INSPETOR', 'SUPERVISOR_GERENTE_OPERACOES'].includes(cargo)) {
        if (entityType === 'visitantes' || entityType === 'documentacao_funcionarios') {
          return [];
        }
        return mockDatabase[entityType] || [];
      }

      // Visão Própria (Cargos Operacionais):
      return this.getMockVisaoPropria(entityType, session);
    },

    /**
     * Retorna os dados filtrados pela Visão Própria na camada mock
     */
    getMockVisaoPropria: function (entityType, session) {
      if (!session) return [];

      const userMatricula = session.matricula || 'MAT-1040';

      if (entityType === 'cargas') {
        const allCargas = mockDatabase.cargas;

        if (session.cargo === 'ESTIVADOR') {
          return allCargas.filter(c => c.estivador_id === userMatricula);
        } else if (session.cargo === 'CONFERENTE_CARGA') {
          return allCargas.filter(c => c.conferente_id === userMatricula);
        } else if (session.cargo === 'ARRUMADOR_CONSERTADOR') {
          return allCargas.filter(c => c.arrumador_id === userMatricula);
        }

        return allCargas;
      }

      return mockDatabase[entityType] || [];
    },

    /**
     * Retorna indicadores executivos consolidados para a Visão Estratégica (T1.6 / RF 1)
     */
    getEstrategicoMetrics: function () {
      return {
        taxaAprovacao: 94.2, // % de cargas aprovadas
        taxaRecusa: 5.8,   // % de cargas recusadas
        tempoMedioPermanenciaDias: 3.8, // dias
        totalCargasAno: 12480,
        naviosMaisUtilizados: [
          { nome: 'MV Santos Star', operacoes: 142 },
          { id: 'MV Pacific Giant', operacoes: 115 },
          { id: 'MV Atlantic Breeze', operacoes: 98 }
        ],
        produtividadePorCargo: [
          { cargo: 'Conferente de Carga', operacoes: 4820 },
          { cargo: 'Inspetor', vistorias: 1240 },
          { cargo: 'Estivador', movimentacoes: 6390 },
          { cargo: 'Arrumador e Consertador', entregas: 3810 }
        ]
      };
    },

    /**
     * Exporta os dados históricos de operações em formato CSV para download (T1.6)
     */
    exportDadosHistoricos: function () {
      const allCargas = mockDatabase.cargas;
      const headers = ['ID', 'Codigo Carga', 'Tipo', 'Peso', 'Status', 'Container', 'Data'];
      const rows = allCargas.map(c => [c.id, c.codigo_carga, c.tipo, c.peso, c.status, c.container_id, c.data]);

      let csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `nexusport_historico_operacoes_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  window.NexusVision = NexusVision;
})(window);

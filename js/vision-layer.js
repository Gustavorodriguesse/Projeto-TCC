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

  // Base de dados mock simulando dados do pátio e estatísticas consolidadas
  const mockDatabase = {
    cargas: [
      { id: 'CARGA-001', codigo_carga: 'CRG-2026-001', tipo: 'Grãos Soltos', peso: '25.5 t', status: 'EM_CARREGAMENTO', estivador_id: 'MAT-1040', conferente_id: 'MAT-2050', arrumador_id: 'MAT-3060', container_id: 'CONT-991', data: '20/09/2026 08:30' },
      { id: 'CARGA-002', codigo_carga: 'CRG-2026-002', tipo: 'Eletrônicos', peso: '12.0 t', status: 'ARMAZENAGEM', estivador_id: 'MAT-9999', conferente_id: 'MAT-2050', arrumador_id: 'MAT-3060', container_id: 'CONT-992', data: '20/09/2026 09:15' },
      { id: 'CARGA-003', codigo_carga: 'CRG-2026-003', tipo: 'Produtos Químicos', peso: '18.2 t', status: 'PRONTA_PARA_ENTREGA', estivador_id: 'MAT-1040', conferente_id: 'MAT-8888', arrumador_id: 'MAT-3060', container_id: 'CONT-993', data: '20/09/2026 10:00' },
      { id: 'CARGA-004', codigo_carga: 'CRG-2026-004', tipo: 'Maquinário Pesado', peso: '45.0 t', status: 'RECEBIMENTO_INSPECAO', estivador_id: 'MAT-7777', conferente_id: 'MAT-2050', arrumador_id: 'MAT-7777', container_id: 'CONT-994', data: '20/09/2026 10:45' }
    ],
    navios: [
      { id: 'NAV-001', nome: 'MV Santos Star', imo: 'IMO 9823412', estado: 'OPERANTE', localizacao: 'DENTRO_DO_PORTO', origem: 'Porto de Roterdã', destino: 'Porto de Santos', operacoes: 142 },
      { id: 'NAV-002', nome: 'MV Atlantic Breeze', imo: 'IMO 9123841', estado: 'AGENDADO_PARA_REFORMA', localizacao: 'FORA_DO_PORTO', origem: 'Porto de Xangai', destino: 'Porto de Santos', operacoes: 98 },
      { id: 'NAV-003', nome: 'MV Pacific Giant', imo: 'IMO 9732109', estado: 'OPERANTE', localizacao: 'NO_PORTO_DE_DESTINO', origem: 'Porto de Santos', destino: 'Porto de Singapura', operacoes: 115 }
    ],
    containers: [
      { id: 'CONT-991', numero: 'NYKU-881290-0', tipo: 'Grãos Soltos', estado: 'OPERANTE', navio: 'MV Santos Star' },
      { id: 'CONT-992', numero: 'MSCU-102938-4', tipo: 'Eletrônicos', estado: 'OPERANTE', navio: 'MV Santos Star' }
    ],
    visitantes: [
      { id: 'VIS-001', nome: 'Auditor Fiscal João Souza', documento: 'CPF 123.456.789-00', motivo: 'Fiscalização Alfandegária', registrado_por: 'MAT-5080', data: '20/09/2026' }
    ],
    documentacao_funcionarios: [
      { id: 'DOC-001', matricula: 'MAT-1040', tipo: 'Ficha de Registro de Empregado', arquivo: 'ficha_mat_1040.pdf', privado: true }
    ]
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

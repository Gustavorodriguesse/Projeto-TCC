/**
 * Guard e Middleware de Autenticação (T1.3) - NexusPort
 * Valida sessão ativa e código individual do operador antes do carregamento das páginas protegidas.
 */

(function (window) {
  'use strict';

  const SESSION_KEY = 'nexus_session';

  // Matriz de Ações x Cargos com base no Spec.md RF 1
  const ACTION_PERMISSIONS = {
    // Estivador
    'MOVIMENTAR_CARGA': ['ESTIVADOR', 'INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],

    // Conferente de Carga
    'REGISTRAR_RECEBIMENTO': ['CONFERENTE_CARGA', 'INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],

    // Arrumador e Consertador
    'ALTERAR_PRONTA_ENTREGA': ['ARRUMADOR_CONSERTADOR', 'INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],

    // Planejador de Pátio e Navios
    'ATUALIZAR_DADOS_NAVIO_CONTAINER': ['PLANEJADOR_PATIO_NAVIOS', 'SUPERVISOR_GERENTE_OPERACOES', 'INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],

    // Técnico em Portos
    'CADASTRAR_VISITANTE': ['TECNICO_PORTOS', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'CADASTRAR_DOCUMENTO_FUNCIONARIO': ['TECNICO_PORTOS', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],

    // Inspetor
    'CADASTRAR_NAVIO': ['INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'CADASTRAR_CONTAINER': ['INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'CADASTRAR_GUINDASTE': ['INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'INSPECIONAR_CARGA': ['INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'ACIONAR_EMERGENCIA': ['INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],

    // Supervisor / Gerente de Operações
    'LIBERAR_NAVIO': ['SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'LIBERAR_CARGA': ['SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'CANCELAR_ENTREGA': ['SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'SOLICITAR_MANUTENCAO': ['SUPERVISOR_GERENTE_OPERACOES', 'INSPETOR', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'APROVAR_MANUTENCAO': ['SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'DESIGNAR_SUBSTITUTO': ['SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'CADASTRAR_ROTA': ['SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'CADASTRAR_TIPO_CARGA': ['SUPERVISOR_GERENTE_OPERACOES', 'DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],

    // Diretor (Visão Estratégica)
    'EXPORTAR_HISTORICO': ['DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'],
    'VER_DASHBOARD_ESTRATEGICO': ['DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO']
  };

  const NexusAuth = {
    /**
     * Obtém a sessão ativa armazenada no sessionStorage ou localStorage
     */
    getSession: function () {
      try {
        const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const session = JSON.parse(raw);
        return session && session.codigo_individual ? session : null;
      } catch (err) {
        console.error('[NexusAuth] Erro ao ler sessão:', err);
        return null;
      }
    },

    /**
     * Retorna os dados do usuário logado
     */
    getUser: function () {
      const session = this.getSession();
      return session ? session : null;
    },

    /**
     * Exige autenticação prévia. Se não autenticado, redireciona para a tela de login.
     * @param {Array<string>} [allowedRoles] - Lista opcional de cargos autorizados para a rota.
     */
    requireAuth: function (allowedRoles) {
      const session = this.getSession();

      if (!session) {
        console.warn('[NexusAuth] Acesso negado: Sessão não encontrada ou expirada.');
        window.location.href = 'index.html';
        return null;
      }

      // Se cargos específicos foram informados, valida se o cargo do usuário possui permissão
      if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        if (!allowedRoles.includes(session.cargo)) {
          console.warn(`[NexusAuth] Acesso restrito: Cargo ${session.cargo} não autorizado para esta rota.`);
          alert(`Acesso Restrito: Seu cargo (${session.cargo_nome || session.cargo}) não tem permissão para acessar esta área.`);
          window.location.href = 'dashboard.html';
          return null;
        }
      }

      return session;
    },

    /**
     * Verifica se o usuário autenticado possui permissão para executar determinada ação (RBAC T1.7)
     * @param {string} actionKey - Identificador da ação (ex: 'LIBERAR_NAVIO')
     * @returns {boolean}
     */
    hasPermission: function (actionKey) {
      const session = this.getSession();
      if (!session || !session.cargo) return false;

      const allowedRoles = ACTION_PERMISSIONS[actionKey];
      if (!allowedRoles) {
        console.warn(`[NexusAuth] Ação não mapeada na matriz RBAC: ${actionKey}`);
        return false;
      }

      return allowedRoles.includes(session.cargo);
    },

    /**
     * Encerra a sessão ativa do usuário e redireciona para o login
     */
    logout: function () {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem('nexus_pending_auth');
      window.location.href = 'index.html';
    }
  };

  window.NexusAuth = NexusAuth;
})(window);

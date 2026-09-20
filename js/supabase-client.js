/**
 * Cliente Supabase Centralizado - NexusPort
 * Inicializa o cliente do Supabase utilizando as credenciais definidas em js/config.js.
 */
(function () {
  const config = window.NEXUS_CONFIG || {};
  let supabaseClient = null;

  if (typeof supabase !== 'undefined' && config.SUPABASE_URL && config.SUPABASE_ANON_KEY && config.SUPABASE_URL !== "https://sua-url-supabase.supabase.co") {
    try {
      supabaseClient = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
      console.log("[NexusPort] Cliente Supabase inicializado com sucesso.");
    } catch (err) {
      console.warn("[NexusPort] Erro ao inicializar o cliente Supabase:", err);
    }
  } else {
    console.log("[NexusPort] Modo offline/simulação ativo ou credenciais do Supabase pendentes.");
  }

  window.nexusSupabase = supabaseClient;
})();

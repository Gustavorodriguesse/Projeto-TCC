/**
 * Cliente Supabase Centralizado - NexusPort
 * Inicializa o cliente do Supabase utilizando as credenciais definidas em js/config.js
 * ou variáveis globais/ambiente se fornecidas.
 */
(function () {
  const config = window.NEXUS_CONFIG || {};
  let supabaseClient = null;

  const url = config.SUPABASE_URL || window.SUPABASE_URL;
  const key = config.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;

  if (typeof supabase !== 'undefined' && url && key && url !== "https://sua-url-supabase.supabase.co" && !url.includes("sua-url")) {
    try {
      supabaseClient = supabase.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      console.log("[NexusPort] Cliente Supabase inicializado com sucesso.");
    } catch (err) {
      console.warn("[NexusPort] Erro ao inicializar o cliente Supabase:", err);
    }
  } else {
    console.log("[NexusPort] Modo offline/simulação ativo ou credenciais do Supabase pendentes.");
  }

  window.nexusSupabase = supabaseClient;
})();

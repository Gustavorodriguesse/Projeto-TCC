# 📋 Backlog de Alterações

## BACKLOG #001 — Divisão Arquitetural e Estrutura de Páginas Dedicadas
**Data:** 22/09/2026
**Prioridade:** Alta
**Tipo:** Melhoria / Arquitetura

**Descrição:** Refatoração da arquitetura monolítica para páginas HTML dedicadas conectadas por uma Barra Lateral (Sidebar Persistente) com perfil, cargo, matrícula e guarda de autenticação RLS.

**✅ Adicionado:**
- Páginas HTML dedicadas por módulo: `index.html`, `dashboard.html`, `cargas.html`, `inspecao.html`, `scanner.html`, `embarcacoes.html`, `manutencao.html`, `delegacao.html`, `tecnico_portos.html` e `relatorios.html`.
- Barra Lateral de Navegação (Sidebar Persistente) em `js/layout.js` compartilhada entre todas as telas do sistema.
- Guarda de autenticação em `js/auth-guard.js` com validação de sessão ativa.

**🗑️ Removido:**
- Padrão de página única monolítica no `dashboard.html`.

**🔧 Corrigido:**
- Navegação direta entre áreas do sistema preservando a sessão e a camada de visão RLS ativas.

---

## BACKLOG #002 — Persistência e Sincronização em Tempo Real com o Supabase
**Data:** 22/09/2026
**Prioridade:** Alta
**Tipo:** Nova funcionalidade / Correção

**Descrição:** Integração assíncrona dos manipuladores de formulários e eventos da aplicação com as tabelas do banco de dados PostgreSQL no Supabase, mantendo contingência offline no `localStorage`.

**✅ Adicionado:**
- Inserções assíncronas no Supabase para agendamento de cargas (`cargas`), cadastros de contêineres (`containers`), ordens de serviço de manutenção (`manutencoes`), visitantes (`visitantes`), novos funcionários (`funcionarios`) e delegações de supervisor (`delegacoes_supervisor`).
- Registro assíncrono de logs de alterações (`logs_alteracoes`), trail de decisões imutável (`trail_decisoes`) e retificações (`retificacoes_trail`).
- Atualizações de status do fluxo de cargas, resultados de inspeção técnica (`ARMAZENAGEM` / `RECUSADA`) e status de OS de manutenção no banco de dados.

**🗑️ Removido:**
- Persistência exclusiva em `localStorage` que isolava os dados apenas na máquina local.

**🔧 Corrigido:**
- Falha onde novas cargas agendadas e registros não subiam para as tabelas do Supabase.

---

## BACKLOG #003 — Autenticação e Login de Novos Funcionários
**Data:** 22/09/2026
**Prioridade:** Alta
**Tipo:** Correção

**Descrição:** Correção do sistema de validação da tela de login (`js/login.js`) para reconhecer cadastros locais (`nexus_func_list`) e novos funcionários inseridos via `TECNICO_PORTOS` / Supabase.

**✅ Adicionado:**
- Suporte a busca de funcionários cadastrados na chave local `nexus_func_list` durante a validação da tela de login.
- Sincronização automática do novo funcionário cadastrado pelo Técnico em Portos com a tabela `funcionarios` no Supabase.

**🗑️ Removido:**
- Dependência exclusiva do array estático `mockEmployees` para validação de logins na máquina local.

**🔧 Corrigido:**
- Impossibilidade de realizar login com a matrícula ou código de novos funcionários criados pela conta do Técnico em Portos (`TEC-1001`).

---

## BACKLOG #004 — Regras de Negócio do Fluxo de Cargas, Inspeção e QR Code
**Data:** 22/09/2026
**Prioridade:** Alta
**Tipo:** Nova funcionalidade / Correção

**Descrição:** Implementação de travas de segurança operacionais, checklists técnicos dinâmicos, scanner QR via câmera e geração de etiquetas A4/PDF 10x10cm.

**✅ Adicionado:**
- Modal de confirmação e exibição automática do QR Code gerado em tempo real no agendamento de cargas e cadastros de contêineres.
- Gerador de etiquetas em PDF 10x10cm com botão "Imprimir Etiqueta" e funcionalidade de reimpressão com auditoria.
- Scanner QR Code dedicado (`scanner.html`) via câmera do dispositivo móvel com redirecionamento contextual por cargo.
- Inspeção técnica com travamento RN 14 (exigência de 100% dos itens críticos conforme obrigatórios para aprovação).
- Delegação de supervisor com trava rígida de 1 substituto ativo por vez e revogação imediata.

**🗑️ Removido:**
- Exibição de botões de ações operacionais (`[Receber]`, `[Vincular]`, `[Pronta]`, `[Liberar]`) na interface do Inspetor, garantindo visão de leitura estrita.

**🔧 Corrigido:**
- Inconsistência na contagem de tempo fora do porto para navios com status `NO_PORTO_DE_DESTINO`.
- Trava de agendamento garantindo que cargas só sejam agendadas se o Tipo de Carga possuir checklist pré-cadastrado (RN 13).

---

## BACKLOG #005 — Resolução de Pendências do Documento correcoes.md
**Data:** 22/09/2026
**Prioridade:** Alta
**Tipo:** Correção / Melhoria

**Descrição:** Resolução completa das pendências listadas no arquivo `correcoes.md`, incluindo modal centralizado para os cards operacionais, identificação de colaboradores no Log Geral, reestruturação do Trail de Decisões, ampliação da lista compartilhada de tipos de carga e checklists técnicos, unificação da busca por localização de funcionários, aplicação da logo oficial do porto e persistência de tema escuro entre navegações.

**✅ Adicionado:**
- Modal centralizado sobreposto com backdrop escurecido, botão de fechar (X), fechamento por clique fora ou tecla `Esc` para o detalhamento dos 7 Cards Operacionais no Painel Geral (`dashboard.html`).
- Coluna "Nome do Funcionário" na tabela do Log Geral de Alterações (`dashboard.html` / `js/dashboard.js`).
- Módulo de tipos de carga e checklists técnicos ampliados compartilhados em `js/tipos-carga.js` abrangendo opções como Contêiner 20', Contêiner 40', Reefer, Carga Solta, Carga Fracionada, Granel Sólido, Granel Líquido, Carga Perigosa (IMO), Carga Viva, Carga de Projeto, etc.
- Logo oficial da pasta `design` (`design/logo_porto.png`) aplicada em todas as telas (login, confirmação de cargo, topbar/sidebar e favicon).
- Suporte a busca de funcionários cadastrados dinamicamente na página de Gestão de Pessoas (`tecnico_portos.html` / `js/tecnico_portos.js`), garantindo disponibilização imediata da matrícula para localização.

**🗑️ Removido:**
- Utilização de mensagens `alert()` para os cards operacionais do Painel Geral.
- Ícone/logo provisória com a letra "N" no aplicativo.

**🔧 Corrigido:**
- Perda do Modo Noturno (`nexus_theme`) ao alternar entre páginas HTML, garantindo aplicação imediata da classe `.dark` em `document.documentElement` no carregamento.
- Desorganização visual no Trail de Decisões, agora apresentado em cards estruturados por hierarquia.

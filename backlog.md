# 📋 Backlog de Desenvolvimento & Histórico de Alterações - NexusPort

**Terminal STS-01 Santos**

Este documento registra o histórico do que foi **desenvolvido**, **adicionado**, **removido/refatorado** e o que **permanece planejado / tarefas futuras** no sistema NexusPort.

---

## 🟢 1. O que foi Adicionado & Concluído (Done)

### 🔑 Autenticação, RLS e Acesso (Fase 1)
- **Login por Código Individual Único:** Validação de código vinculado à matrícula com confirmação automática de cargo (`index.html` e `confirm-role.html`).
- **Guarda de Autenticação (`js/auth-guard.js`):** Validação de sessão no `sessionStorage` e `localStorage` em todas as páginas internas.
- **Camadas de Visão RLS (RF 1):**
  - **Visão Própria:** Estivador, Conferente, Arrumador, Planejador e Técnico em Portos.
  - **Visão Operacional:** Inspetor e Supervisor de Operações.
  - **Visão Estratégica:** Diretores e Conselho de Administração.
- **Invalidação e Reemissão de Códigos (T1.8 / RN 15):** Módulo do Técnico em Portos com capacidade de invalidar código antigo e reemitir novo código de acesso.

### 🏢 Módulos e Páginas Dedicadas (Fase 2 a Fase 8)
- **Barra Lateral Persistente (`js/layout.js`):** Sidebar responsiva com perfil, cargo, matrícula e botão Sair presente em todas as 9 páginas internas.
- **`dashboard.html`:**
  - 7 Cards Indicadores Operacionais em tempo real (RF 7).
  - Tabela do Log Geral de Alterações (RF 12).
  - Tabela do Trail de Decisões Críticas Imutável com anexação de retificações (`[Anexar Retificação]`, RF 13).
  - Painel Estratégico Executivo com gráficos Chart.js para Diretores.
- **`cargas.html`:**
  - Tabela do Fluxo Core de Cargas nas 8 etapas.
  - Ocultação estrita de botões por perfil/cargo (RF 1).
  - Form e modal de agendamento com validação de pré-requisito de checklist (RN 13) e geração de QR Code em tempo real (RF 17.1).
- **`inspecao.html`:**
  - Inspeção técnica formal com checklist dinâmico por tipo de carga.
  - Trava de pré-requisito RN 14 (100% dos itens críticos conforme obrigatórios para aprovação).
- **`scanner.html`:**
  - Scanner de QR Code via câmera do navegador com fallback para simulação manual.
- **`embarcacoes.html`:**
  - Tabela GPS marítima fictícia com classificação de status (`DENTRO_DO_PORTO`, `FORA_DO_PORTO`, `NO_PORTO_DE_DESTINO`).
  - Pausa de tempo fora do porto para navios em `NO_PORTO_DE_DESTINO` (RF 5 / RN 8).
  - CRUD de contêineres com seletor de referência de tempo (RN 7).
- **`manutencao.html`:**
  - Gestão de Ordens de Serviço (OS) com aprovação do Supervisor.
  - Botão de Pânico e Alarme de Emergência.
- **`delegacao.html`:**
  - Designação e revogação de Supervisor Substituto com trava rígida de 1 ativo por vez (RF 14).
- **`tecnico_portos.html`:**
  - CRUD de Funcionários e Ficha/Livro de Visitantes Temporários.
- **`relatorios.html`:**
  - Emissão de Relatório PDF A4 em 4 seções sequenciais com logotipo (RF 11).
  - Painel de produtividade da equipe (RF 16).

### ⚡ Persistência em Tempo Real com Supabase (Branch `dadossupabase`)
- Sincronização assíncrona com fallback de contingência em `localStorage`:
  - `funcionarios` & `nexus_func_list`: Novos cadastros e reemissões sincronizados e autenticáveis no login.
  - `visitantes`: Livro de visitantes sincronizado com a tabela `visitantes`.
  - `cargas`: Agendamentos e atualizações de status de fluxo sincronizados na tabela `cargas`.
  - `inspecoes`: Resultados de inspeção técnica (Aprovada/Recusada) refletidos na tabela `cargas`.
  - `containers`: Cadastros de contêineres e referências de tempo salvos na tabela `containers`.
  - `manutencoes`: Solicitações e aprovações de OS salvas na tabela `manutencoes`.
  - `delegacoes_supervisor`: Ativações e revogações salvas na tabela `delegacoes_supervisor`.
  - `logs_alteracoes` & `trail_decisoes` & `retificacoes_trail`: Auditoria e retificações gravadas no Supabase.

### 🧪 Automação & Testes
- Scripts Python com Playwright (`verify_phase3.py` a `verify_phase9.py`, `verify_t1_8.py`) cobrindo 100% do fluxo do sistema e gerando evidências visuais.

---

## 🔴 2. O que foi Removido / Refatorado (Refactored / Removed)

- **Remoção do Padrão Monolítico (`dashboard.html` único):** Substituído pela arquitetura modular de 9 páginas HTML dedicadas conectadas pela barra lateral.
- **Remoção de Bypasses e Logins Sem Validação:** Eliminada a permissão de login com qualquer código arbritário. O login agora valida estritamente a existência do código/matrícula no Supabase e na base local cadastrada (`nexus_func_list` / `mockEmployees`).
- **Remoção de Botões Indevidos por Cargo em `cargas.html`:** Removida a exibição de botões de ação operacionais para o perfil de Inspetor e cargos sem permissão, garantindo leitura estrita (RF 1).
- **Correção da Contagem de Tempo de Navios em Destino:** Corrigida a exibição de navios no porto de destino que continuavam incrementando tempo fora do porto.

---

## 🟡 3. O que Falta Ser Feito / Planejado (To Do)

- [ ] **Integração Real-time WebSockets do Supabase (`supabase.channel`):** Atualização automática das tabelas sem necessidade de recarregar a página quando múltiplos operadores alteram o pátio simultaneamente.
- [ ] **Upload de Fotos de Avarias no Supabase Storage:** Permissão para anexar foto da avaria do contêiner durante a inspeção do checklist em `inspecao.html`.
- [ ] **Expansão de Relatórios Customizados:** Exportação de dados históricos em formato Excel/CSV para a visão estratégica de Diretores.

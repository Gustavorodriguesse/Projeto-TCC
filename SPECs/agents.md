# AGENTS.md — NexusPort: Sistema de Automação de Carregamentos para Porto

> Instruções obrigatórias para o agente de codificação (Google Jules). Leia este arquivo por inteiro antes de escrever qualquer linha de código.

---

## 1. O que é este projeto

**NexusPort** é um sistema **web interno** para automação de carregamentos em um porto (projeto de TCC). Ele é acessado **exclusivamente por funcionários no ambiente do porto** — nunca por clientes externos, capitães ou pessoas de fora. O objetivo é dar autonomia operacional a cada profissional (registrar/consultar os dados da sua área sem depender de comunicação verbal), mantendo as decisões críticas (liberação de cargas/navios, aprovações) sob hierarquia do Supervisor.

---

## 2. Fontes de verdade no repositório (leia nesta ordem de prioridade)

| Prioridade | Arquivo | O que é |
|---|---|---|
| 1 (regras) | `SPECs/Spec.md` | Especificação funcional completa: requisitos (RF 1–18), regras de negócio (RN 1–19), glossário portuário, não-requisitos. **É a fonte primária.** |
| 2 (plano) | `SPECs/tasks.md` | Decomposição em 9 fases (T1.1 → T9.10) com dependências críticas de execução. **Siga esta ordem.** |
| 3 (dados) | `SPECs/schema.sql` | DDL completo do banco (tabelas, constraints, índices). **Base para o schema no Supabase.** |
| 4 (design) | `SPECs/design/design.md` | Design system "NexusPort" v2.0: tokens de cor, tipografia, componentes, telas-chave, status, responsividade. |
| 5 (referência visual) | `SPECs/design/logo_porto.png` | Logotipo oficial do sistema. |
| — (base visual) | `THEME/*/code.html` | 8 protótipos HTML estáticos de telas (login, RBAC, agendamento/QR, inspeção, pátio, despacho, painel/trail, mobile). |

### Regra de ouro sobre as fontes
- Quando houver conflito, vale a ordem de prioridade acima (Spec.md vence sempre).
- **Os arquivos da pasta `THEME/` são APENAS uma BASE VISUAL de referência.** Não copie o código deles literalmente como arquitetura do sistema — eles são protótipos estáticos em HTML com Tailwind via CDN. Use-os para entender a identidade visual, o layout e a linguagem de componentes, e replique essa identidade no sistema real.

---

## 3. Stack tecnológica obrigatória

- **Front-end: HTML5 + Tailwind CSS + JavaScript (vanilla) — obrigatório.** Não usar React, Next.js, TypeScript ou qualquer framework/bundler. Páginas estáticas `.html`, estilizadas com Tailwind, com lógica em arquivos `.js` separados (ex.: `js/supabase-client.js`, `js/auth.js`, `js/<modulo>.js`).
  - Tailwind via **CDN** (`<script src="https://cdn.tailwindcss.com">`), com configuração inline (`tailwind.config`) portando os tokens de cor/tipografia da seção 7.
  - Navegação entre telas feita com links normais entre páginas `.html`; estado compartilhado via `sessionStorage`/`localStorage` quando necessário.
- **Banco de dados e back-end: Supabase (obrigatório), consumido apenas pelo SDK JS (`@supabase/supabase-js`) no navegador.**
  - **PostgreSQL** do Supabase como banco relacional, criado a partir de `SPECs/schema.sql` (rode o DDL no SQL Editor do Supabase e ajuste tipos/datas para o Postgres).
  - **Row Level Security (RLS)** habilitado em **todas** as tabelas — as 3 camadas de visão (seção 5) devem ser implementadas como políticas RLS no banco, com o SDK respeitando as políticas automaticamente (não apenas checagens no front-end).
  - **Supabase Auth** para sessão (ver modelo de login na seção 6); sessão mantida pelo próprio SDK (`supabase.auth`).
  - **Supabase Storage** para PDFs gerados (relatórios A4 e etiquetas), se aplicável.
  - Credenciais (`SUPABASE_URL` e `SUPABASE_ANON_KEY`) em um arquivo de configuração não versionado (ex.: `js/config.js` listado no `.gitignore`, com `js/config.example.js` no repositório) — **nunca comitar chaves**.
- **QR Code:** biblioteca JS de geração (ex.: `qrcode` / `qr-code-styling`) e leitura via câmera no navegador (ex.: `html5-qrcode` / `jsQR`) — **sem app nativo** (não-requisito 17).
- **PDF:** geração no formato A4 (relatórios) e etiquetas 10×10/10×15 cm — biblioteca JS client-side (ex.: `pdfmake`, `jsPDF`).
- **Gráficos dos dashboards do Diretor:** biblioteca leve via CDN (ex.: Chart.js).
- **Hospedagem: GitHub Pages — obrigatório.** A aplicação (páginas `.html` + assets estáticos) deve ser publicada no GitHub Pages, servida diretamente do repositório. Nada de servidores próprios, Vercel, Netlify ou back-end além do Supabase. Lembre-se das limitações do GitHub Pages: apenas conteúdo estático (nenhuma rota server-side), o que é compatível com o front-end em HTML + Tailwind CDN + SDK JS do Supabase.
- **Chaves do Supabase:** sempre que forem necessárias as credenciais (`SUPABASE_URL` e `SUPABASE_ANON_KEY`) — para criar/atualizar `js/config.js`, rodar testes de integração ou configurar o ambiente — **o agente DEVE pedir as chaves ao usuário antes de prosseguir**, nunca inventar, chumbar valores fictícios no código ou comitar chaves no repositório. A `ANON_KEY` é pública por natureza (a segurança vem do RLS), mas ainda assim só deve ser usada com autorização explícita do usuário.
- Idioma da interface: **pt-BR**. Formatação: datas `dd/mm/aaaa hh:mm`, moeda `R$`, peso em `t`, volume em `m³`, durações `Xd Xh`.

---

## 4. Roadmap de execução (obrigatório)

Execute as fases na ordem e com as dependências definidas em `SPECs/tasks.md`:

```
T1.x (Autenticação) → T2.x (Cadastros Base)
                            ↓
T2.3 (Tipo de Carga) → T3.2 (Agendamento) → T3.x (Fluxo de Cargas)
                            ↓
T2.5 (Navio) + T2.6 (Contêiner) → T3.12 (Vinculação) → T3.16 (Liberação)
                            ↓
T3.1 (Carga) → T5.1 (QR Code) → T5.6 (Leitura QR)
                            ↓
T7.1 (Log) + T7.3 (Trail) → T9.2 (Testes Integração)
```

Resumo das 9 fases:
1. **F1 — Autenticação & RBAC:** login por código individual, cargo travado para confirmação, guard de autenticação, 3 camadas de visão, controle por rota/API.
2. **F2 — Cadastros base (CRUDs):** funcionários, visitantes, tipos de carga, rotas, navios, contêineres, guindastes + atualizações operacionais.
3. **F3 — Fluxo de Cargas (core):** agendamento → recebimento → inspeção/checklist → armazenagem → vinculação → pronta p/ entrega → liberação → trânsito → entregue (+ cancelamento).
4. **F4 — Manutenções & Emergências:** estados de reforma, solicitação/aprovação, histórico, preventiva 3 anos, alarmes.
5. **F5 — QR Code & Etiquetas:** geração única, impressão PDF de etiqueta, reimpressão com log, leitura por câmera com redirecionamento por cargo.
6. **F6 — Dashboards, Pesquisa & Relatórios:** cards operacionais, dashboards do Diretor com gráficos, pesquisa com os 5 filtros exatos, PDF A4 em 4 seções, relatório de produtividade.
7. **F7 — Logs, Trail & Delegação:** log de alterações, trail imutável com retificação, delegação de supervisor.
8. **F8 — Localização & Tempos:** coordenadas fictícias, classificação de localização, cálculos de tempo e estimativa (distância ÷ 33 km/h).
9. **F9 — Testes & Implantação:** unitários das regras de negócio, integração do fluxo completo, segurança (RLS), QR, PDF.

---

## 5. Modelo de permissões — 3 camadas de visão (RF 1)

Implemente com **RLS do Supabase** + guards no front-end. Hierarquia:

| Camada | Quem | Acesso |
|---|---|---|
| **Visão Própria** | Todos os cargos | Apenas entidades diretamente ligadas às suas atribuições (ex.: Estivador vê só as cargas que selecionou; Conferente vê só seus lançamentos). |
| **Visão Operacional** | Inspetor e Supervisor | Leitura de todos os dados operacionais dos cargos inferiores (cargas, navios, contêineres, manutenções, checklists, logs, trail). **Sem** acesso a documentação interna de funcionários e visitantes; **sem** editar dados de outros cargos. |
| **Visão Estratégica** | Diretor (3 cargos) | Leitura total + dashboards exclusivos com gráficos + exportação de históricos. |

Cargos e níveis (glossário do Spec.md): Estivador, Conferente de Carga, Arrumador e Consertador, Planejador de Pátio e de Navios, Técnico em Portos (operacional) → Inspetor (tático) → Supervisor/Gerente de Operações (gestão) → Diretor de Operações e Logística, Diretor-Presidente/Superintendente, Conselho de Administração (estratégico).

Ações por cargo (resumo — detalhe em Spec.md RF 1): cada operacional só executa suas ações; o Técnico em Portos gerencia funcionários, visitantes e reemissão de código; o Inspetor inspeciona com checklist, cadastra navios/contêineres/guindastes e aciona alarmes; o Supervisor libera/bloqueia saídas, cancela com motivo, aprova manutenções, cadastra rotas/tipos de carga, registra chegada de navios e delega substituto; o Diretor consome dashboards e exporta.

---

## 6. Autenticação (RF 1 / T1.1–T1.3)

- Login **apenas pelo código individual único** vinculado à matrícula (ex.: `NX-8821-SP`). Campo de entrada em fonte monoespaçada.
- O **cargo é resolvido automaticamente pelo sistema** e exibido **desabilitado/travado, apenas para confirmação** — nunca selecionável.
- Código inválido → mensagem genérica de credencial inválida.
- Perda/esquecimento (RN 15 / T1.8): o **Técnico em Portos** invalida o código e gera um novo vinculado à mesma matrícula.
- Toda sessão identifica **cargo + código individual** em todos os logs e no trail.
- Estratégia no Supabase: tabela de credenciais com hash do código (nunca em claro) e vínculo ao funcionário; sessão via Supabase Auth; claims/policies RLS derivadas do cargo. Implemente rate limiting/brute-force protection básica no endpoint de login.

---

## 7. Identidade visual (baseada em `THEME/` + `SPECs/design/design.md`)

**Use os protótipos da pasta `THEME/` como BASE de design — não como código final.** Replique a identidade no Tailwind do projeto:

### Tokens de cor
| Token | Hex | Uso |
|---|---|---|
| `nexus-900` | `#1E293B` | Sidebar, fundo de login, cabeçalhos, texto de destaque |
| `nexus-500` | `#445987` | Botões primários, links, abas ativas, ícones de destaque |
| `nexus-border` | `#E1E5ED` | Bordas, divisores, linhas de tabela |
| `nexus-bg` | `#F5F7FA` | Fundo de páginas |
| `nexus-text` | `#222222` | Texto principal |
| Semânticas | `#2E7D32` (success) · `#D97706` (warning) · `#C62828` (danger) | Status conforme tabela de badges do design.md §4 |

### Tipografia
- **Títulos:** Montserrat 600–700. **Texto:** Inter 400–600. **Dados/códigos (código individual, IMO, nº de contêiner, coordenadas, timestamps):** JetBrains Mono. Escala: display 32 / h1 28 / h2 24 / h3 20 / h4 18 / body 16 / body-sm 14 / caption 12.

### Layout e navegação
- Sidebar **escura `#1E293B` (240px, retrátil para 64px)**, itens em branco 70%, ativo com fundo `#445987`. Menu **filtrado por cargo**.
- Topbar branca 64px: contexto da tela à esquerda; à direita cargo + código individual (monoespaçado) e botão sair.
- Grid 12 colunas, gutter 24px, container máx. 1440px, espaçamentos múltiplos de 4px, radius: 4px tags / 8px botões-inputs / 12px cards / 16px painéis.
- Ícones: família **Lucide** (ou Phosphor).

---

## 8. Diretrizes de UI/UX (OBRIGATÓRIAS)

1. **Mínima poluição visual:** cada página tem **um objetivo claro**; use bastante espaço em branco, hierarquia tipográfica forte e remova qualquer elemento que não ajude a tarefa. Evite decoração excessiva.
2. **Páginas bem divididas:** uma funcionalidade por página/rota; use tabs apenas dentro de fichas (ex.: ficha da carga: Dados · Vínculos · Inspeção · Histórico · Relatório). Não empilhe módulos diferentes na mesma tela.
3. **Design corporativo:** tom institucional, sóbrio e profissional; badges de status discretos; tabelas limpas com cabeçalho `#F5F7FA` e linhas separadas por `#E1E5ED`.
4. **Sem sistema de notificações/alertas/toasts persistentes** (não-requisito 5). Feedback por **banner inline** no topo do conteúdo (fundo semântico a 8%, borda esquerda 3px), fechável, que some ao trocar de tela.
5. **Ações críticas SEMPRE com modal de confirmação:** liberação de navio, cancelamento de entrega, aprovação/recusa de manutenção, recusa de carga, designação de substituto. O modal resume o impacto (ex.: "libera automaticamente N cargas vinculadas") e exige motivo quando a Spec o exige.
6. **Empty states e loading:** ilustração neutra + ação sugerida; skeletons em `#E1E5ED`.
7. **Acessibilidade:** contrates AA/AAA conforme tabela do design.md §3.3; alvos de toque **≥ 44px**; nenhuma ação dependente de hover.
8. **Terminologia:** usar exclusivamente os termos do glossário da Spec (Estivador, Conferente, Contêiner, IMO, Porto de Descarga, Trail de Decisões etc.).

---

## 9. Responsividade (obrigatória)

- Breakpoints: **576 / 768 / 1024 / 1440px**.
- **Mobile first para o pátio** (< 768px): sidebar vira drawer; tabelas viram cards empilhados; ações do cargo fixas na parte inferior da tela; botões grandes para uso com luvas; alvos ≥ 44px.
- Referência: `THEME/pilar_7_opera_o_de_p_tio_em_campo_leitura_mobile/code.html` (bottom nav com botão central de scanner) e `THEME/login_autentica_o_operacional_t2.1_t2.2/code.html`.
- Toda ação também acessível por toque (sem hover obrigatório).

---

## 10. Dark mode (obrigatório)

O design.md lista dark mode como opcional/fase 2 — **neste projeto ele é requisito**. Implemente:

- **Toggle claro/escuro** persistente (localStorage + preferência do sistema), aplicado pela estratégia `class` do Tailwind (`darkMode: "class"`).
- Paleta dark (design.md §12): fundo `#0F172A`, superfícies `#1E293B`, texto `#F5F7FA`, primário clareado `#5B70A3`, bordas em tom escuro equivalente.
- Todos os componentes (tabelas, cards, modais, formulários, badges) devem ter variantes dark testadas; QR Code e PDFs permanecem sempre monocromáticos preto `#222222` sobre branco (impressão térmica).

---

## 11. Regras de negócio críticas (não quebrar — RN do Spec.md)

- Fluxo da carga: **Agendado → Recebido → Em inspeção → (Aprovado → Armazenado) ou (Recusado c/ motivo) → Pronto para entrega → Liberado/Saída → Em trânsito → Entregue**; **Cancelado** só a partir de Agendado/Armazenado/Pronto, com motivo obrigatório.
- **Só o Supervisor** libera saída de cargas e navios; liberar o navio libera automaticamente todos os contêineres/cargas vinculados.
- **Navio em reforma ou agendado para reforma não recebe carga** (selo discreto na ficha).
- Agendamento só com Tipo de Carga já cadastrado com checklist; carga sem agendamento tem aceitação negada no recebimento.
- Inspetor só aprova carga se **todos os itens críticos do checklist estiverem "Conforme"**.
- Estimativa de chegada = distância da rota ÷ **33 km/h**; **sem rota cadastrada, bloqueia a liberação** do navio.
- Propagação: mudança de estado/localização do navio/contêiner reflete nas cargas vinculadas; dados cadastrais não propagam.
- Manutenção preventiva sugerida a cada **3 anos** (do cadastro ou da última manutenção) — exibida como card no dashboard, **nunca como alarme**.
- **Trail de decisões é imutável**; retificações são anexadas ao registro original (que nunca é editado).
- QR Code de carga/contêiner: gerado **automaticamente e unicamente** no 1º cadastro; reimpressão reproduz o mesmo código e gera log.
- Leitura de QR exige sessão autenticada; scan registrado (funcionário, data/hora, entidade).
- Delegação: apenas **1 substituto ativo por Supervisor**, com vigência e revogação antecipada.
- Pesquisa: **exatamente** os filtros nome do navio, nº do contêiner, tipo de carga, período e status do fluxo (sem filtros extras).
- Relatório PDF A4 em **4 seções sequenciais**: Dados da Carga · Dados do Navio · Dados do Contêiner · Resumo do Fluxo.
- Localização do navio: `DENTRO_DO_PORTO` / `FORA_DO_PORTO` / `NO_PORTO_DE_DESTINO` — coordenadas fictícias, **sem mapa**.
- Carga "Entregue" quando navio = `NO_PORTO_DE_DESTINO` ou confirmação do Supervisor.
- **Não fazer** (não-requisitos): notificações, app nativo, mapa, módulo financeiro, estado "Embarcada", cálculo de capacidade/lotação, gestão de escalas.

---

## 12. Definição de pronto (DoD) para cada tarefa

- [ ] Código em HTML + Tailwind CSS + JavaScript vanilla (sem frameworks), organizado em páginas e módulos `js` reutilizáveis (cliente Supabase centralizado em `js/supabase-client.js`).
- [ ] Regras de negócio da seção 11 cobertas por testes unitários (F10).
- [ ] RLS aplicado e testado para as 3 camadas de visão (usuário de um cargo não enxerga dados de outro).
- [ ] UI seguindo as seções 7, 8, 9 e 10 (tokens NexusPort, mínima poluição visual, responsivo, dark mode).
- [ ] Ações críticas com modal de confirmação; logs e trail gravando cargo + código individual.
- [ ] Formatação pt-BR (datas, moeda, unidades).
- [ ] Nenhum segredo comitado (apenas `js/config.example.js` no repositório; `js/config.js` no `.gitignore`).
- [ ] Commit messages claros referenciando o código da tarefa (ex.: `T3.16 — liberação de navio com propagação para cargas vinculadas`).
- [ ] Aplicação publicada e funcionando no GitHub Pages ao final de cada fase (deploy no branch configurado, ex.: `gh-pages` ou `main` com GitHub Actions).

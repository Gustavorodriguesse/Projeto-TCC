# NexusPort — Design System

**Sistema de Automação de Carregamentos para Porto**

Versão 2.0 · 11/09/2026 · Alinhado à `Spec.md`

---

## 1. Visão geral e contexto de uso

Sistema **web interno**, acessado exclusivamente por funcionários no ambiente do porto — sem acesso de clientes externos, capitães ou pessoas de fora. Implicações diretas de design:

- **Autenticação por código individual** vinculado à matrícula; o cargo é exibido apenas para confirmação (não selecionável).
- **Uso em pátio com celular/tablet:** telas operacionais (estivador, conferente, inspetor, arrumador) devem funcionar bem em telas pequenas, com alvos de toque grandes, sem necessidade de app nativo — a leitura de QR Code ocorre via navegador.
- **Sem sistema de notificações/alertas instantâneos** (não-requisito 5). Feedback ao usuário é dado por mensagens inline na tela, e os dashboards são **visão geral operacional, não painel de alarmes**.
- **Tudo é auditável:** logs de alterações e trail de decisões imutável. Toda ação crítica exige confirmação explícita e identifica cargo + código individual.
- **Terminologia:** usar exclusivamente os termos do glossário da Spec (Estivador, Conferente, Contêiner, IMO, Porto de Descarga, Trail de Decisões etc.).

---

## 2. Tipografia

| Papel | Fonte | Peso | Uso |
| --- | --- | --- | --- |
| Títulos | Montserrat | 700 (Bold) | Títulos de página, seções, cards de dashboard |
| Subtítulos | Montserrat | 600 (SemiBold) | Hierarquia intermediária, nomes de entidades |
| Texto corrido | Inter | 400 (Regular) | Parágrafos, descrições, labels |
| Dados | Inter | 500 (Medium) | Tabelas, valores, metadados |
| Ênfase | Inter | 600–700 | Negrito em texto, ações em lista |
| Monoespaçada | JetBrains Mono ou similar | 500 | Códigos individuais, númer de contêiner, IMO, coordenadas GPS, timestamps em logs |

### Escala (base 16px)

| Token | Fonte | Tamanho | Peso | Uso |
| --- | --- | --- | --- | --- |
| `display` | Montserrat | 32px | 700 | Valores grandes de dashboard |
| `h1` | Montserrat | 28px | 700 | Título de página |
| `h2` | Montserrat | 24px | 700 | Título de seção |
| `h3` | Montserrat | 20px | 600 | Título de card / bloco |
| `h4` | Montserrat | 18px | 600 | Subseção |
| `body` | Inter | 16px | 400 | Texto padrão |
| `body-sm` | Inter | 14px | 400 | Texto secundário |
| `caption` | Inter | 12px | 500 | Metadados, timestamps, ajuda |

- Line-height 1,5 (texto) / 1,2 (títulos). Montserrat só em títulos; Inter nunca em títulos de página.

---

## 3. Paleta de cores

### 3.1 Cores principais (identidade — Adobe Color Theme)

| Token | Hex | Papel | Onde usar |
| --- | --- | --- | --- |
| `--nexus-900` | `#1E293B` | Azul-marinho escuro | Sidebar, fundo de login, cabeçalhos de tabela, rodapé de relatórios, texto de destaque sobre fundo claro |
| `--nexus-500` | `#445987` | Azul primário | Botões primários, links, abas ativas, ícones de destaque, gráficos primários |
| `--nexus-border` | `#E1E5ED` | Cinza-azulado | Bordas, divisores, linhas de tabela, estados inativos. **Nunca texto** (contraste 1,26:1) |
| `--nexus-bg` | `#F5F7FA` | Cinza claro | Fundo de páginas, linhas zebradas, seções de respiro |
| `--nexus-text` | `#222222` | Quase-preto | Texto principal sobre fundos claros |

| Token | Hex | Uso |
| --- | --- | --- |
| `--nexus-white` | `#FFFFFF` | Cards, modais, inputs; texto sobre superfícies escuras |
| `--nexus-500-hover` | `#3A4A73` | Hover de botões/links primários |
| `--nexus-500-active` | `#30405F` | Estado pressed |
| `--nexus-900-soft` | `#1E293B` @ 8% | Hover de linhas, fundos de seleção sutil |

### 3.2 Cores semânticas (proposta — pendente de validação)

| Token | Hex | Significado operacional |
| --- | --- | --- |
| `--success` | `#2E7D32` | Concluído, operante, aprovado, entregue |
| `--warning` | `#D97706` | Em andamento, aguardando, agendado, atenção |
| `--danger` | `#C62828` | Recusado, cancelado, bloqueado, crítico não conforme |
| `--info` | `#445987` | Reutiliza o azul primário para neutros informativos |

Derivações permitidas: tons a 8–12% de opacidade para fundos de badges e alertas; `--warning-strong` `#B45309` para diferenciar "em reforma" de "agendado".

### 3.3 Contraste (WCAG)

| Combinação | Razão | Nível |
| --- | --- | --- |
| `#222222` / `#F5F7FA` | 14,82:1 | AAA |
| `#1E293B` / `#FFFFFF` | 14,63:1 | AAA |
| Branco / `#1E293B` | 14,63:1 | AAA |
| Branco / `#445987` | 6,94:1 | AA |
| Branco / `--success` | 5,22:1 | AA |
| Branco / `--warning` | 3,31:1 | ⚠️ usar texto `#222222` sobre badges âmbar, ou âmbar só em ícones/bordas |
| Branco / `--danger` | 6,12:1 | AA |

---

## 4. Tokens de status (alinhados à Spec)

Badges padrão: fundo = cor @ 12%, texto = cor sólida, radius 999px, Inter 600 12px, padding 4px 10px. Texto sempre em caixa normal (ex.: `Armazenado`, `Em trânsito`).

### 4.1 Fluxo da Carga (RF 6)

| Status | Cor | Lógica |
| --- | --- | --- |
| `Agendado` | info `#445987` | Aguardando chegada ao porto |
| `Recebido` | `#1E293B` | Recebimento físico lançado pelo Conferente |
| `Em inspeção` | warning `#D97706` | Inspetor preenchendo checklist |
| `Recusado` | danger `#C62828` | Com motivo obrigatório; fica sem gestão de destino |
| `Armazenado` | neutro: fundo `#E1E5ED`, texto `#1E293B` | Em estoque no pátio |
| `Pronto para entrega` | destaque `#1E293B` (fundo sólido, texto branco) | Aguardando liberação do Supervisor |
| `Liberado / Saída do porto` | success `#2E7D32` | Navio liberado; data/hora e destino registrados |
| `Em trânsito` | warning `#D97706` | Fora do porto em direção ao destino |
| `Entregue` | success `#2E7D32` | `NO_PORTO_DE_DESTINO` ou confirmação do Supervisor |
| `Cancelado` | danger `#C62828` (com motivo) | Somente de Agendado, Armazenado ou Pronto p/ entrega |

> Estados transitórios de vinculação (carga → contêiner → navio) **não** geram badge: são exibidos como linha de vínculo na ficha da carga (não-requisito 15).

### 4.2 Navio / Contêiner (RF 3)

| Estado | Cor |
| --- | --- |
| `Operante` | success `#2E7D32` |
| `Aprovado para reforma` | info `#445987` |
| `Agendado para reforma` | warning `#D97706` |
| `Em reforma` | warning-strong `#B45309` |

Regra visual: navio em reforma ou agendado para reforma exibe selo discreto "Não pode receber carga" na ficha (RN 1 e 2).

### 4.3 Localização do navio (RF 8)

| Localização | Cor |
| --- | --- |
| `DENTRO_DO_PORTO` | success `#2E7D32` |
| `FORA_DO_PORTO` | info `#445987` |
| `NO_PORTO_DE_DESTINO` | success escuro `#1B5E20` |

Exibida com ícone de âncora + coordenadas em monoespaçada. Sem mapa (não-requisito 3).

### 4.4 Manutenção

| Situação | Cor |
| --- | --- |
| Preventiva sugerida (> 3 anos, RN 11) | warning `#D97706` — exibida como card no dashboard, **nunca como alarme** |
| Manutenção em aprovação / recusada | info / danger conforme decisão do Supervisor no trail |

---

## 5. Layout e navegação

- **Grid:** 12 colunas, gutter 24px, container máx. 1440px.
- **Espaçamento:** múltiplos de 4px (4, 8, 12, 16, 24, 32, 48, 64).
- **Radius:** 4px (tags), 8px (botões, inputs), 12px (cards, modais), 16px (painéis).
- **Sidebar** (240px, colapsável para 64px): fundo `#1E293B`; itens em branco @ 70%; item ativo com fundo `#445987` e texto branco; menu filtrado **por cargo** — cada funcionário vê apenas as funcionalidades da sua visão (própria / operacional / estratégica).
- **Topbar** (64px): fundo `#FFFFFF`, borda inferior `#E1E5ED`; à esquerda o contexto da tela (Montserrat 600, `#1E293B`); à direita: cargo + código individual do usuário (monoespaçado, caption) e sair.
- **Conteúdo:** fundo `#F5F7FA`, páginas com título `h1` + ação principal no canto superior direito.

---

## 6. Componentes

### 6.1 Botões

| Variante | Fundo | Borda | Texto | Uso |
| --- | --- | --- | --- | --- |
| Primário | `#445987` | — | `#FFFFFF` | Ação principal da tela |
| Secundário | `#FFFFFF` | 1px `#E1E5ED` | `#1E293B` | Ações alternativas |
| Fantasma | transparente | — | `#445987` | Ações terciárias |
| Perigo | `#C62828` | — | `#FFFFFF` | Cancelar entrega, recusar — **sempre com modal de confirmação** |
| Desabilitado | `#F5F7FA` | 1px `#E1E5ED` | `#445987` @ 50% | Não interativo |

Radius 8px · padding 10px 20px · Inter 600 14–16px · alvo mínimo **44px de altura** (toque no pátio).

### 6.2 Formulários

- Input: fundo `#FFFFFF`, borda `#E1E5ED`, radius 8px; foco com borda `#445987` + anel 2px @ 20%.
- Erro: borda `#C62828`, mensagem Inter 12px na mesma cor.
- Label Inter 500 14px `#222222`; placeholder `#1E293B` @ 55%.
- **Campos de data/hora** com picker nativo + máscara `dd/mm/aaaa hh:mm` (RF 5, problema 5).
- Campos obrigatórios da carga (RN 13): peso, volume, valor declarado, natureza, tipo, porto de descarga — marcados com `*`.

### 6.3 Cards

Fundo `#FFFFFF`, borda 1px `#E1E5ED`, radius 12px, sombra opcional `0 1px 3px rgba(30,41,59,.08)`. Título Montserrat 600 18px `#1E293B`.

### 6.4 Tabelas

- Cabeçalho: fundo `#F5F7FA`, Inter 600 13px `#1E293B`.
- Linhas: separadores 1px `#E1E5ED`; hover `#1E293B` @ 5%; linha selecionada `#445987` @ 10%.
- Código individual, IMO e nº de contêiner em coluna monoespaçada.
- Paginação e busca sempre visíveis quando houver mais de 10 registros.

### 6.5 Mensagens de feedback (sem notificações — RN/RF)

Após toda ação de escrita: banner inline no topo do conteúdo, cor semântica a 8% de fundo com borda esquerda 3px, texto `#222222`, título Montserrat 600. Fechável, some ao trocar de tela. Nunca usar toast flutuante persistente.

### 6.6 Modal de confirmação

Obrigatório para: liberação de navio, cancelamento de entrega, aprovação/recusa de manutenção, recusa de carga, designação de substituto. Estrutura: título Montserrat 700 → resumo do impacto (ex.: "Esta ação libera automaticamente 12 cargas vinculadas", RN 3) → campo de motivo quando exigido pela Spec → botões `Confirmar` (primário/perigo) e `Voltar` (secundário).

### 6.7 Timeline (Trail de Decisões — RF 13)

- Lista vertical com linha `#E1E5ED`, nó circular na cor do cargo ou da decisão.
- Cada entrada: decisão (Montserrat 600), quem (cargo + código individual, monoespaçado), data/hora, entidade afetada.
- **Retificações** aparecem anexadas abaixo do registro original, que nunca é editado. Registros são visualmente marcados como imutáveis (sem hover de edição).

### 6.8 Empty states e carregamento

- Sem dados: ilustração neutra em `#E1E5ED`, título Montserrat 600 16px e uma ação sugerida (ex.: "Nenhuma carga agendada — Agendar carga").
- Carregamento: skeletons em `#E1E5ED` sobre `#FFFFFF`.

---

## 7. Dashboards (RF 7)

Card padrão: ícone 24px dentro de círculo 48px (fundo = cor semântica @ 12%), título Inter 500 14px, valor principal Montserrat 700 32px `#1E293B`. Card inteiro é clicável → página de detalhe.

- **Tom geral neutro e informativo** — os cards não são alarmes: usar azul/info como cor base por padrão; cores semânticas apenas quando o indicador já é intrinsecamente um status (ex.: cargas recusadas em danger).
- Cards da Spec: navios em manutenção, navios fora do porto, cargas em armazenagem, cargas prontas p/ entrega aguardando liberação, cargas recusadas, ocupação do pátio, navios com preventiva sugerida (> 3 anos).
- Atualização diária ou horária (nunca em tempo real).
- **Diretor (RF 8 nível estratégico):** além dos cards, seção de gráficos — taxa de aprovação/recusa, tempo médio de permanência, navios mais utilizados, produtividade por cargo. Estilo: barras em `#445987`, linhas em `#1E293B`, fundo de grade `#E1E5ED`.

---

## 8. Telas-chave da Spec

### 8.1 Login

Fundo `#1E293B` com logotipo centralizado. Card branco (radius 16px): campo **Código individual** (monoespaçado); após validação, campo **Cargo** exibido desabilitado apenas para confirmação (RF 1 — não é selecionável); botão primário "Entrar". Erro de código: mensagem genérica de credenciais inválidas.

### 8.2 Ficha da Carga

Cabeçalho: nº da carga (monoespaçado) + badge de status (seção 4.1) + ações permitidas ao cargo atual. Corpo em abas: **Dados** (tipo, quantidade, peso, volume, valor declarado, natureza, porto de descarga) · **Vínculos** (contêiner → navio, como linha de encadeamento; sem badge de status, RN 15) · **Inspeção** (checklist + decisão) · **Histórico** (log de alterações + trail filtrado por esta carga) · **Relatório** (gerar PDF).

### 8.3 Checklist de inspeção (RF 9)

- Abre automaticamente ao escanear o QR da carga (RF 17.3).
- Itens agrupados; cada item: descrição + opção `Conforme` / `Não conforme` / `Não se aplica` + observação.
- **Itens críticos** marcados com selo "Crítico" (danger) e bloqueiam aprovação se não conformes (RN 14) — barra de progresso mostra % de itens respondidos.
- Rodapé fixo com resultado: `Aprovar carga` (primário, habilitado só sem críticos pendentes) / `Recusar carga` (perigo, abre modal com motivo obrigatório em texto livre).

### 8.4 Liberação pelo Supervisor

Tela de fila "Aguardando liberação" (cargas `Pronto para entrega` + navios com cargas vinculadas). Cada linha expande para mostrar cargas/contêineres afetados. Liberação de navio exige modal informando que libera **todos** os contêineres e cargas vinculados (RN 3) e bloqueia se não houver rota cadastrada para origem/destino (RN 9).

### 8.5 Pesquisa (RF 10)

Barra de filtros única com exatamente: nome do navio, nº do contêiner, tipo de carga, período (data inicial–final), status do fluxo. Sem filtros avançados extras (não-requisito 14). Resultados em tabela com badge de status.

### 8.6 Relatório PDF A4 (RF 11)

- Papel A4, margens 20mm, fontes Montserrat/Inter embutidas.
- Cabeçalho: logotipo + "NexusPort — Relatório de Carga" + nº da carga; rodapé: código individual de quem gerou + data/hora de geração + paginação.
- **Seções sequenciais obrigatórias:** 1) Dados da Carga · 2) Dados do Navio (nome, IMO, origem, destino) · 3) Dados do Contêiner · 4) Resumo do Fluxo (status, datas, porto de descarga, motivo de recusa se houver).
- Títulos de seção Montserrat 700 com número e linha divisória `#E1E5ED`; dados em tabela Inter 400/500; selo de status colorido apenas na seção 4.

### 8.7 Etiqueta de QR Code (RF 17)

- **Tela:** após cadastro de carga/contêiner, exibir QR gerado em tempo real com botão **Imprimir Etiqueta**; reimpressão disponível na ficha (loga "Reimpressão de etiqueta", RN 18).
- **Etiqueta 10×10 cm (ou 10×15):** QR centralizado (módulo preto `#222222` puro sobre branco — **sempre monocromático**, pensado para impressora térmica), abaixo o nº da carga/contêiner em texto grande (Inter 700 28–32px), e opcionalmente tipo de carga + data de recebimento em Inter 500 12px.
- Leitura exige sessão autenticada (RN 19); scans são registrados com cargo + código + data/hora.

### 8.8 Leitura QR no pátio

Na home da área logada, botão flutuante **"Escanear"** (acessa a câmera via navegador). Ao ler: abre direto a ficha da entidade com as ações do cargo já em destaque (ex.: conferente → botão "Registrar recebimento").

---

## 9. Formatação de dados

- Datas/horas: `dd/mm/aaaa hh:mm` em fuso local do porto; durações: `Xd Xh`.
- Dinheiro: `R$ 1.234.567,89`. Peso: toneladas `t`. Volume: `m³`.
- Coordenadas: `-23.9812°, -46.2978°` em monoespaçada.
- IMO e nº de contêiner: monoespaçado, sempre visíveis em fichas e tabelas.

---

## 10. Ícones

Família **Lucide** ou **Phosphor** (traço 1,5–2px): âncora (navio), caixa/contêiner, guindaste, guindaste-com-aviso (manutenção), checklist, QR Code, usuário-tie (visitantes), escudo (inspetor), gráficos (diretor). Cor padrão `#1E293B` sobre claro; branco sobre `#1E293B`.

---

## 11. Responsividade e uso em pátio

- Breakpoints: 576 / 768 / 1024 / 1440px.
- Em telas < 768px (celular no pátio): sidebar vira drawer; tabelas viram cards empilhados; botões de ação do cargo ficam fixos na parte inferior da tela; alvos de toque ≥ 44px.
- Nada de hovers obrigatórios para ações — toda ação também acessível por toque.

---

## 12. Modo escuro (fase 2 — opcional)

Fora do escopo inicial. Se implementado: fundo `#0F172A`, superfícies `#1E293B`, texto `#F5F7FA`, primário clareado para `#5B70A3`.

---

## 13. Validações pendentes

1. **Papéis das cores principais** — confirmar uso de `#1E293B` na sidebar/login e `#445987` como ação primária.
2. **Cores semânticas** (`#2E7D32` / `#D97706` / `#C62828`) são proposta minha, pois o tema Adobe não as traz — confirmar ou fornecer as oficiais.
3. **Modo escuro** fica fora do escopo inicial?
4. Família de ícones (Lucide/Phosphor) atende, ou há preferência por outra?
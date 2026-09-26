# Backlog 001 de Correções e Ajustes — Sistema de Gestão Portuária

> Documento de requisitos para implementação via Jules. Todas as alterações devem ser feitas com dados reais do banco de dados (Supabase), sem dados fictícios e sem armazenamento local. Toda e qualquer alteração no sistema deve ser devidamente registrada em um relatório de execução do backlog (ex.: `relatorio-backlog-001.md` / `relatorio-backlog.md`).

---

## 🐞 Seção de Correções

### C1 — Remover seleção inútil no botão "Movimentar" (Cargas e Pátio)
- **Problema:** Ao clicar em "Movimentar", o sistema exibe as opções "Em Carregamento / Parado / Concluído", que são inúteis e não funcionais.
- **Correção:** Ao clicar em "Movimentar", devem aparecer os **berços**, mostrando quais estão disponíveis e para qual berço a carga deve ser levada.

### C2 — Exibir berço da carga em Embarcações e GPS
- **Problema:** Em "Embarcações e GPS" as cargas aparecem, mas sem informação de qual berço estão.
- **Correção:** Exibir em qual berço cada carga está. No botão "Movimentar" da página Cargas e Pátio, deve aparecer a opção de transportar a carga do berço para o navio escolhido.

### C3 — Exibir contêiner vinculado em Embarcações e GPS
- **Problema:** Na página Cargas e Pátio aparece o contêiner da carga, mas em Embarcações e GPS não aparece a qual contêiner está vinculado.
- **Correção:** Exibir o contêiner vinculado (apenas contêineres vinculados que estão no banco de dados).

### C4 — Substituir `alert()` do botão "Vincular" por modal
- **Problema:** O botão "Vincular" usa `alert()` para digitar contêiner e navio.
- **Correção:** Exibir um **modal centralizado** listando todos os contêineres (disponíveis e indisponíveis) e navios (disponíveis e indisponíveis), com seleção visual do desejado para vincular a carga.

### C5 — Conflito de dados: liberação de navio vs. status no porto
- **Problema:** No "Trail de decisões críticas" do Painel Geral consta que um funcionário liberou um navio, mas em Embarcações e GPS o mesmo navio consta como "dentro do Porto". Há conflito de dados.
- **Correção:** Tornar o **Diretor de Operações e Logística** o único responsável pela liberação de navios, na página Embarcações e GPS, garantindo sincronização dos dados entre as telas.

### C6 — ETA e tempo fora do Porto não atualizam em tempo real
- **Problema:** A estimativa de ETA foi calculada com base em velocidade média fixa e não se atualiza; o "tempo fora do Porto" também não acompanha o tempo real.
- **Correção:** Conectar ETA e tempo fora do Porto ao **tempo real**, atualizando continuamente.

### C7 — Gráfico "Embarcações mais utilizadas" com dados fictícios
- **Problema:** O gráfico usa informações fictícias.
- **Correção:** Gerar o gráfico com os dados originais do sistema (banco de dados).

### C8 — Gráfico "Produtividade Operacional por Cargo" desconectado
- **Problema:** O gráfico não reflete a realidade operacional.
- **Correção:** Vincular o gráfico à **quantidade de mudanças realizadas por cada cargo durante o mês**.

### C9 — Cargas canceladas permanecem na tabela principal
- **Problema:** Cargas canceladas não saem da tabela principal.
- **Correção:** Ao cancelar uma carga, ela deve **voltar ao berço**, sair da tabela principal de cargas e entrar em uma **tabela separada de cargas canceladas**.

### C10 — Status "Entregue" definido manualmente
- **Problema:** A carga pode ser marcada como entregue manualmente (botão), independentemente da posição do navio.
- **Correção:** Todas as cargas vinculadas a um navio devem ter status **"entregue" automaticamente** quando o sistema detectar que o navio chegou ao porto de destino. Não deve existir botão manual de "entregue" — a entrega só ocorre com a chegada real do navio ao destino.

### C11 — Dados fictícios e armazenamento local no sistema
- **Problema:** O sistema contém dados fictícios e dados armazenados localmente.
- **Correção:** Remover **todos** os dados fictícios e qualquer armazenamento local (localStorage, arquivos estáticos etc.). Todos os dados (funcionários, cargas, contêineres, navios etc.) devem vir do **Supabase**.

### C12 — Informações de teste no sistema
- **Problema:** Há informações de teste presentes no sistema.
- **Correção:** Remover todas as informações de teste. Apenas dados cadastrados devem existir, evitando códigos repetidos.

### C13 — Funcionários fora do CRUD / sem matrícula única
- **Problema:** Existem funcionários no sistema que não estão devidamente cadastrados.
- **Correção:** Manter no CRUD de funcionários apenas os funcionários devidamente cadastrados no banco de dados; os demais devem ser cadastrados, cada um com sua **matrícula única**.

### C14 — Documento de visitante repetido
- **Problema:** Na gestão de pessoas (registrar visitantes), o documento do visitante pode ser repetido.
- **Correção:** Impedir cadastro de visitantes com documento duplicado — cada pessoa possui seu próprio documento único (validação no banco de dados).

### C15 — Período de referência de Relatórios & PDF com data fixa
- **Problema:** O período de referência dos relatórios não segue a data real.
- **Correção:** O período de referência dos relatórios e PDFs deve seguir a **data da vida real**.

### C16 — Remover botão de "Desocupar Berço" sem movimentação física
- **Problema:** No painel de berços em cargas (`cargas.html` / `cargas.js`), existe o botão "Desocupar Berço" (`liberarBercoManualmente`), que libera o berço instantaneamente sem movimentar a carga ou navio.
- **Correção:** Remover o botão de liberação manual instantânea. O berço só é desocupado quando a carga/embarcação for **movimentada fisicamente** (transportada para navio/contêiner ou removida por movimentação de pátio).

### C17 — Impedir carga em trânsito ou saída sem vincular a contêiner e navio
- **Problema:** O sistema permite avançar cargas para o status "SAIDA" ou "EM_TRANSITO" sem que estejam vinculadas simultaneamente a um contêiner e a um navio.
- **Correção:** Bloquear qualquer avanço para saída ou trânsito caso a carga não possua vinculação obrigatória com contêiner e navio (Regra A6 e SPEC 6.4).

### C18 — ETA e tempo fora do Porto estáticos (falta de atualização em tempo real)
- **Problema:** Em Embarcações e GPS, quando o navio está fora do porto, o ETA e o tempo fora do porto são exibidos com valores estáticos ou calculados uma única vez.
- **Correção:** Conectar o cálculo de ETA e o tempo fora do porto a um **relógio em tempo real** (`setInterval`), atualizando continuamente a contagem regressiva e decorrida com base na data/hora real de saída (`data_saida`), distância da rota (`rotas_maritimas`) e velocidade de 33 km/h (RN 9).

### C19 — Conectar todas as 22 tabelas do `schema.sql` ao Supabase (Tabelas Sem Uso)
- **Problema:** Tabelas criadas no `schema.sql` estão sem uso ou foram substituídas por constantes estáticas e `localStorage` (`cargo_niveis`, `tipos_carga`, `checklist_modelos`, `checklist_itens`, `rotas_maritimas`, `estivador_cargas`, `inspecao_itens`).
- **Correção:** Conectar todas as 22 tabelas do esquema PostgreSQL no Supabase, garantindo que checklists, modelos, itens de inspeção, níveis de acesso, rotas marítimas, atribuições do estivador e auditorias venham e sejam salvas exclusivamente no Supabase.

### C20 — Registros de inspeção técnica detalhados por item (`inspecao_itens`)
- **Problema:** A inspeção técnica de carga salva apenas o resultado final na tabela `inspecoes` e ignora o salvamento dos itens individuais do checklist.
- **Correção:** Gravar a resposta de conformidade e observações de cada item na tabela `inspecao_itens` do Supabase para cada checklist preenchido.

### C21 — Registrar leituras de QR Code no Supabase (`leituras_qr_code`)
- **Problema:** A leitura de QR Code registra logs no `localStorage` (`nexus_audit_logs`).
- **Correção:** Persistir cada evento de leitura de QR Code diretamente nas tabelas `leituras_qr_code` e `logs_alteracoes` do Supabase com o ID do funcionário autenticado e data/hora.

### C22 — Relatórios e PDF com layout de 4 seções e data real atual
- **Problema:** Os relatórios em PDF leem dados do `localStorage` e possuem datas de referência fixas.
- **Correção:** Carregar os dados do Supabase, definir o período de referência com a data/hora real da geração e formatar o documento PDF nas 4 seções sequenciais exigidas pela SPEC 11 (Dados da Carga, Dados do Navio, Dados do Contêiner e Resumo do Fluxo).

### C23 — Painel Geral — Indicadores com números incorretos
- **Problema:** Os cards de indicadores operacionais (navios fora do porto, preventiva sugerida, navios em manutenção, cargas recusadas, ocupação do pátio etc.) mostram números que não batem com a contagem real no banco — ex.: aparece "3" no Dashboard de navios fora do porto sem nenhum navio cadastrado, e "1" na preventiva sugerida sem nenhuma pendência real.
- **Correção:** Cada card deve consultar diretamente sua contagem real no banco (via `count exact` com o filtro específico daquele indicador), sem reaproveitar contagem de outro card e sem valores mockados/hardcoded.

### C24 — Atualização em tempo real entre páginas (sincronização geral)
- **Problema:** Diversos cadastros e alterações não refletem imediatamente na tela nem em outras páginas relacionadas, mesmo após recarregar: novo funcionário não aparece no CRUD de Funcionários; nova carga agendada não aparece na Tabela de Cargas no Fluxo Operacional; carga cancelada não aparece na Tabela de Cargas Canceladas; novo navio cadastrado não aparece na Localização GPS Marítima; novo guindaste não aparece em Guindastes e Pórticos de Pátio; alterações de status não refletem automaticamente no Dashboard correspondente.
- **Correção:** Após qualquer `INSERT`/`UPDATE` bem-sucedido no Supabase, fazer o refetch automático da lista/tabela afetada (ou usar `supabase.channel().on('postgres_changes', ...)` para atualização em tempo real). O sistema deve funcionar como páginas "conectadas": uma alteração feita em uma área deve refletir automaticamente em todas as outras que exibem aquele dado.

### C25 — Reemissão e Invalidação de Códigos — matrícula não localizada
- **Problema:** Ao pesquisar a matrícula de um funcionário já cadastrado, o sistema retorna "não encontrado".
- **Correção:** Corrigir a busca para localizar corretamente o funcionário pela matrícula, com atualização imediata caso haja mudança de status/código.

### C26 — CRUD de Funcionários — matrícula duplicada permitida
- **Problema:** É possível cadastrar dois funcionários com a mesma matrícula.
- **Correção:** Adicionar constraint de unicidade na matrícula no banco (`UNIQUE`) e validar no front antes do `INSERT`, exibindo mensagem clara de erro em caso de conflito.

### C27 — Visitantes — sem opção de mudar status "aguardando autorização" para "em visita"
- **Problema:** Ao registrar um visitante com status inicial "aguardando autorização", não há como alterar depois para "em visita" sem registrar tudo novamente.
- **Correção:** Permitir a alteração do status de "aguardando autorização" para "em visita" diretamente no cadastro existente, sem necessidade de novo registro.

### C28 — Prompt dialogs nativos do navegador
- **Problema:** Alguns botões abrem a caixa de diálogo nativa do navegador (`prompt`/`confirm`), o que não é desejado visualmente.
- **Correção:** Substituir todos os `prompt`/`confirm` nativos por um modal customizado, centralizado na tela, com o mesmo padrão visual do restante do sistema.

### C29 — Navbar cobre o conteúdo ao rolar a página
- **Problema:** Ao rolar a página, o conteúdo passa por cima da navbar ou vice-versa.
- **Correção:** Fixar a navbar (`position: fixed; top: 0; z-index` alto) e aplicar `padding-top` no conteúdo principal equivalente à altura da navbar, para que nunca se sobreponham.

### C30 — Matrículas e códigos devem ser salvos em maiúsculas
- **Problema:** Não há padronização de caixa alta nos campos de matrícula e código.
- **Correção:** Toda matrícula e código deve ser salvo em CAIXA ALTA (aplicar `.toUpperCase()` antes de salvar, tanto no front quanto, se possível, validado no back-end).

### C31 — Inspeção e Checklist — exibe cargas não cadastradas
- **Problema:** Ao selecionar uma carga para o checklist, aparecem cargas que não constam na Tabela de Cargas no Fluxo Operacional (página Cargas e Pátio).
- **Correção:** A lista de seleção deve exibir apenas as cargas realmente cadastradas e ativas naquela tabela.

### C32 — Inspeção e Checklist — falta campo para motivo de recusa
- **Problema:** Mesmo confirmando todos os itens do checklist, ao clicar em "recusar carga" o sistema pede o motivo do cancelamento, mas não existe campo para digitá-lo.
- **Correção:** Adicionar um campo de texto para descrição do motivo da recusa, exibido sempre que a opção "recusar carga" for selecionada.

### C33 — Embarcações e GPS — Número IMO sem padrão e sem unicidade
- **Problema:** O campo do número IMO não exige uma estrutura fixa e permite duplicidade entre navios diferentes.
- **Correção:** Validar que o IMO siga sempre o formato "3 letras + 7 números" e bloquear o cadastro caso já exista outro navio com o mesmo IMO.

### C34 — Embarcações e GPS — Coordenadas GPS inválidas ou duplicadas
- **Problema:** O campo aceita qualquer valor digitado (não apenas coordenadas reais) e também permite que dois navios sejam salvos com exatamente a mesma coordenada, o que é fisicamente impossível.
- **Correção:** Validar que o valor inserido é uma coordenada geográfica real (formato/faixa válida de latitude e longitude) e bloquear o salvamento se a coordenada já estiver em uso por outro navio, exibindo mensagem "já existe navio nesta localização".

### C35 — Gestão de Contêineres — duplicidade de código e vínculo simultâneo
- **Problema:** O mesmo código de contêiner pode ser cadastrado mais de uma vez, e um contêiner pode ficar vinculado a mais de uma carga/navio ao mesmo tempo.
- **Correção:** Adicionar constraint de unicidade na identificação do contêiner e um campo de `status` (disponível/em uso), bloqueando novo vínculo enquanto o contêiner estiver em uso.

### C36 — Datas de fabricação/manutenção sem nexo (contêineres e guindastes)
- **Problema:** O sistema aceita data de manutenção anterior à data de fabricação, ou datas futuras inconsistentes.
- **Correção:** Validar que a data de manutenção nunca seja anterior à data de fabricação, aplicando a mesma checagem tanto para contêineres quanto para guindastes.

### C37 — Cadastro de Visitante — documento sem validação
- **Problema:** O campo aceita qualquer sequência de dígitos, sem validar se é um CPF/RG válido.
- **Correção:** Aplicar máscara de CPF (`999.999.999-99`), validar os dígitos verificadores e bloquear o envio caso o documento seja inválido.

### C38 — Cargas — valores negativos em peso, volume e valor declarado
- **Problema:** Os campos de peso, volume e valor declarado aceitam valores negativos.
- **Correção:** Restringir os campos a valores maiores que zero (`min="0"` no front) e reforçar a validação no back-end antes do `INSERT`, rejeitando valores menores ou iguais a zero.

### C39 — Manutenção e OS — solicitação de manutenção de navios
- **Problema:** Não existe opção para solicitar manutenção de um navio. É necessário oferecer diferentes tipos de manutenção, sendo que a opção "manutenção geral" só pode ser selecionada se a última manutenção geral (ou o tempo de uso do navio) tiver 3 anos ou mais.
- **Correção:** Criar a funcionalidade de solicitação de manutenção com múltiplos tipos disponíveis; a opção "manutenção geral" deve ficar habilitada apenas quando o navio estiver em uso há 3 anos ou mais, ou quando a última manutenção geral tiver ocorrido há 3 anos ou mais.

---

## ⚙️ Seção de Ajustes

### A1 — Renomear cards do Painel Geral
- Renomear os cards para **"Indicadores operacionais no terminal"**.
- As informações dos cards devem ser **atualizadas em tempo real** sempre que algo for adicionado, alterado, removido ou modificado no sistema.

### A2 — Remover "Indicadores Executivos Consolidados"
- Retirar a seção **Indicadores Executivos Consolidados** da página Painel Geral.

### A3 — Planilha consolidada de desempenho operacional por categoria
- A planilha deve ser **atualizada automaticamente** conforme as mudanças no sistema.
- **Não** deve ser elaborada com dados fictícios — sempre que qualquer dado for inserido/alterado no sistema, a planilha deve refletir isso imediatamente.

### A4 — Liberação de navio pelo Diretor de Operações
- Implementar fluxo onde o **Diretor de Operações e Logística** registra o **horário de saída** do navio ao liberá-lo para sair do porto.
- A estimativa de ETA deve ser calculada a partir desse horário de saída real, em conexão com o tempo real.

### A5 — Configuração de retorno do navio ao porto de origem
- Criar configuração para quando o navio estiver **fora do Porto**, permitindo verificar se já está disponível para retorno e clicar para **autorizar o retorno** ao porto de origem.
- Referência: o navio *Atlantic Breeze* está no Porto de destino; ao sair, o sistema deve permitir gerenciar seu retorno.

### A6 — Vinculação obrigatória de carga a contêiner e navio
- Todas as cargas, **sem exceção**, devem estar vinculadas a um contêiner e a um navio.
- As vinculações devem ser refletidas no sistema **na mesma hora**.

### A7 — Validação de capacidade de volume no momento da vinculação
- Cada contêiner tem no máximo **75 m³** de volume.
- No momento da vinculação de cargas e contêineres, deve aparecer uma **lista de todos os contêineres** indicando:
  - Volume disponível/necessário;
  - Tipo de carga correspondente ao armazenamento.
- **Impedir** a vinculação de carga em contêiner que já esteja no limite de volume.

### A8 — Delegação de supervisor com mudança de cargo temporária
- Na página de **Delegação de Supervisor**, permitir que o funcionário substituto **mude de cargo até o fim da vigência** da substituição.
- A substituição deve estar **salva no Supabase**.

### A9 — Remover todas as informações que não estão no banco de dados
- **Problema:** Há informações sendo exibidas no sistema que não estão cadastradas no banco de dados (dados hardcoded, estáticos ou inseridos diretamente no código/front-end).
- **Ajuste:** Remover **todas** as informações que não estejam registradas no banco de dados do **Supabase**. O sistema deve exibir **apenas** informações e dados que estejam devidamente cadastrados e armazenados no Supabase, garantindo que todas as telas reflitam exclusivamente os dados reais do banco.

### A10 — Autorização de retorno do navio ao porto de origem
- **Ajuste:** Disponibilizar opção no painel de Embarcações para verificar disponibilidade e autorizar o retorno ao porto de origem para navios em status `FORA_DO_PORTO` ou `NO_PORTO_DE_DESTINO`.

### A11 — Delegação de supervisor com elevação temporária de cargo no Supabase
- **Ajuste:** A delegação de supervisor deve ser gravada e consultada exclusivamente na tabela `delegacoes_supervisor` do Supabase e elevar temporariamente o cargo e permissões ativas do funcionário substituto na sessão durante a vigência da substituição.

### A12 — Validação de unicidade no cadastro de visitantes
- **Ajuste:** Impedir cadastros de visitantes com documentos duplicados através de consulta e restrição direta na tabela `visitantes` do Supabase.

### A13 — Obrigatoriedade de Relatório do Backlog para Toda e Qualquer Mudança no Sistema
- **Ajuste:** Para toda e qualquer alteração realizada no repositório/sistema (seja correção, ajuste ou nova funcionalidade), deve ser **obrigatoriamente registrado um relatório de execução do backlog** (ex.: `relatorio-backlog-001.md` ou `relatorio-backlog.md`), relatando de forma transparente e detalhada tudo o que foi feito.

---

## 📋 Regra de Relatório de Execução do Backlog

Toda alteração feita no sistema deve ser documentada em um relatório do backlog (ex.: `relatorio-backlog-001.md`, `relatorio-backlog.md`, etc.). Ao final de cada sessão de implementação (ou ao concluir um conjunto de itens), deve-se gerar/atualizar o **relatório de execução** contendo obrigatoriamente:

1. **Identificação dos itens:** Código do item (ex.: C1, C16, A13), título e seção (Correção ou Ajuste).
2. **Status de cada item:**
   - ✅ **Concluído** — implementado e validado;
   - 🟡 **Parcialmente concluído** — implementado, mas pendente de validação/ajuste;
   - 🔴 **Pendente** — não iniciado ou bloqueado (com justificativa).
3. **Descrição do que foi feito:** resumo técnico das alterações (arquivos modificados, lógica implementada, tabelas/colunas afetadas no Supabase).
4. **Evidências de validação:** prints/descrição dos testes realizados, incluindo fluxo de verificação no banco de dados (ex.: carga cancelada saiu da tabela principal e apareceu na tabela de canceladas).
5. **Impactos e dependências:** itens afetados indiretamente pela alteração e itens que dependem de outros para serem concluídos.
6. **Pendências e próximos passos:** lista do que resta fazer, com prioridade sugerida.
7. **Data e responsável:** data de execução e identificação de quem executou (sessão do Jules).

**Formato de saída:** o relatório deve ser salvo como `relatorio-backlog.md` (ou `relatorio-backlog-001.md`, `relatorio-backlog-AAAA-MM-DD.md` para histórico) e incluir um resumo executivo no topo com o percentual de conclusão do backlog (itens concluídos / total de itens).


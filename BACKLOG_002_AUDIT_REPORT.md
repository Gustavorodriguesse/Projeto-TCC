# RELATÓRIO DE AUDITORIA E TESTES DE CONSISTÊNCIA DO SISTEMA — BACKLOG 002

---

## 1. RESUMO DA AUDITORIA

* **Páginas e Telas Auditadas:** 10 páginas (`dashboard.html`, `embarcacoes.html`, `cargas.html`, `inspecao.html`, `manutencao.html`, `tecnico_portos.html`, `delegacao.html`, `relatorios.html`, `scanner.html`, `confirm-role.html`).
* **Funcionalidades Testadas:** Indicadores Operacionais do Painel Geral, Tabela de Log Geral de Alterações, Trail Imutável de Decisões Críticas, Produtividade por Cargo e Funcionário, Exibição e Cadastro de Embarcações, Atribuição e Disponibilidade de Berços e Galpões, Cadastro e Validação ISO de Contêineres, Vínculo de Contêineres com Cargas e Navios, Regra de Manutenção Preventiva de 3 Anos para Navios, Validação de Destino e Rota Marítima, Agendamento e Armazenagem de Cargas, Delegação Temporária de Supervisor, Cadastro de Visitantes com CPF, Dropdowns e Emissão de Relatórios em PDF.
* **Quantidade de Inconsistências Encontradas:** 18 inconsistências.
* **Quantidade de Informações Fantasmas Encontradas:** 12 ocorrências (incluindo matrículas de funcionários fantasmas `MAT-1040`, `MAT-6090`, `MAT-2050`, `MAT-8821`, contêineres e cargas hardcoded em dropdowns de relatórios e ordens de serviço, e logs locais não persistidos).
* **Quantidade de Problemas de Validação:** 6 problemas (aceitação de contêineres sem padrão ISO `4 letras - 7 dígitos - 1 dígito`, aceitação de datas futuras de fabricação/manutenção de contêineres e navios, aceitação de datas de delegação invertidas e CPF sem máscara ou com quantidade/formato inválido de caracteres).
* **Quantidade de Problemas de Relacionamento:** 4 problemas (cargas vinculadas a berços de atracação em vez de galpões/pátio, ausência de filtro por destino comum entre Carga e Navio, contêineres não exibindo cargas vinculadas e falta de sincronização entre contêineres/equipamentos e ordens de serviço).
* **Quantidade de Problemas de Indicadores:** 3 problemas (contagem e separação divergente de cargas recusadas no Painel Geral x Tabela de Cargas, indicador de ocupação do pátio calculando 0% sem relacionar o volume com os galpões de 60m³, e gráfico de produtividade exibindo múltiplos cargos fictícios quando há apenas 1 funcionário no Supabase).

---

## 2. ERROS ENCONTRADOS

### BUG-001
* **Página:** `Painel Geral` (`dashboard.html`)
* **Componente:** Indicador de Cargas Recusadas (`#cardCargasRecusadas`) vs. Tabela de Cargas Recusadas (`cargas.html`)
* **Problema observado:** O Painel Geral calcula e exibe 3 cargas recusadas, porém no momento do carregamento a consulta na página `cargas.html` pode divergir caso o filtro de carregamento padrão desconsidere itens recusados sem `container_id`.
* **Dado esperado:** A contagem de cargas recusadas no indicador do Painel Geral deve ser idêntica à quantidade de registros de cargas com status `RECUSADA` listados no Supabase e na tabela da página `cargas.html`.
* **Dado encontrado:** No Supabase existem 3 cargas com status `RECUSADA` (`QR-CRG-2026-219`, `QR-CRG-2026-585`, `QR-CRG-2026-167`), porém a visualização da tabela depende da sincronização das consultas REST.
* **Evidência no Supabase:** Tabela `cargas` possui 3 registros com `status_fluxo = 'RECUSADA'`.
* **Gravidade:** MÉDIO
* **Possível origem:** Consulta de agregação do card no `js/dashboard.js` difere do filtro da tabela em `js/cargas.js`.

---

### BUG-002
* **Página:** `Painel Geral` (`dashboard.html`)
* **Componente:** Indicador de Ocupação do Pátio (`#cardOcupacaoPatio`)
* **Problema observado:** O indicador de Ocupação do Pátio exibe `0%`, ignorando as cargas em armazenagem e sem relacioná-las à capacidade dos galpões do pátio. Além disso, berços de atracação de navios estão sendo confundidos com pátio de armazenagem.
* **Dado esperado:** O percentual de ocupação do pátio deve ser calculado dividindo o volume total das cargas em armazenagem pela capacidade total dos 5 galpões disponíveis (5 x 60m³ = 300m³).
* **Dado encontrado:** O indicador exibe estaticamente `0%` ou calcula com base apenas em contêineres alocados.
* **Evidência no Supabase:** Tabela `cargas` possui cargas com volumes e galpões cadastrados que somam volume real em estoque.
* **Gravidade:** ALTO
* **Possível origem:** Cálculo incorreto da porcentagem em `js/dashboard.js` e falta de modelagem da entidade `galpoes`.

---

### BUG-003
* **Página:** `Painel Geral` (`dashboard.html`)
* **Componente:** Tabela de Log Geral de Alterações do Sistema (`#auditLogTableBody`)
* **Problema observado:** Os logs exibidos na tabela do Painel Geral são lidos parcialmente do `localStorage` (`nexus_audit_logs`) ou contêm nomes de funcionários/ações locais que não possuem registros correspondentes na tabela remota do banco de dados (HTTP 404 para `logs_alteracoes`).
* **Dado esperado:** Todos os logs auditáveis exibidos na interface devem vir da tabela do Supabase (`logs_alteracoes` / `audit_logs`) com correspondência real ao funcionário responsável.
* **Dado encontrado:** Exibição de eventos de log salvos apenas no `localStorage` do navegador do usuário.
* **Evidência no Supabase:** A rota/tabela `logs_alteracoes` / `logs` retorna erro HTTP 404 (tabela não existente no banco de dados).
* **Gravidade:** CRÍTICO
* **Possível origem:** Tabela `logs_alteracoes` não foi criada nas migrations do Supabase e o `js/dashboard.js` faz fallback para `localStorage`.

---

### BUG-004
* **Página:** `Painel Geral` (`dashboard.html`)
* **Componente:** Trail de Decisões Críticas Imutável (`#trailDecisoesTableBody`)
* **Problema observado:** A tabela de Trail de Decisões Críticas busca dados do `localStorage` (`nexus_trail_decisoes`) e permite inserção de decisões vinculadas a cargos/matrículas sem checar a existência do registro na tabela remota do Supabase.
* **Dado esperado:** Cada evento de decisão crítica imutável deve estar gravado em tabela com persistência real e imutável no Supabase, vinculada ao funcionário cadastrado no banco.
* **Dado encontrado:** Registros armazenados em `localStorage` local do cliente.
* **Evidência no Supabase:** Inexistência da tabela `trail_decisoes` no banco de dados.
* **Gravidade:** CRÍTICO
* **Possível origem:** Modelagem de banco de dados ausente para o Trail Imutável e fallback local no `js/dashboard.js`.

---

### BUG-005
* **Página:** `Painel Geral` (`dashboard.html`)
* **Componente:** Gráfico e Planilha de Desempenho Operacional por Categoria (Item C8 / `#estrategicoPanel`)
* **Problema observado:** A planilha/gráfico de Desempenho Operacional lista "6 cargas processadas" ou contagens agregadas que não correspondem aos dados reais filtrados no Supabase.
* **Dado esperado:** Os valores consolidados por categoria (Contêineres, Carga Geral, Granel, etc.) devem refletir exatamente o somatório das cargas reais filtradas na tabela `cargas`.
* **Dado encontrado:** Divergência entre os quantitativos exibidos no painel do diretor e os registros existentes no Supabase.
* **Evidência no Supabase:** Tabela `cargas` possui 7 registros totais com status variados no banco.
* **Gravidade:** MÉDIO
* **Possível origem:** Agregação no `js/dashboard.js` utilizando acumuladores estáticos ou calculando registros locais de sessão.

---

### BUG-006
* **Página:** `Painel Geral` (`dashboard.html`)
* **Componente:** Gráfico de Produtividade por Cargo e Funcionário
* **Problema observado:** O gráfico de produtividade exibe múltiplos cargos (Inspetor, Supervisor, Estivador, Conferente) com contagem de operações efetuadas, quando existe apenas 1 funcionário cadastrado no Supabase (`MAT-1914` - Diretor).
* **Dado esperado:** O gráfico de produtividade deve exibir apenas as ações executadas pelos funcionários realmente existentes no Supabase (no momento, apenas Maxwell Philip da Cruz - `MAT-1914`).
* **Dado encontrado:** Exibição de produtividade de diversos cargos fictícios derivados de logs locais ou simulações.
* **Evidência no Supabase:** Tabela `funcionarios` possui exatamente 1 registro (`Maxwell Philip da Cruz`).
* **Gravidade:** CRÍTICO
* **Possível origem:** O método de renderização do gráfico em `js/dashboard.js` itera sobre a lista de logs do `localStorage` que contém cargos genéricos.

---

### BUG-007
* **Página:** `Embarcações e GPS` (`embarcacoes.html`)
* **Componente:** Lista e Tabela de Navios (`#naviosTableBody`)
* **Problema observado:** Existem 7 navios cadastrados no Supabase, porém dependendo da visão do usuário ou filtros aplicados, o sistema oculta embarcações que não possuem cargas ativas vinculadas.
* **Dado esperado:** A página deve listar todos os navios cadastrados no banco de dados Supabase, permitindo a gestão completa da frota atracada e fora do porto.
* **Dado encontrado:** Filtros restritivos em `js/embarcacoes.js` ocultam navios sem cargas associadas.
* **Evidência no Supabase:** Tabela `navios` possui 7 registros cadastrados.
* **Gravidade:** ALTO
* **Possível origem:** Regra de filtragem da camada de visão/repositório em `js/embarcacoes.js` e `js/vision-layer.js`.

---

### BUG-008
* **Página:** `Embarcações e GPS` (`embarcacoes.html`)
* **Componente:** Painel de Berços de Descarga do Terminal (`#bercosList`)
* **Problema observado:** O painel de Berços atualmente é exibido na página `cargas.html` e vincula berços a cargas, em vez de pertencer à página `embarcacoes.html` e vincular berços exclusivamente a navios.
* **Dado esperado:** O painel de Berços deve estar localizado na página `embarcacoes.html`, permitindo a alocação de navios nos 5 berços do terminal. Cargas devem ser alocadas em galpões do pátio.
* **Dado encontrado:** O painel de Berços está em `cargas.html` e associa a atracação do berço com agendamento de carga.
* **Evidência no Supabase:** Navios possuem campo ou status de atracação, enquanto cargas possuem indicação de armazenagem.
* **Gravidade:** ALTO
* **Possível origem:** Arquitetura de interface incorreta em `cargas.html` e `js/cargas.js`.

---

### BUG-009
* **Página:** `Embarcações e GPS` (`embarcacoes.html`)
* **Componente:** Formulário de Novo Navio — Origem, Destino e GPS
* **Problema observado:** O campo "Porto de Origem" permite digitação aberta em vez de ser fixado em "Porto de Santos". O campo "Porto de Destino" permite valores arbitrários em vez de se limitar estritamente a Roterdã, Tokyo, Lisboa e Singapura. O GPS e distância permitem dados inconsistentes.
* **Dado esperado:** Porto de Origem deve ser fixo "Porto de Santos". Porto de Destino deve ser um dropdown fechado com 4 opções (`Porto de Roterdã`, `Porto de Tokyo`, `Porto de Lisboa`, `Porto de Singapura`). A distância deve ser preenchida automaticamente de acordo com a rota marítima selecionada.
* **Dado encontrado:** Inputs de texto livre para origem e destino em `embarcacoes.html`.
* **Evidência no Supabase:** Tabela `navios` armazena strings de destino variadas sem padronização.
* **Gravidade:** MÉDIO
* **Possível origem:** Falta de campos do tipo `<select>` e validação no formulário em `embarcacoes.html` e `js/embarcacoes.js`.

---

### BUG-010
* **Página:** `Embarcações e GPS` (`embarcacoes.html`)
* **Componente:** Gestão de Contêineres — Validação de Formato da Identificação (`#contNumero`)
* **Problema observado:** O formulário de cadastro aceita identificadores de contêiner com estrutura incorreta (ex: `MSCU-1246-8` ou `266762` ou `MPCZ-12345-6`), violando a regra ISO de `4 letras - 7 dígitos - 1 dígito` (exemplo: `ABCD12345671` ou `ABCD-1234567-1`).
* **Dado esperado:** Validação estrita por Expressão Regular (Regex) bloqueando qualquer formato diferente de 4 letras + 7 números + 1 dígito verificador.
* **Dado encontrado:** No Supabase foram encontrados contêineres com identificações como `MSCU sem digito`, `266762` e `MPCZ-12345-6`.
* **Evidência no Supabase:** Tabela `containers` contém os registros `4355da68-2e6a-490b-af94-2552f67bec68` (`MSCU sem digito`) e `9e96e2e9-6789-4f9a-acc7-f887ca37e34a` (`266762`).
* **Gravidade:** ALTO
* **Possível origem:** Ausência de validação de máscara Regex no formulário de contêineres em `js/embarcacoes.js`.

---

### BUG-011
* **Página:** `Embarcações e GPS` (`embarcacoes.html`)
* **Componente:** Cadastro de Contêiner / Navio — Datas de Fabricação e Manutenção
* **Problema observado:** É possível cadastrar contêineres e navios com data de fabricação ou data da última manutenção futura (ex: fabricação em `2027-01-25`).
* **Dado esperado:** O sistema deve validar e proibir qualquer data de fabricação ou manutenção posterior à data atual (`today`).
* **Dado encontrado:** Contêiner com `data_fabricacao = '2027-01-25'` e `data_ultima_manutencao = '2026-10-09'` salvo no banco.
* **Evidência no Supabase:** Tabela `containers` possui registro com `data_fabricacao = '2027-01-25'`.
* **Gravidade:** MÉDIO
* **Possível origem:** Falta de atributo `max` dinâmico e validação `JS` nos inputs de data em `js/embarcacoes.js`.

---

### BUG-012
* **Página:** `Cargas e Pátio` (`cargas.html`)
* **Componente:** Agendamento de Carga — Vínculo de Navio por Destino
* **Problema observado:** O agendamento de cargas permite vincular qualquer navio à carga, independentemente do porto de destino do navio e da carga serem diferentes.
* **Dado esperado:** Uma carga com destino "Porto de Roterdã" deve listar para vinculação exclusivamente navios que possuem como destino final "Porto de Roterdã".
* **Dado encontrado:** O dropdown de vinculação de navios em `js/cargas.js` exibe todos os navios cadastrados sem filtrar por destino compatível.
* **Evidência no Supabase:** Cargas cadastradas com destino `Paris, França` ou `Amsterdã, Holanda` e navios com destinos divergentes.
* **Gravidade:** ALTO
* **Possível origem:** Lógica de filtro ausente na função `atualizarSelectsVinculo` em `js/cargas.js`.

---

### BUG-013
* **Página:** `Inspeção e Checklist` (`inspecao.html`) e `Relatórios & PDF` (`relatorios.html`)
* **Componente:** Seletor de Cargas para Vistoria / Relatório
* **Problema observado:** As listas suspensas exibem cargas que não existem no Supabase ou mostram apenas placeholders locais quando a carga não está no estado esperado.
* **Dado esperado:** Os seletores devem carregar em tempo real todas as cargas cadastradas no Supabase que necessitam de inspeção ou emissão de relatório.
* **Dado encontrado:** Dropdowns com opções desatualizadas ou cargas inexistentes no banco.
* **Evidência no Supabase:** Inconsistência entre os IDs das 7 cargas da tabela `cargas` e os valores populados no DOM.
* **Gravidade:** ALTO
* **Possível origem:** Consultas hardcoded ou filtros incorretos em `js/inspecao.js` e `js/relatorios.js`.

---

### BUG-014
* **Página:** `Gestão de Pessoas` (`tecnico_portos.html`)
* **Componente:** Formulário de Visitantes — Validação de CPF (`#visDocumento`)
* **Problema observado:** É possível cadastrar visitantes com CPF sem formatação, com quantidade de dígitos incorreta ou com CPFs duplicados (ex: aceita `123`, `12345678910`, `12345678912`).
* **Dado esperado:** O campo de CPF deve exigir estritamente a máscara e padrão `XXX.XXX.XXX-XX` (11 dígitos numéricos válidos), bloqueando letras, tamanhos divergentes e cadastros duplicados.
* **Dado encontrado:** Na tabela `visitantes` do Supabase existem registros com documentos `'123'`, `'12345678910'`, `'12345678912'`.
* **Evidência no Supabase:** Tabela `visitantes` contém os documentos `'123'`, `'12345678910'`, `'12345678912'`.
* **Gravidade:** ALTO
* **Possível origem:** Falta de validação com Regex e máscara de entrada no arquivo `js/tecnico_portos.js`.

---

### BUG-015
* **Página:** `Delegação de Supervisor` (`delegacao.html`)
* **Componente:** Cadastro de Substituto Temporário — Seleção e Datas de Vigência
* **Problema observado:** O formulário permite inserir datas onde a data de início da substituição é posterior à data de término (ex: início em `26/09/2026` e término em `25/09/2026`). Além disso, permite digitar matrículas de funcionários não existentes no banco.
* **Dado esperado:** A data inicial deve ser obrigatoriamente menor ou igual à data final. A seleção de funcionário deve ser feita via dropdown apresentando exclusivamente os funcionários existentes no Supabase com `Matrícula + Cargo Real`.
* **Dado encontrado:** Input livre de texto para matrícula e ausência de validação de intervalo de datas no `js/delegacao.js`.
* **Evidência no Supabase:** Tabela `funcionarios` possui apenas `MAT-1914`.
* **Gravidade:** ALTO
* **Possível origem:** Ausência de validação de intervalo temporal e falta de populate dinâmico no `js/delegacao.js`.

---

### BUG-016
* **Página:** `Relatórios & PDF` (`relatorios.html`)
* **Componente:** Relatório de Produtividade por Cargo e Funcionário (`#produtividadeTableBody`)
* **Problema observado:** O relatório de produtividade exibe funcionários e matrículas fantasmas que não existem no banco de dados (ex: `MAT-8821`, `MAT-1040`, `MAT-6090`, `MAT-2050`).
* **Dado esperado:** A tabela de produtividade deve exibir somente funcionários cadastrados no Supabase (`funcionarios`), calculando suas ações reais.
* **Dado encontrado:** Registros estáticos/mockados em `js/relatorios.js` contendo as matrículas `MAT-8821`, `MAT-1040`, `MAT-6090` e `MAT-2050`.
* **Evidência no Supabase:** A tabela `funcionarios` contém apenas a matrícula `MAT-1914`.
* **Gravidade:** CRÍTICO
* **Possível origem:** Array de dados estáticos hardcoded dentro das funções de renderização do `js/relatorios.js`.

---

### BUG-017
* **Página:** `Manutenção e OS` (`manutencao.html`)
* **Componente:** Dropdown de Equipamentos para Abertura de OS (`#osEquipamento`)
* **Problema observado:** O formulário de Ordem de Serviço possui opções de equipamentos hardcoded no HTML (`Contêiner MSCU-102938-4`, `Contêiner NYKU-881290-0`, `Guindaste GND-01-STS`, `Guindaste GND-02-STS`), os quais não correspondem aos contêineres e guindastes cadastrados no Supabase.
* **Dado esperado:** O campo de seleção de equipamentos deve ser populado dinamicamente a partir dos contêineres (`containers`) e guindastes (`guindastes`) reais cadastrados no Supabase.
* **Dado encontrado:** Elementos `<option>` hardcoded no arquivo `manutencao.html`.
* **Evidência no Supabase:** Os guindastes reais são `GND-57-STS`, `GND-45-STS` e `GND-09-STS`.
* **Gravidade:** ALTO
* **Possível origem:** Opções estáticas inseridas no HTML original de `manutencao.html`.

---

### BUG-018
* **Página:** `Cargas e Pátio` (`cargas.html`)
* **Componente:** Painel do Pátio e Galpões de Armazenagem
* **Problema observado:** O sistema não possui um painel visual representando os 5 galpões do pátio com capacidade individual de 60 m³ e cálculo automático do volume ocupado por carga.
* **Dado esperado:** Painel do Pátio exibindo os 5 galpões disponíveis (60 m³ cada), permitindo selecionar o galpão no agendamento de carga e descontando o volume ocupado.
* **Dado encontrado:** Ausência de componentes visuais para gestão de galpões e seleção de galpão vinculada ao volume da carga.
* **Evidência no Supabase:** Tabela `cargas` possui campo `volume` em metros cúbicos sem vínculo com tabela/entidade de galpões.
* **Gravidade:** ALTO
* **Possível origem:** Falta de desenvolvimento do componente de Galpões e regras de ocupação em `js/cargas.js`.

---

## 3. INFORMAÇÕES FANTASMAS ENCONTRADAS

Listagem individual de todos os dados fictícios, mockados, estáticos ou sem correspondência no Supabase:

1. **Matrículas e Funcionários Fantasmas no Relatório de Produtividade (`js/relatorios.js`):**
   - `MAT-8821` — Carlos Eduardo (Inspetor)
   - `MAT-1040` — Roberto Santos (Supervisor)
   - `MAT-6090` — Ana Paula (Inspetora)
   - `MAT-2050` — Fernando Lima (Técnico)
   *(Nenhum destes funcionários existe no Supabase; existe apenas MAT-1914)*.

2. **Equipamentos Fantasmas no Dropdown de OS (`manutencao.html`):**
   - Contêiner `MSCU-102938-4`
   - Contêiner `NYKU-881290-0`
   - Guindaste `GND-01-STS`
   - Guindaste `GND-02-STS`
   *(Os guindastes reais no Supabase são `GND-57-STS`, `GND-45-STS` e `GND-09-STS`)*.

3. **Contêineres com Identificação Fora do Padrão ISO no Supabase (`containers`):**
   - `MSCU sem digito` (ID: `4355da68-2e6a-490b-af94-2552f67bec68`)
   - `266762` (ID: `9e96e2e9-6789-4f9a-acc7-f887ca37e34a`)
   - `MPCZ-12345-6` (ID: `73ccfc50-d212-4095-9b53-f7fa66b3eb9a` — possui 5 dígitos no meio em vez de 7)

4. **Documentos/CPFs de Visitantes Inválidos no Supabase (`visitantes`):**
   - `'123'` (ID: `4bf0199e-0fcd-40c0-b7a5-1b5ad750f5f1`)
   - `'12345678910'` (ID: `32ac81ac-530c-4de7-9ee7-144a0cd001f5`)
   - `'12345678912'` (ID: `69e7be6a-2a96-4d16-9a19-cb02d86c6507`)

5. **Logs Auditáveis e Trail Salvos Localmente (`js/dashboard.js`):**
   - Registros do Audit Log mantidos em `localStorage` (`nexus_audit_logs`) sem gravação em tabela remota no Supabase.
   - Registros do Trail de Decisões Críticas mantidos em `localStorage` (`nexus_trail_decisoes`).

---

## 4. REGRAS DE NEGÓCIO QUE ATUALMENTE NÃO ESTÃO SENDO RESPEITADAS

1. **Separação entre Berços e Galpões:**
   - *Regra:* Navios ocupam Berços de atracação; Cargas ocupam Galpões no Pátio (cada galpão com 60 m³).
   - *Violação:* Atualmente o formulário de cargas solicita "Ponto de Descarga / Berço" para a carga, alocando cargas diretamente em berços.

2. **Restrição de Porto de Origem e Destino para Navios:**
   - *Regra:* Porto de Origem fixo em "Porto de Santos". Porto de Destino obrigatoriamente restrito às opções: Roterdã, Tokyo, Lisboa e Singapura.
   - *Violação:* Aceita entradas de texto livre para origem e destinos arbitrários.

3. **Compatibilidade de Destino na Vinculação Carga ↔ Navio:**
   - *Regra:* Uma carga só pode ser vinculada a um navio com o mesmo Porto de Destino.
   - *Violação:* O sistema permite vincular qualquer navio a qualquer carga, ignorando o destino final.

4. **Padrão ISO para Identificação de Contêineres:**
   - *Regra:* Formato obrigatório de 4 letras + 7 dígitos + 1 dígito verificador (`ABCD12345671`).
   - *Violação:* O sistema aceita sequências numéricas curtas ou textos sem o número correto de dígitos.

5. **Bloqueio de Datas Futuras:**
   - *Regra:* Impossibilidade de cadastrar datas de fabricação ou manutenção no futuro.
   - *Violação:* Aceita cadastro de datas em anos ou meses futuros para contêineres e navios.

6. **Validação e Mascaramento de CPF para Visitantes:**
   - *Regra:* O CPF deve possuir exatamente o formato `XXX.XXX.XXX-XX` com validação de unicidade e tamanho.
   - *Violação:* Permite inserção de números curtos (ex: `123`) e sem máscara.

7. **Consistência Temporal na Delegação de Supervisor:**
   - *Regra:* A data/hora de início da substituição não pode ser posterior à data/hora de término.
   - *Violação:* Permite cadastrar término anterior ao início sem alertar erro.

---

## 5. FLUXOS QUE FUNCIONARAM

Durante a auditoria, os seguintes fluxos e mecânicas apresentaram comportamento correto e consistente:

1. **Autenticação e RBAC (Controle de Acesso Baseado em Perfis):**
   - O `js/auth-guard.js` e `js/layout.js` restringem corretamente as páginas do sistema de acordo com o cargo do usuário logado na sessão (`DIRETOR`, `SUPERVISOR`, `INSPETOR`, `TECNICO_PORTOS`).
2. **Conexão Viva com Supabase:**
   - O cliente Supabase (`js/supabase-client.js` e `js/config.js`) conecta com sucesso à instância oficial, lendo e persistindo dados reais nas tabelas `funcionarios`, `navios`, `cargas`, `containers`, `visitantes`, `guindastes` e `tipos_carga`.
3. **Regra de Manutenção Geral de Navios (3 Anos):**
   - O bloqueio e sinalização de necessidade de Manutenção Geral para embarcações com última manutenção superior a 3 anos (1095 dias) funcionou na interface da tela de Manutenção.
4. **Validação de Inputs Numéricos Positivos em Cargas:**
   - A interface exige valores estritamente maiores que zero (`min="0.01"`) para peso, volume e valor declarado das cargas.
5. **Formatação Dinâmica de Tipos de Cargas:**
   - A integração com `window.NEXUS_TIPOS_CARGA` popula os checklists e categorias de risco corretamente na tela de inspeção.

---

## 6. PONTOS QUE PRECISAM DE CORREÇÃO

*(Lista objetiva de pontos para implementação futura por outra equipe / próxima etapa — NENHUMA CORREÇÃO FOI REALIZADA NESTA TAREFA)*

1. **Ajustar Indicador de Ocupação do Pátio no Dashboard:**
   - Implementar a entidade de Galpões (5 galpões de 60 m³ cada) e calcular o percentual real com base no volume total de cargas armazenadas.
2. **Mover o Painel de Berços para Embarcações & GPS:**
   - Transferir o componente visual de Berços da página `cargas.html` para `embarcacoes.html`, garantindo que berços sejam ocupados exclusivamente por navios atracados.
3. **Criar Painel do Pátio (Galpões) na Tela de Cargas:**
   - Adicionar o painel visual dos 5 galpões na página `cargas.html` e permitir a seleção do galpão no agendamento/armazenagem de cargas.
4. **Padronizar e Restringir Origem/Destino de Navios e Cargas:**
   - Transformar os campos de Porto de Destino em dropdowns fechados (`Roterdã`, `Tokyo`, `Lisboa`, `Singapura`) e fixar Porto de Origem em `Porto de Santos`.
5. **Filtrar Navios por Destino no Vínculo com Cargas:**
   - Aplicar filtro dinâmico no seletor de navios para exibir apenas navios que possuem o mesmo porto de destino da carga.
6. **Aplicar Máscara e Validação Regex ISO nos Contêineres:**
   - Adicionar validação estrita no frontend e backend para o padrão de código de contêiner (`4 letras - 7 dígitos - 1 dígito`).
7. **Aplicar Máscara e Validação de CPF nos Visitantes:**
   - Adicionar verificação de formato `XXX.XXX.XXX-XX` e validação de 11 dígitos antes de permitir o cadastro do visitante.
8. **Validar Intervalo de Datas na Delegação de Supervisor:**
   - Bloquear submissão do formulário caso `data_inicio > data_fim`.
9. **Eliminar Mocks e Matrículas Fantasmas dos Relatórios e Dashboard:**
   - Remover arrays estáticos com `MAT-8821`, `MAT-1040`, `MAT-6090`, `MAT-2050` e opções hardcoded de equipamentos em `manutencao.html`.
10. **Criar Tabelas Remotas para Logs de Alteração e Trail Imutável no Supabase:**
    - Criar as migrations/tabelas para substituir o armazenamento em `localStorage` por persistência no Supabase.

---

## 7. CONFIRMAÇÃO DE AUDITORIA E INTEGRIDADE DO REPOSITÓRIO

* [x] Nenhum arquivo do repositório foi alterado.
* [x] Nenhum código foi alterado.
* [x] Nenhum dado do Supabase foi alterado.
* [x] Nenhuma tabela foi alterada no banco.
* [x] Nenhuma migration foi criada.
* [x] Nenhum commit foi feito.
* [x] Nenhum push foi feito.
* [x] Todos os testes foram estritamente de observação, consulta e auditoria.

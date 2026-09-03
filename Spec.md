# Sistema de Automação de Carregamentos para um Porto

---

## Cenário

Este sistema tem como objetivo monitorar e facilitar o carregamento de objetos em embarcações no porto, promovendo autonomia operacional aos funcionários. A autonomia refere-se à capacidade de cada profissional registrar e consultar informações no sistema referentes à sua área de atuação, sem depender de comunicação verbal com outros setores. Decisões críticas, como liberação de cargas e navios, permanecem sob aprovação hierárquica do Supervisor.

---

## Problema a ser resolvido

1. Dificuldade de comunicação entre funcionários sobre dados e informações de cargas e navios;
2. Dificuldade de identificação dos dados dos navios e do material presente nos contêineres;
3. Falta de comunicação sobre reformas e manutenções nos navios;
4. Necessidade de armazenamento digital das cargas para fins de fiscalização e preservação de dados;
5. Problemas no registro de datas e horários de entrada e saída de navios e cargas do porto;
6. Dificuldade na identificação da origem e destino dos navios.

---

## Escopo

Criar um sistema web para Automação de Carregamentos em um porto. O sistema será acessado exclusivamente por funcionários no ambiente do porto, não sendo destinado ao acesso de clientes externos, capitães de navio ou pessoas que trabalham fora do porto.

---

## Glossário do Domínio Portuário

| Termo | Definição |
|-------|-----------|
| **Estivador** | Operário responsável por movimentar cargas no pátio e registrar o estado do carregamento no sistema. |
| **Conferente de Carga** | Profissional que registra o recebimento físico das mercadorias no porto e avalia as condições na saída. |
| **Arrumador e Consertador** | Responsável por organizar, acondicionar e alterar o status da carga para "pronta para entrega". |
| **Planejador de Pátio e de Navios** | Responsável por registrar o estado e as informações operacionais de contêineres e navios no sistema. |
| **Técnico em Portos** | Responsável pela documentação interna dos funcionários e pelo registro de visitantes temporários no porto. |
| **Supervisor / Gerente de Operações** | Responsável por decisões críticas: liberação de cargas e navios, aprovação de manutenções, cancelamentos e cadastros estratégicos. |
| **Inspetor** | Responsável por inspeções técnicas de cargas, cadastro de navios e contêineres, coordenação de emergências e supervisão operacional. |
| **Diretor** | Nível estratégico com acesso total de leitura ao sistema, dashboards consolidados e exportação de dados históricos. |
| **Contêiner** | Caixa metálica padronizada para transporte de cargas, identificada por um número único no sistema. |
| **Navio** | Embarcação que transporta apenas contêineres, identificada pelo número IMO e monitorada por estado operacional. |
| **IMO** | Número de identificação marítima único atribuído a cada navio (International Maritime Organization). |
| **Guindaste** | Equipamento utilizado para movimentação de contêineres no porto; sua manutenção é solicitada pelo Supervisor. |
| **Porto de Descarga** | Porto específico onde uma carga individual deve ser desembarcada, podendo ser diferente do destino final da viagem do navio. |
| **Tipo de Carga** | Classificação das mercadorias (ex: grãos, líquidos, eletrônicos) que determina o modelo de checklist de inspeção. |
| **Checklist** | Lista de verificação criada pelo Supervisor para um Tipo de Carga, usada pelo Inspetor durante a inspeção. |
| **Trail de Decisões** | Registro imutável das decisões críticas tomadas no sistema (aprovações, recusas, liberações). |
| **Etiqueta de QR Code** | Etiqueta física adesiva gerada pelo sistema contendo o QR Code de identificação de uma carga ou contêiner, para leitura via câmera de dispositivo móvel no pátio. |

---

## Requisitos Funcionais

### 1. Sistema de Acesso e Permissões por Cargo

O acesso é realizado mediante login pelo **código individual único** vinculado à matrícula do funcionário. O cargo é carregado automaticamente pelo sistema, sendo apresentado ao usuário apenas para **confirmação**.

**Regra de Visibilidade:** O sistema opera com três camadas de acesso à informação:
1. **Visão Própria (todos os cargos):** cada funcionário visualiza e interage apenas com as entidades diretamente relacionadas às suas atribuições. Exemplo: o Estivador vê apenas as cargas que selecionou para movimentar; o Conferente vê apenas os registros de recebimento e saída que ele mesmo lançou.
2. **Visão Operacional (Inspetor e Supervisor):** além de sua visão própria, têm acesso de leitura a todos os dados operacionais dos cargos inferiores (cargas, navios, contêineres, manutenções, checklists, logs de alterações e trail de decisões), permitindo supervisão e coordenação entre áreas. Não têm acesso à documentação interna de funcionários nem ao cadastro de visitantes, e não podem editar dados de outros cargos.
3. **Visão Estratégica (Diretor):** acesso total de leitura a todas as funcionalidades e dados do sistema, incluindo dashboards exclusivos, relatórios de produtividade e exportação de dados históricos.

A hierarquia de cargos define o nível de acesso:

- **Nível Estratégico:** Diretor de Operações e Logística, Diretor-Presidente / Superintendente, Conselho de Administração.
- **Nível Tático:** Inspetor.
- **Nível Gestão:** Supervisor / Gerente de Operações.
- **Nível Operacional:** Técnico em Portos, Planejador de Pátio e de Navios, Conferente de Carga, Arrumador e Consertador, Estivador.

**Ações por cargo:**

1. **Estivador:** selecionar na lista a carga que irá movimentar; registrar o estado do carregamento da mercadoria (ex: em carregamento, parado, concluído) e identificar o objeto carregado. Visualiza apenas as cargas que selecionou para movimentar e seu histórico de operações.
2. **Conferente de Carga:** registrar o **recebimento físico** da mercadoria (data/hora de chegada ao porto, quantidade, estado geral) e as condições da mercadoria no momento da saída do porto (estado físico). A liberação da saída é de responsabilidade exclusiva do Supervisor.
3. **Arrumador e Consertador:** alterar o status da mercadoria para "pronta para entrega".
4. **Planejador de Pátio e de Navios:** registrar o estado e informações sobre contêineres e navios.
5. **Técnico em Portos:** cadastrar documentação interna dos funcionários e registrar pessoas temporárias (visitantes) que entram no porto.
6. **Supervisor / Gerente de Operações:** registrar horário de chegada dos navios; definir atributos da carga, destino e porto de descarga; solicitar manutenção de navios e guindastes; cancelar entregas com motivo; liberar ou bloquear saída de cargas e navios; aprovar manutenções; designar substituto temporário com poderes de liberação; cadastrar rotas marítimas; cadastrar novos Tipos de Carga.
7. **Inspetor:** coordenar procedimentos de emergência (acionamento de alarmes); cadastrar novos navios e novos contêineres; realizar inspeção técnica formal das cargas com preenchimento do checklist e decisão de aprovação ou recusa; acessar todas as funcionalidades dos cargos operacionais.
8. **Diretor de Operações e Logística, Diretor-Presidente / Superintendente, Conselho de Administração:** acessar todas as funcionalidades dos cargos inferiores, além de dashboards exclusivos com indicadores operacionais consolidados em modelo gráfico (taxa de aprovação e recusa de cargas, tempo médio de permanência no porto, navios mais utilizados, produtividade por cargo) e exportação de dados históricos.

### 2. Cadastro e Gestão de Navios, Contêineres, Cargas, Rotas e Tipos de Carga

O sistema deve permitir o registro e consulta das seguintes entidades:

- **Navios:** nome, número IMO, data de registro no sistema, quantidade de cargas realizadas, estado operacional, coordenadas de localização, tempo fora do porto, porto de origem e porto de destino da viagem (informados pelo funcionário no sistema).
- **Contêineres:** número de identificação, tipo de carga vinculada, material carregado, data de fabricação, data da última manutenção, tempo de uso, estado, navio vinculado.
- **Cargas:** tipo (vinculado ao cadastro de Tipos de Carga), quantidade, material, atributos (peso, volume, valor declarado, natureza), data de entrada, data de saída, destino, **porto de descarga**, status do fluxo, contêiner vinculado, checklist preenchido, motivo de recusa (quando aplicável).
- **Rotas Marítimas:** origem, destino e distância fixa pré-cadastrada pelo Supervisor para cálculo automático de estimativa de chegada.
- **Tipos de Carga:** nome, categoria de risco, requisitos especiais, modelo de checklist vinculado. O cadastro do Tipo de Carga é de responsabilidade do Supervisor e é pré-requisito para o agendamento de cargas daquele tipo.

O sistema deve manter **histórico de manutenções** para navios e contêineres, contendo data e descrição dos serviços realizados, inseridos manualmente pelo responsável.

### 3. Estados de Navios, Contêineres e Manutenções

O sistema deve classificar o estado dos navios e contêineres, incluindo:

- Operante;
- Agendado para reforma;
- Em reforma;
- Aprovado para reforma.

O Inspetor da área de manutenção registra o estado atual do navio, ficando visível aos Supervisores. O Supervisor é o único responsável por aprovar manutenções.

### 4. Tempo de Carga e Estimativas

O sistema deve calcular e exibir:

- O tempo que a carga permanece no porto;
- O tempo que a carga está fora do porto para entrega;
- A estimativa de tempo até a chegada ao destino final.

### 5. Tempo do Navio Fora do Porto

O sistema deve registrar e calcular o tempo total que o navio permanece fora do porto.

### 6. Fluxo de Cargas

O fluxo completo da carga no sistema contempla as seguintes etapas e estados:

1. **Agendamento:** Registro da data prevista de entrega da carga ao porto. Cargas sem agendamento prévio terão aceitação negada no momento da chegada. O agendamento só é permitido se o Tipo de Carga já estiver cadastrado com seu checklist.
2. **Recebimento e Inspeção:** O Conferente registra o **recebimento físico** (data/hora, quantidade, estado geral). O Inspetor realiza a inspeção técnica formal, preenchendo o checklist correspondente ao tipo de carga. Ao final da inspeção, a carga pode ser:
   - **Aprovada:** segue para armazenagem.
   - **Recusada:** registra-se a data, o motivo (texto livre digitado pelo Inspetor) e o cargo responsável. A carga permanece no sistema com status **RECUSADA**, sem gestão de destino.
3. **Armazenagem:** A carga fica em armazenamento no pátio (estoque).
4. **Vinculação:** A carga é alocada a um contêiner, e o contêiner é alocado a um navio. Esta ação é registrada no sistema, mas não constitui um estado separado no fluxo.
5. **Pronta para Entrega:** O Arrumador e Consertador altera o status indicando que a mercadoria está pronta. A carga aguarda neste estado até a liberação do Supervisor.
6. **Saída do Porto:** O Supervisor libera o navio para saída. A liberação do navio implica automaticamente na liberação de todos os contêineres e cargas vinculados, registrando data, hora e destino. Cada carga mantém seu porto de descarga individual, mesmo sendo transportada no mesmo navio.
7. **Em Trânsito:** A carga está fora do porto em direção ao destino.
8. **Entregue:** O status é atualizado quando o navio tem sua localização registrada como `NO_PORTO_DE_DESTINO` ou mediante confirmação do Supervisor.

**Transição de Cancelamento:** O Supervisor pode cancelar uma entrega, desde que a carga esteja nos estados de Agendamento, Armazenagem ou Pronta para Entrega. O cancelamento registra obrigatoriamente o motivo.

### 7. Dashboards e Indicadores

Dashboards em formato de cards (ícone, título principal e quantidade) devem ser exibidos para Supervisores e cargos superiores, servindo como **visão geral operacional**, não como sistema de alertas. Os indicadores incluem:

- Quantidade de navios em manutenção;
- Quantidade de navios fora do porto;
- Cargas em armazenagem;
- Cargas prontas para entrega aguardando liberação;
- Cargas recusadas;
- Ocupação do pátio (quantidade de cargas/contêineres em armazenagem);
- Navios com manutenção preventiva sugerida (tempo superior a 3 anos).

Ao clicar em um card, o usuário acessa página com informações detalhadas. Atualização periódica: diária ou por hora.

### 8. Localização dos Navios

O sistema deve exibir a localização atual dos navios por meio de coordenadas GPS marítimo fictícias. A localização é classificada como: `DENTRO_DO_PORTO`, `FORA_DO_PORTO` ou `NO_PORTO_DE_DESTINO`. A finalidade é o registro de posição e o cálculo de estimativa de tempo de chegada, não servindo para mapeamento visual ou rastreamento em tempo real.

### 9. Checklist de Carga

O modelo de checklist deve ser criado pelo Supervisor para cada Tipo de Carga na primeira vez que este for processado. Nas próximas vezes, o sistema sugere o mesmo modelo. O preenchimento do modelo é de responsabilidade do Supervisor; na operação, o Inspetor utiliza o checklist correspondente durante a inspeção.

O Inspetor só pode aprovar a carga se todos os itens críticos do checklist estiverem marcados como "Conforme". Itens não críticos podem gerar observação sem bloqueio.

### 10. Sistema de Pesquisa

O sistema deve permitir pesquisa com os seguintes campos: nome do navio, número do contêiner, tipo de carga, período de data e status do fluxo.

### 11. Geração de Relatório PDF

O sistema deve gerar relatórios em PDF em **formato A4**, divididos em **quatro seções sequenciais**:

1. **Dados da Carga:** tipo, quantidade, peso, volume, valor declarado, natureza;
2. **Dados do Navio:** nome, número IMO, porto de origem, porto de destino;
3. **Dados do Contêiner:** número de identificação, tipo de carga, estado;
4. **Resumo do Fluxo:** status, datas de entrada/saída, porto de descarga, motivo de recusa (se houver).

O funcionário gera o documento dentro do sistema e o repassa ao cliente externo por meio externo (físico ou e-mail). O cliente não possui acesso direto ao sistema.

### 12. Log de Alterações

O sistema deve registrar logs de alterações identificando o **cargo e o código individual** do funcionário responsável pela ação. O log exibe: data/hora, cargo, código do usuário, entidade alterada e tipo de alteração (criação, edição, exclusão).

### 13. Trail de Decisões Críticas

Para ações de alto impacto, o sistema deve manter um registro detalhado (trail) das decisões. O trail é **imutável** após a criação. O funcionário que registrou a decisão pode adicionar uma **retificação** vinculada ao registro original enquanto a entidade relacionada não tiver avançado para o próximo estado, mas o registro original permanece inalterado.

As decisões padronizadas no trail incluem:
- **Inspetor:** Aprovou Carga, Recusou Carga, Solicitou Manutenção de Navio/Contêiner.
- **Supervisor:** Liberou Navio, Cancelou Entrega, Aprovou Manutenção, Recusou Manutenção, Designou Substituto.

O trail é consultado em página separada do sistema e complementa o log geral.

### 14. Delegação de Supervisor

O sistema deve permitir que um Supervisor oficial designe um substituto temporário com os mesmos poderes de liberação, registrando o período de vigência da delegação.

### 15. Gestão de Pessoas no Porto

O Técnico em Portos é responsável por:

- **Cadastro de Funcionários:** registro de dados pessoais, cargo, código individual de acesso e documentação interna (ficha ou livro de registro de empregados).
- **Cadastro de Visitantes:** registro de pessoas temporárias que entram no porto (nome, documento, motivo, data/hora de entrada).

O sistema mantém estas duas entidades separadas.

### 16. Relatório de Produtividade

O sistema deve gerar relatório interno de produtividade por cargo e funcionário, exibindo volume de operações (ex: quantas cargas cada Conferente processou, quantas inspeções cada Inspetor realizou). O relatório é acessível ao **Diretor**, ao **Inspetor** e ao **próprio funcionário** (visualizando apenas seus próprios dados).

### 17. QR Code na Carga e no Contêiner

O sistema deve gerar automaticamente um **QR Code único** para cada carga e para cada contêiner no momento do primeiro cadastro, possibilitando identificação rápida no pátio via dispositivos móveis.

#### 17.1. Geração do QR Code
- Ao concluir o cadastro de uma nova carga no sistema, a tela de confirmação exibe automaticamente o **QR Code gerado** em tempo real, vinculado ao identificador único da carga no banco de dados.
- O mesmo ocorre no cadastro de um novo contêiner: o sistema gera um QR Code exclusivo para o contêiner.
- O QR Code codifica uma URL interna do sistema (ex: `porto.interno/carga?id=ABC-2026-0042`) ou o identificador cru da entidade, dependendo da estratégia de leitura adotada.

#### 17.2. Impressão da Etiqueta
- O sistema oferece um botão **"Imprimir Etiqueta"** ao lado do QR Code exibido.
- A etiqueta é gerada em **formato PDF padronizado** (dimensões sugeridas: 10×10 cm ou 10×15 cm) contendo:
  - QR Code centralizado, com tamanho adequado para leitura à distância no pátio;
  - Número da carga ou do contêiner em texto legível abaixo do QR Code;
  - Tipo de carga e data de recebimento (opcional, para conferência visual rápida).
- A impressão é realizada em **impressora térmica de etiquetas** disponível no pátio.
- O sistema permite **reimpressão** de etiquetas quando necessário (etiqueta danificada, perdida ou suja), registrando no log de alterações a ação de "Reimpressão de etiqueta" com o cargo e código individual do funcionário responsável.

#### 17.3. Leitura e Uso no Pátio
- Funcionários operacionais (Estivador, Conferente, Inspetor, Arrumador e Consertador) podem utilizar a **câmera do dispositivo móvel** (celular ou tablet) para escanear o QR Code físico afixado na carga ou no contêiner.
- Ao escanear, o sistema abre **diretamente a tela correspondente** àquela entidade, sem necessidade de digitação manual ou navegação por menus.
- Exemplos de uso:
  - **Estivador:** escaneia a carga e registra o início/fim da movimentação;
  - **Conferente:** escaneia a carga e registra o recebimento físico ou as condições de saída;
  - **Inspetor:** escaneia a carga e abre automaticamente o checklist de inspeção correspondente ao tipo de carga;
  - **Arrumador e Consertador:** escaneia a carga e altera o status para "pronta para entrega";
  - **Supervisor:** escaneia o contêiner e visualiza o status de todas as cargas vinculadas a ele.

#### 17.4. Segurança e Resiliência
- A URL codificada no QR Code exige **autenticação obrigatória** no sistema; escaneios por pessoas não autorizadas ou de fora do porto não concedem acesso aos dados.
- O sistema mantém um **registro de leitura** (scan) vinculado ao código individual do funcionário, à data/hora e à entidade acessada, integrando-se ao log de alterações.
- Cada carga e cada contêiner possui **QR Code independente**; no momento da vinculação (carga → contêiner → navio), o sistema mantém o vínculo lógico entre os códigos, mas as etiquetas físicas permanecem separadas.

### 18. Artefatos de Modelagem e Documentação Visual

Como parte da especificação e modelagem do sistema, os seguintes artefatos devem ser produzidos para complementar o entendimento do domínio e guiar o desenvolvimento:

1. **Diagrama de Casos de Uso (UML):** representação dos atores (cargos) e suas interações com o sistema, demonstrando as funcionalidades disponíveis por perfil de acesso.
2. **Diagrama de Classes (UML):** modelagem das entidades do sistema (Navio, Contêiner, Carga, Funcionário, Manutenção, Checklist, etc.) com seus atributos, métodos e relacionamentos.
3. **Diagrama de Estados da Carga (UML State Machine):** representação gráfica das 8 etapas do fluxo de cargas (Agendamento → Recebimento/Inspeção → Armazenagem → Vinculação → Pronta para Entrega → Saída → Em Trânsito → Entregue), incluindo as transições de aprovação, recusa e cancelamento.
4. **Protótipos de Tela (Wireframes):** esboços das principais interfaces do sistema, incluindo: tela de login, dashboard por cargo, formulários de cadastro (navio, contêiner, carga, funcionário), tela de inspeção com checklist, tela de liberação pelo Supervisor, tela de consulta do trail de decisões e **tela de geração/impressão de etiqueta com QR Code**.

---

## Regras de Negócio

1. Um navio em reforma não pode receber carga.
2. Um navio agendado para reforma não pode receber carga, não pode sair do porto e não pode ser liberado para uso até a conclusão da reforma.
3. Apenas o Supervisor pode permitir a saída da carga e a liberação de navios para saída. A liberação do navio implica automaticamente na liberação de todos os contêineres e cargas vinculados.
4. Uma carga pode estar em armazenagem (estoque) e em um contêiner **simultaneamente** durante o processo de vinculação e movimentação.
5. Um contêiner tem apenas um tipo de carga.
6. O navio carrega apenas contêineres.
7. O tempo de uso de cada contêiner é medido individualmente a partir da **data de fabricação** ou da **data da última manutenção**, sendo o Supervisor responsável por indicar, no cadastro de cada contêiner, qual referência será utilizada.
8. A localização do navio é classificada como: `DENTRO_DO_PORTO`, `FORA_DO_PORTO` ou `NO_PORTO_DE_DESTINO`.
9. O tempo de entrega da carga é calculado pela distância da rota pré-cadastrada dividido pela velocidade média de **33 km/h**. O sistema calcula automaticamente a estimativa de chegada.
10. A fiscalização é da parte do Supervisor e não exige assinatura digital nem imutabilidade de logs gerais.
11. Manutenções preventivas são sugeridas pelo sistema em ciclos de 3 em 3 anos, exibidas no dashboard do Supervisor. A contagem parte da **data de cadastro do navio no sistema**; para ciclos subsequentes, parte da data da última manutenção registrada no histórico.
12. Se uma carga está dentro de um contêiner e o contêiner está no navio, atualizar o navio ou o contêiner reflete nas cargas vinculadas. Alterações de nome afetam apenas o próprio item. Quando um contêiner ou navio está em manutenção, não haverá cargas dentro dele.
13. A carga possui atributos obrigatórios: peso, volume, valor declarado, natureza da mercadoria, tipo vinculado ao cadastro de Tipos de Carga e porto de descarga.
14. O preenchimento do modelo de checklist é de responsabilidade do Supervisor. O uso do checklist na inspeção é de responsabilidade do Inspetor. O Inspetor só pode aprovar a carga se todos os itens críticos estiverem marcados como "Conforme".
15. Todo acesso ao sistema exige o código individual do funcionário, vinculado ao seu cargo, garantindo a identificação nas operações e logs.
16. O cancelamento de entrega pelo Supervisor é permitido apenas quando a carga está nos estados de Agendamento, Armazenagem ou Pronta para Entrega.
17. O QR Code de uma carga ou contêiner é gerado **automaticamente e unicamente** no momento do primeiro cadastro da entidade no sistema, não podendo ser alterado ou reutilizado em outra entidade. A opção de leitura se encontrará dentro sistema, na mesma pagína assim que entrar na área de checklist.
18. A reimpressão de uma etiqueta de QR Code não gera um novo código; reproduz a mesma etiqueta original, registrando a ação no log de alterações.
19. A leitura do QR Code por um funcionário exige que o dispositivo esteja autenticado no sistema; leituras externas ou por usuários não logados são negadas.

---

## Não-requisitos

1. O sistema não realiza cálculos ou alertas sobre atrasos de entrada, chegada ao destino ou saída do porto. Apenas registra datas e horários.
2. Não será necessária a integração de sistemas legados.
3. Não será necessário mapeamento visual ou mapa interativo. A localização é registrada por coordenadas e texto.
4. O armazenamento de cargas se refere exclusivamente a guardar dados em histórico digital.
5. O sistema não possui sistema de notificações, alertas ou comunicação instantânea entre usuários.
6. A espera para entrar e para sair do navio não é gerenciada pelo sistema.
7. Não será necessário colocar inspeção técnica periódica obrigatória por lei ou norma do porto.
8. Os dados de GPS são fictícios, sem integração com sistemas reais de rastreamento.
9. O destino final físico da carga recusada após a inspeção não é gerenciado pelo sistema.
10. O sistema não gerencia substitutos, férias, folgas ou escalas de funcionários (exceto a delegação temporária de Supervisor prevista no requisito específico).
11. O Supervisor não precisa registrar manualmente o andamento dos trabalhos dos cargos operacionais no sistema; o andamento é inferido pelos status das cargas.
12. O sistema não possui módulo financeiro de contas de gastos e ganhos do estabelecimento.
13. O sistema não controla lotação máxima, capacidade de peso ou quantidade de contêineres por navio.
14. O sistema de pesquisa não possui filtros avançados além dos campos: nome do navio, número do contêiner, tipo de carga, período de data e status do fluxo.
15. O sistema não possui estado "Embarcada" como etapa separada no fluxo de cargas; a vinculação física não é gerenciada como status independente.
16. O sistema não realiza validações automáticas de compatibilidade de peso, lotação ou capacidade durante a vinculação de cargas a contêineres e navios.
17. O sistema não exige aplicativo nativo (app) para leitura do QR Code; a leitura é realizada via navegador do dispositivo móvel utilizando a câmera, sem instalação obrigatória de software adicional.

# NexusPort — Plano de Correção e Implementação

> Documento de trabalho baseado no levantamento do estado atual da aplicação frente à Spec.md do TCC. Organizado por prioridade de execução, com critérios de aceite para cada item.

---

## Como usar este documento

Cada item tem:
- **Status** (🟢 concluído / 🟡 parcial / 🔴 pendente)
- **Descrição do problema**
- **Ação necessária**
- **Critério de aceite** (como saber que está pronto)

Trabalhar na ordem das seções (0 → 5). As seções 0 e 1 destravam tudo o mais.

---

## 0. Fundação (já concluído — validar antes de seguir)

- [x] Cliente Supabase inicializado sem erros no frontend
- [x] URLs, chaves de API e RLS configuradas para leitura/gravação
- [x] Geração visual do QR Code funcionando

**Antes de avançar:** confirmar que as políticas de RLS não estão liberadas de forma genérica (`true` para tudo). Elas devem restringir por cargo/usuário assim que o RBAC (seção 2) for implementado — deixar isso já mapeado evita retrabalho.

---

## 1. Correções Críticas (bloqueiam o uso básico do sistema)

### 1.1 Formulário de cadastro/agendamento não grava no banco
- **Problema:** o formulário não está conectado ao `.insert()` do Supabase; os dados não persistem.
- **Ação:**
  - Conectar o `onSubmit` do formulário à chamada `supabase.from('cargas').insert(...)`.
  - Tratar erros de resposta (`error`) e exibir feedback ao usuário (sucesso/falha).
  - Validar campos obrigatórios no frontend antes do insert.
- **Critério de aceite:** ao cadastrar uma carga, o registro aparece na tabela `cargas` do Supabase e a tela reflete o novo item sem reload manual.

### 1.2 Login sem validação real
- **Problema:** qualquer matrícula digitada é aceita, mesmo sem existir na tabela `funcionarios`.
- **Ação:**
  - Trocar a lógica atual por uma consulta `supabase.from('funcionarios').select('*').eq('matricula', input)`.
  - Se não houver resultado → bloquear login e exibir mensagem de erro.
  - Se houver resultado → carregar `cargo` e demais dados do funcionário na sessão (para uso no RBAC da seção 2).
  - Definir se a autenticação usa senha própria ou apenas matrícula + validação de existência (confirmar com a Spec.md; se não estiver claro, assumir matrícula + senha simples por enquanto e sinalizar como pendência de definição).
- **Critério de aceite:** login com matrícula inexistente é recusado; login com matrícula válida carrega corretamente o cargo do funcionário na sessão.

### 1.3 Leitura do QR Code não abre a tela/modal
- **Problema:** o scanner lê o código mas não dispara a exibição das informações da carga.
- **Ação:**
  - Capturar o valor decodificado do QR Code (provavelmente o ID da carga).
  - Fazer `supabase.from('cargas').select('*').eq('id', valor_lido).single()`.
  - Abrir modal/tela com os dados retornados; tratar caso de ID não encontrado.
- **Critério de aceite:** ao escanear um QR Code válido, a modal abre com os dados corretos da carga/contêiner correspondente.

---

## 2. Controle de Acesso por Cargo (RBAC) — pré-requisito para a seção 3

### 2.1 Bloqueio de abas e botões por cargo
Cargos previstos na Spec: **Estivador, Conferente, Arrumador, Inspetor, Supervisor, Técnico em Portos, Diretor.**

- **Ação:**
  - Criar um mapa de permissões (ex.: objeto/config `permissoes[cargo] = { abas: [...], acoes: [...] }`).
  - Renderizar condicionalmente menus, abas e botões de acordo com o cargo da sessão.
  - Reforçar no backend (RLS do Supabase) que cada cargo só pode executar as operações permitidas — **não confiar apenas no frontend**.

### 2.2 As 3 camadas de visão
- **Visão Própria:** cada operário (Estivador, Conferente, Arrumador) vê apenas as cargas/tarefas atribuídas a ele.
- **Visão Operacional:** Inspetor e Supervisor veem o conjunto de operações em andamento no pátio/navio.
- **Visão Estratégica:** Diretor vê indicadores agregados e relatórios (sem necessariamente operar cargas individualmente).

**Critério de aceite:** logar com cada cargo de teste e confirmar que a tela exibida corresponde exatamente à camada de visão e às ações permitidas para aquele cargo.

---

## 3. Fluxo Operacional (8 Etapas) e Ações por Cargo

> Depende do RBAC (seção 2) estar funcional para restringir corretamente quem aciona cada botão.

- **Conferente:**
  - Botão de registro de recebimento físico da carga.
  - Botão de registro do estado de saída.
- **Arrumador:**
  - Botão "Pronta para Entrega" (atualiza status da carga).
- **Supervisor:**
  - Botão "Liberar Navio/Carga".
  - Botão "Cancelar Entrega" — deve abrir campo obrigatório de motivo antes de confirmar.
- **Estivador:**
  - Tela de seleção de carga para movimentação (vinculada à Visão Própria).

**Ação técnica comum:** cada botão de transição deve atualizar o campo `status` da carga no Supabase e, quando aplicável, alimentar a tabela de auditoria (seção 5.1).

**Critério de aceite:** o fluxo de status avança na ordem correta das 8 etapas da Spec, e cada transição só é possível pelo cargo autorizado.

---

## 4. Checklist de Inspeção Técnica

- **Ação:**
  - Criar tela para o Inspetor preencher o checklist correspondente ao Tipo de Carga (os itens variam conforme tipo — conferir Spec.md para lista exata por tipo).
  - Marcar quais itens são "críticos".
  - Regra de negócio: se **qualquer item crítico** for reprovado →
    1. Status da carga muda automaticamente para `RECUSADA`.
    2. Campo "Motivo de Recusa" torna-se obrigatório antes de salvar.
  - Gravar o resultado do checklist vinculado ao ID da carga.

**Critério de aceite:** reprovar um item crítico força o status para RECUSADA e impede salvar sem motivo preenchido.

---

## 5. Regras Marítimas e Estimativas

### 5.1 Cálculo de tempo de viagem
- Fórmula: `Tempo (h) = Distância (km) / 33 km/h`
- **Ação:** implementar função utilitária (ex.: `calcularTempoViagem(distanciaKm)`), usada sempre que origem/destino forem definidos.

### 5.2 Bloqueio de liberação sem rota cadastrada
- **Ação:** antes de habilitar o botão "Liberar Navio", verificar se existe registro de rota (origem → destino) cadastrado pelo Supervisor. Se não existir, bloquear o botão e orientar o cadastro da rota.

### 5.3 Manutenção preventiva de navios
- **Ação:**
  - Criar tela/tabela de histórico de manutenção por navio.
  - Gerar alerta automático quando se aproximar o intervalo de 3 em 3 anos desde a última manutenção registrada.

**Critério de aceite:** tempo de viagem calculado corretamente; liberação bloqueada sem rota; alerta de manutenção exibido corretamente com base na data da última manutenção.

---

## 6. Impressão e Relatórios em PDF

- **Etiqueta térmica (PDF):**
  - Conteúdo: QR Code, ID da carga, Tipo de Carga, Peso.
  - Botão "Imprimir Etiqueta" na tela da carga.
- **Relatório A4 (PDF):**
  - 4 seções obrigatórias: Dados da Carga, Navio, Contêiner, Resumo do Fluxo (histórico de status).
  - Botão "Gerar Relatório" acessível conforme permissão de cargo.

**Critério de aceite:** ambos os PDFs são gerados com todos os campos exigidos e refletem os dados reais do Supabase no momento da geração.

---

## 7. Auditoria e Logs

### 7.1 Trilha de decisões críticas (`trail_decisoes`)
- **Ação:** criar/gravar registro imutável (sem update/delete permitido via RLS) para:
  - Aprovações
  - Recusas
  - Manutenções
  - Cancelamentos
- Cada registro deve conter: quem executou, cargo, ação, timestamp, carga/navio relacionado.

### 7.2 Log de alterações gerais
- **Ação:** registrar automaticamente qual funcionário/cargo fez cada alteração ou reimpressão no sistema (trigger no banco ou registro explícito a cada ação relevante).

**Critério de aceite:** toda ação crítica gera um registro rastreável e imutável; nenhuma ação sensível fica sem autoria registrada.

---

## 8. Módulos de Gestão e Suporte

- **Técnico em Portos:**
  - Tela de cadastro de documentação interna de funcionários.
  - Tela de cadastro de visitantes temporários.
- **Delegação de Supervisor:**
  - Tela para designar substituto temporário com poderes de liberação (deve respeitar prazo/validade da delegação).
- **Dashboards dinâmicos:**
  - Cards/gráficos com dados reais do Supabase: ocupação do pátio, tempo médio de permanência, etc.
- **Relatório de Produtividade:**
  - Tela de desempenho/volume de operações por funcionário, visível para Diretor e Inspetor.

**Critério de aceite:** cada módulo consulta dados reais (não mockados) e respeita as permissões de cargo da seção 2.

---

## 🚀 Ordem de execução recomendada

1. Formulários gravando/consultando dados reais no Supabase (**1.1**)
2. Validação de login na tabela `funcionarios` (**1.2**)
3. Scanner de QR Code abrindo informações da carga (**1.3**)
4. RBAC — permissões de tela por cargo (**seção 2**)
5. Fluxo de 8 etapas e botões de transição de status (**seção 3**)
6. Checklist de inspeção técnica (**seção 4**)
7. Regras marítimas e estimativas (**seção 5**)
8. Impressão de etiquetas e relatórios PDF (**seção 6**)
9. Auditoria e logs (**seção 7**)
10. Módulos de gestão e suporte / dashboards (**seção 8**)

> Justificativa da ordem: os 3 primeiros itens destravam o uso básico do app; RBAC precisa vir antes do fluxo operacional porque os botões de transição dependem de cargo; checklist e regras marítimas dependem do fluxo já funcionando; PDFs, auditoria e dashboards são camadas que consomem dados já existentes e por isso ficam por último.

# Tarefas de Correção — Instruções para Agente de Código (Jules)

## Contexto do Projeto
Sistema web (frontend + Supabase) com as seguintes páginas: Página Inicial (dashboard com cards), Indicadores Executivos Consolidados, Gráfico de Funcionários, Cargas e Pátio, Embarcações (GPS), Delegação Supervisor, Gestão de Pessoas (CRUD), Relatórios e PDF.

---

## Tarefa 1 — Modal dos cards da Página Inicial
**Problema:** Ao clicar em um card da página inicial, abre um modal no centro da tela com design feio/desalinhado.

**O que fazer:**
- Melhorar o design do modal (centralizado, com sombra, bordas arredondadas, espaçamento consistente).
- Garantir responsividade (modal deve caber bem em telas pequenas, com scroll se necessário).
- Adicionar botão de fechar visível (X) e fechar ao clicar fora / tecla Esc.
- Manter o conteúdo original do modal, apenas melhorando o layout.

**Critério de aceite:** Modal visualmente limpo e profissional; funciona em desktop e mobile.

---

## Tarefa 2 — Responsividade da barra lateral de menu
**Problema:** Em celular e tablet, a barra de menu lateral ocupa espaço demais e não há comportamento de colapsar.

**O que fazer:**
- Em telas de celular e tablet (ex.: breakpoint ≤ 1024px ou conforme o framework usado), a sidebar deve iniciar recolhida/oculta.
- Exibir o botão hambúrguer (três barrinhas) para abrir o menu.
- Ao clicar no hambúrguer, o menu deve abrir (idealmente como drawer deslizante com overlay escuro); ao clicar fora ou em um item, deve fechar.
- Em desktop (tela grande), manter o comportamento atual.

**Critério de aceite:** Em mobile/tablet o menu fica oculto até clicar nas três barrinhas; transição suave; sem quebrar o layout.

---

## Tarefa 3 — Planilha de Indicadores Executivos Consolidados
**Problema:** A planilha/tabela de Indicadores Executivos Consolidados está feia e desorganizada.

**O que fazer:**
- Reorganizar a tabela: cabeçalhos claros, alinhamento consistente de colunas (números à direita, textos à esquerda).
- Adicionar zebra striping ou bordas sutis, espaçamento adequado (padding).
- Destacar totais/linhas de resumo (negrito, fundo diferente).
- Se houver exportação para Excel/CSV, manter compatível.

**Critério de aceite:** Tabela legível, alinhada e visualmente organizada.

---

## Tarefa 4 — Gráfico de Funcionários
**Problema:** Possível funcionário faltando no gráfico de funcionários.

**O que fazer:**
- Auditar a query/endpoint que alimenta o gráfico e comparar com a lista completa de funcionários ativos no banco (Supabase).
- Corrigir filtros que possam estar excluindo registros (ex.: status inativo, null, limite de registros na query).
- Garantir que todos os funcionários apareçam no gráfico.

**Critério de aceite:** Total de funcionários no gráfico igual ao total no banco; nenhum registro omitido.

---

## Tarefa 5 — Botões da página Cargas e Pátio
**Problema:** Os botões da página Cargas e Pátio estão visualmente ruins e desorganizados.

**O que fazer:**
- Padronizar o estilo dos botões (cor, padding, bordas arredondadas, hover).
- Alinhar e agrupar os botões de forma lógica (ações principais juntas, com espaçamento consistente).
- Garantir que fiquem legíveis e clicáveis em telas pequenas (wrap responsivo).

**Critério de aceite:** Botões padronizados, alinhados e organizados; sem sobreposição em mobile.

---

## Tarefa 6 — Embarcações (GPS): remover underline da classificação
**Problema:** Na página de Embarcações, na coluna/parte de Classificação, as palavras aparecem sublinhadas (underline).

**O que fazer:**
- Remover o `text-decoration: underline` (ou classe/link que causa o sublinhado) dos textos de classificação.
- Manter cores e demais estilos intactos.

**Critério de aceite:** Palavras de classificação sem sublinhado.

---

## Tarefa 7 — Design das mensagens pop-up (toasts/modais de feedback)
**Problema:** Mensagens que aparecem no centro da tela ao clicar em botões estão com visual ruim.

**O que fazer:**
- Padronizar o design de todos os modais/toasts de feedback (sucesso, erro, confirmação): ícone, cores por tipo, bordas arredondadas, sombra, animação de entrada/saída.
- Centralizar na tela com overlay, botão de fechar e/ou botões de ação (Confirmar/Cancelar) claros.

**Critério de aceite:** Todas as mensagens centrais com visual bonito e consistente.

---

## Tarefa 8 — Delegação Supervisor: Status de Visitante não persiste no Supabase
**Problema:** O campo "Status de Visitante" da página Delegação Supervisor não está sendo salvo no Supabase.

**O que fazer:**
- Verificar o envio do campo no formulário (nome do campo, tipo de dado).
- Verificar se a coluna existe na tabela do Supabase e se as policies de INSERT/UPDATE (RLS) permitem a escrita.
- Corrigir o código de submit para incluir o campo no payload e tratar erros de forma visível ao usuário.
- Testar o fluxo completo: preencher → salvar → recarregar → confirmar que o valor persistiu.

**Critério de aceite:** O status de visitante é salvo e recuperado corretamente do Supabase.

---

## Tarefa 9 — Gestão de Pessoas: nome do funcionário não aparece após cadastro
**Problema:** No CRUD de Gestão de Pessoas, ao acrescentar um funcionário, o nome dele não aparece na lista.

**O que fazer:**
- Verificar se após o INSERT o estado da lista é atualizado (re-fetch ou inserção local do registro retornado).
- Verificar se o campo `nome` está sendo lido corretamente da resposta do Supabase (atenção a nomes de colunas, ex.: `nome` vs `name`, ou join com outra tabela).
- Garantir feedback visual de sucesso após cadastro.

**Critério de aceite:** Ao cadastrar um funcionário, ele aparece imediatamente na lista com o nome correto.

---

## Tarefa 10 — Organizar a Emissão do Relatório PDF
**Problema:** A seção de Emissão de Relatório PDF está desorganizada.

**O que fazer:**
- Reorganizar a interface de emissão: agrupar campos de filtro (período, tipo de relatório, seções incluídas) em blocos claros com labels.
- Padronizar botões (Gerar PDF, Baixar, Cancelar) com hierarquia visual clara.
- Mostrar estado de carregamento durante a geração e mensagem de sucesso/erro ao final.
- Layout responsivo.

**Critério de aceite:** Fluxo de emissão de PDF claro, organizado e com feedback ao usuário.

---

## Observações Gerais
- Não quebrar funcionalidades existentes; alterações devem ser incrementais.
- Manter padrão visual consistente com o restante do sistema (cores, tipografia).
- Testar em desktop e mobile após cada alteração.
- Todas as integrações com Supabase devem tratar e exibir erros ao usuário.

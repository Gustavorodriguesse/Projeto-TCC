# Backlog 001 de Correções e Ajustes — Sistema de Gestão Portuária

> Documento de requisitos para implementação via Jules. Todas as alterações devem ser feitas com dados reais do banco de dados (Supabase), sem dados fictícios e sem armazenamento local.

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

---

## 📋 Regra de Relatório de Execução do Backlog

Ao final de cada sessão de implementação (ou ao concluir um conjunto de itens), o Jules deve gerar um **relatório de execução** contendo obrigatoriamente:

1. **Identificação dos itens:** Código do item (ex.: C1, A3), título e seção (Correção ou Ajuste).
2. **Status de cada item:**
   - ✅ **Concluído** — implementado e validado;
   - 🟡 **Parcialmente concluído** — implementado, mas pendente de validação/ajuste;
   - 🔴 **Pendente** — não iniciado ou bloqueado (com justificativa).
3. **Descrição do que foi feito:** resumo técnico das alterações (arquivos modificados, lógica implementada, tabelas/colunas afetadas no Supabase).
4. **Evidências de validação:** prints/descrição dos testes realizados, incluindo fluxo de verificação no banco de dados (ex.: carga cancelada saiu da tabela principal e apareceu na tabela de canceladas).
5. **Impactos e dependências:** itens afetados indiretamente pela alteração e itens que dependem de outros para serem concluídos.
6. **Pendências e próximos passos:** lista do que resta fazer, com prioridade sugerida.
7. **Data e responsável:** data de execução e identificação de quem executou (sessão do Jules).

**Formato de saída:** o relatório deve ser salvo como `relatorio-backlog.md` (ou `relatorio-backlog-AAAA-MM-DD.md` para histórico) e incluir um resumo executivo no topo com o percentual de conclusão do backlog (itens concluídos / total de itens).

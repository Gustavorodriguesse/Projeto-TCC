# 🛠️ Correções — Instruções para o Jules

> **Agente:** Jules
> **Objetivo:** Aplicar as correções e melhorias descritas abaixo no repositório.
> **Data da solicitação:** 22/09/2026
> **Contexto:** As correções de sincronização com o Supabase já foram resolvidas — não precisam de atenção.

---

## 📌 Tarefas

### 1. Painel Geral — cards abrindo no centro da tela
Quando o usuário clica para abrir um card, a informação aparece fora do lugar. Fazer com que as informações abram **no meio da tela**, em um modal centralizado:
- Modal sobreposto com backdrop escurecido e botão de fechar (X).
- Fechar ao clicar fora do modal ou pressionar `Esc`.

### 2. Log Geral — exibir nome do funcionário
Na tabela geral de **Log Geral**, adicionar uma coluna com o **nome do funcionário** vinculado a cada registro. Ajustar a responsividade da tabela.

### 3. Trail de Decisões — organização
Deixar a seção **Trail de Decisões** mais organizada: hierarquia visual clara, agrupamento lógico dos itens (por categoria/data) e melhor legibilidade.

### 4. Cargas e Pátio — mais opções de tipo de carga
No agendamento de uma nova carga, o campo **tipo de carga** deve oferecer **mais opções** (ex.: contêiner 20', contêiner 40', carga solta, carga fracionada, granel, reefer, carga perigosa/IMO, carga viva, projetos — adaptar à operação).
- Preferencialmente, a lista de tipos de carga deve ficar em **uma constante/arquivo compartilhado**, para reutilização.

### 5. Checklist e Inspeção — tipos de carga + checklist completo
- Incluir as **mesmas novas opções de tipo de carga** do item 4 (usando a lista compartilhada).
- Adicionar o **máximo de requisitos possíveis** ao checklist de inspeção, por exemplo:
  - Documentação (nota fiscal, conhecimento de embarque, manifesto, declaração do cliente)
  - Identificação da carga (lacre, numeração, etiquetas, placa do veículo)
  - Condições físicas (embalagem íntegra, sem avarias/umidade/vazamentos)
  - Segurança (EPIs, sinalização do pátio, escoramento da carga)
  - Equipamentos (empilhadeira conferida, calços, iluminação)
  - Conformidade (peso e quantidade conferidos, temperatura para reefer)
  - Responsável pela inspeção + data/hora + registro/assinatura

### 6. Embarcações e GPS — organização
Deixar a página **Embarcações e GPS** mais organizada: seções/cards claros (embarcações, status GPS, histórico), estados de loading e vazio amigáveis.

### 7. Delegação e Relatório/PDF — organização
Deixar as páginas **Delegação** e **Relatório/PDF** mais organizadas, com estrutura em seções, filtros bem posicionados e layout padronizado entre elas.

### 8. Logo oficial
Substituir a logo provisória (a letra **"N"** criada anteriormente) pela **logo oficial que está na pasta `design`** do repositório — em todas as telas (favicon, cabeçalho/sidebar e login).

---

## ✅ Critérios de aceite
- [ ] Modal centralizado funcionando no Painel Geral (fechar com X, clique fora e `Esc`).
- [ ] Coluna "Funcionário" visível na tabela de Log Geral.
- [ ] Trail de Decisões, Embarcações e GPS, Delegação e Relatório/PDF reorganizados.
- [ ] Lista ampliada de tipos de carga aplicada em **Cargas e Pátio** e **Checklist e Inspeção** (mesma fonte/compartilhada).
- [ ] Checklist ampliado com requisitos abrangentes.
- [ ] Logo oficial da pasta `design` aplicada em todo o sistema (nenhuma referência à logo "N").
- [ ] Todas as telas responsivas.
- [ ] Arquivo `SPECs/backlog.md` criado no repositório com todos os itens numerados, datados e com adicionado/removido/corrigido.

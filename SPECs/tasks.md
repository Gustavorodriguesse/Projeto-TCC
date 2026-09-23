# Sistema de Automação de Carregamentos para um Porto

## Decomposição de Tarefas por Fase

---

## FASE 1 — Autenticação & Controle de Acesso

### 1.1. Sistema de Login

- [x] **T1.1** — Tela de login com campo de código individual único vinculado à matrícula do funcionário.
- [x] **T1.2** — Carregamento automático do cargo pelo sistema; exibição para confirmação do usuário.
- [x] **T1.3** — Middleware/Guard de autenticação validando código individual ativo.

### 1.2. Hierarquia de Permissões (RBAC)

- [x] **T1.4** — Implementar camada de Visão Própria: filtro automático de dados pela entidade vinculada ao funcionário logado.
- [x] **T1.5** — Implementar camada de Visão Operacional (Inspetor e Supervisor): leitura de todos os dados operacionais, exceto documentação interna de funcionários e visitantes.
- [x] **T1.6** — Implementar camada de Visão Estratégica (Diretor): acesso total de leitura + dashboards exclusivos + exportação.
- [x] **T1.7** — Implementar controle de acesso às rotas/APIs por cargo (Estivador, Conferente, Arrumador, Planejador, Técnico, Supervisor, Inspetor, Diretor).

### 1.3. Gestão de Códigos de Acesso

- [x] **T1.8** — Funcionalidade para Técnico em Portos invalidar código perdido/esquecido e gerar novo código vinculado à mesma matrícula.

---

## FASE 2 — Cadastros Base (CRUDs)

### 2.1. Funcionários e Visitantes

- [x] **T2.1** — CRUD de Funcionários (dados pessoais, cargo, código individual, documentação interna) — **Técnico em Portos**.
- [x] **T2.2** — CRUD de Visitantes Temporários (nome, documento, motivo, data/hora de entrada) — **Técnico em Portos**.

### 2.2. Tipos de Carga e Rotas

- [x] **T2.3** — CRUD de Tipos de Carga (nome, categoria de risco, requisitos especiais, modelo de checklist vinculado) — **Supervisor**.
- [x] **T2.4** — CRUD de Rotas Marítimas (origem, destino, distância fixa) — **Supervisor**.

### 2.3. Equipamentos e Embarcações

- [x] **T2.5** — CRUD de Navios (nome, IMO, porto origem/destino) — **Inspetor** (cadastro inicial).
- [x] **T2.6** — CRUD de Contêineres (número de identificação, tipo de carga, material, data fabricação, data última manutenção, tempo de uso, estado, navio vinculado, **referência de tempo de uso definida pelo Supervisor: data de fabricação ou data da última manutenção**) — **Inspetor** (cadastro inicial); **Supervisor** (definição da referência de tempo de uso).
- [x] **T2.7** — CRUD de Guindastes (número de identificação, estado, data última manutenção) — **Inspetor** (cadastro inicial).

### 2.4. Atualizações Operacionais

- [x] **T2.8** — Atualização de estado e informações operacionais de Navios (estado, coordenadas, tempo fora do porto) — **Planejador de Pátio e de Navios**.
- [x] **T2.9** — Atualização de dados operacionais de Contêineres — **Planejador de Pátio e de Navios**.
- [x] **T2.10** — Registro de horário de chegada dos navios ao porto (data/hora) — **Supervisor**.

---

## FASE 3 — Fluxo de Cargas (Core Business)

### 3.1. Cadastro e Agendamento

- [x] **T3.1** — Cadastro de Carga com atributos obrigatórios (peso, volume, valor declarado, natureza, tipo vinculado, porto de descarga, destino e demais atributos definidos pelo Supervisor).
- [x] **T3.2** — Validação: agendamento só permitido se Tipo de Carga já cadastrado com checklist.
- [x] **T3.3** — Validação: cargas sem agendamento prévio têm aceitação negada no recebimento.
- [x] **T3.4** — Geração automática de QR Code único no primeiro cadastro da carga.
- [x] **T3.5** — Geração automática de QR Code único no primeiro cadastro do contêiner.

### 3.2. Recebimento e Inspeção

- [x] **T3.6** — Registro de recebimento físico (data/hora chegada, quantidade, estado geral) — **Conferente**.
- [x] **T3.7** — Tela de inspeção técnica formal com checklist dinâmico conforme Tipo de Carga — **Inspetor**.
- [x] **T3.8** — Regra: aprovação só se todos os itens críticos do checklist estiverem "Conforme".
- [x] **T3.9** — Fluxo de Aprovação: carga segue para armazenagem.
- [x] **T3.10** — Fluxo de Recusa: registro de data, motivo (texto livre) e cargo responsável; status permanece **RECUSADA**.

### 3.3. Armazenagem e Vinculação

- [x] **T3.11** — Status de Armazenagem (estoque no pátio).
- [x] **T3.12** — Vinculação Carga → Contêiner → Navio (registro no sistema, sem estado separado).
- [x] **T3.13** — Regra de negócio: navio em reforma ou agendado para reforma não pode receber carga.

### 3.4. Preparação e Liberação

- [x] **T3.14** — Alteração de status para "Pronta para Entrega" — **Arrumador e Consertador**.
- [x] **T3.15** — Liberação de saída de cargas individualmente — **Supervisor**.
- [x] **T3.16** — Liberação de navio para saída (implica liberação automática de todos os contêineres/cargas vinculados) — **Supervisor**.
- [x] **T3.17** — Registro de data, hora e destino na liberação do navio.
- [x] **T3.18** — Cálculo automático de estimativa de chegada (distância da rota / 33 km/h).
- [x] **T3.19** — Bloqueio de liberação se rota entre origem e destino não estiver cadastrada.

### 3.5. Trânsito e Entrega

- [x] **T3.20** — Status "Em Trânsito" após liberação do navio.
- [x] **T3.21** — Status "Entregue" quando navio localização = `NO_PORTO_DE_DESTINO` ou confirmação manual do Supervisor.
- [x] **T3.22** — Propagação automática de estado/localização do navio/contêiner para cargas vinculadas.

### 3.6. Cancelamento

- [x] **T3.23** — Cancelamento de entrega pelo Supervisor (só permitido nos estados: Agendamento, Armazenagem, Pronta para Entrega).
- [x] **T3.24** — Registro obrigatório de motivo no cancelamento.

---

## FASE 4 — Manutenções e Emergências

### 4.1. Gestão de Manutenções

- [x] **T4.1** — Registro de estado de navios/contêineres: Operante, Agendado para reforma, Em reforma, Aprovado para reforma — **Inspetor**.
- [x] **T4.2** — Solicitação de manutenção de navios e guindastes — **Supervisor**.
- [x] **T4.3** — Aprovação/Recusa de manutenções — **Supervisor**.
- [x] **T4.4** — Histórico de manutenções (data, descrição dos serviços) para navios, contêineres e guindastes.
- [x] **T4.5** — Coordenação de procedimentos de emergência e acionamento de alarmes — **Inspetor**.
- [x] **T4.6** — Sugestão automática de manutenção preventiva (ciclos de 3 anos a partir do cadastro ou última manutenção).

---

## FASE 5 — QR Code e Etiquetas

### 5.1. Geração

- [x] **T5.1** — Geração de QR Code único no cadastro de carga e contêiner (codificando URL interna ou identificador cru).
- [x] **T5.2** — Tela de confirmação de cadastro exibindo QR Code gerado em tempo real.

### 5.2. Impressão

- [x] **T5.3** — Geração de PDF de etiqueta padronizado (10×10 cm ou 10×15 cm) com QR Code centralizado, número da entidade, tipo de carga e data.
- [x] **T5.4** — Botão "Imprimir Etiqueta" na tela de confirmação e nas telas de consulta.
- [x] **T5.5** — Funcionalidade de reimpressão (mesmo QR Code, sem gerar novo) com registro no log.

### 5.3. Leitura no Pátio

- [x] **T5.6** — Leitor de QR Code via câmera do dispositivo móvel dentro do sistema (navegador).
- [x] **T5.7** — Redirecionamento direto para tela da entidade escaneada conforme cargo do usuário:

- Estivador → movimentação
- Conferente → recebimento/condições de saída
- Inspetor → checklist de inspeção
- Arrumador → alterar status "pronta para entrega"
- Supervisor → visualizar cargas vinculadas ao contêiner

- [x] **T5.8** — Registro de leitura (scan) no log de alterações (funcionário, data/hora, entidade).
- [x] **T5.9** — Validação de autenticação obrigatória para acesso via QR Code.

---

## FASE 6 — Dashboards, Pesquisa e Relatórios

### 6.1. Dashboards Operacionais

- [x] **T6.1** — Cards de visão geral: navios em manutenção, navios fora do porto, cargas em armazenagem, cargas prontas aguardando liberação, cargas recusadas, ocupação do pátio, navios com manutenção preventiva sugerida (>3 anos).
- [x] **T6.2** — Acesso restrito a Supervisor, Inspetor e cargos superiores.
- [x] **T6.3** — Navegação de card para página de detalhes.
- [x] **T6.4** — Atualização periódica (diária ou por hora).

### 6.2. Dashboards Estratégicos (Diretor)

- [x] **T6.5** — Dashboards exclusivos com gráficos: taxa de aprovação/recusa, tempo médio de permanência, navios mais utilizados, produtividade por cargo.
- [x] **T6.6** — Exportação de dados históricos.

### 6.3. Pesquisa

- [x] **T6.7** — Tela de pesquisa com filtros: nome do navio, número do contêiner, tipo de carga, período de data, status do fluxo.

### 6.4. Relatórios

- [x] **T6.8** — Relatório PDF A4 em 4 seções (Dados da Carga, Dados do Navio, Dados do Contêiner, Resumo do Fluxo).
- [x] **T6.9** — Relatório de Produtividade por cargo e funcionário (volume de operações).
- [x] **T6.10** — Acesso ao relatório de produtividade: Diretor, Inspetor e próprio funcionário (visão restrita a si mesmo).

---

## FASE 7 — Logs, Trail e Auditoria

### 7.1. Log de Alterações

- [x] **T7.1** — Registro automático de todas as alterações: data/hora, cargo, código individual do usuário, entidade alterada, tipo de alteração (criação, edição, exclusão).
- [x] **T7.2** — Tela de consulta do log de alterações.

### 7.2. Trail de Decisões Críticas

- [x] **T7.3** — Registro imutável de decisões de alto impacto:

- Inspetor: Aprovou Carga, Recusou Carga, Solicitou Manutenção de Navio/Contêiner.
- Supervisor: Liberou Navio, Cancelou Entrega, Aprovou Manutenção, Recusou Manutenção, Designou Substituto.

- [x] **T7.4** — Funcionalidade de retificação vinculada ao registro original (enquanto entidade não avançar de estado).
- [x] **T7.5** — Tela separada de consulta do trail de decisões.

### 7.3. Delegação de Supervisor

- [x] **T7.6** — Funcionalidade de designação de substituto temporário com poderes de liberação — **Supervisor**.
- [x] **T7.7** — Registro de período de vigência da delegação.
- [x] **T7.8** — Regra: apenas um substituto ativo por Supervisor.
- [x] **T7.9** — Revogação antecipada da delegação pelo Supervisor titular.

---

## FASE 8 — Localização e Tempos

### 8.1. Localização dos Navios

- [x] **T8.1** — Registro de coordenadas GPS marítimas fictícias.
- [x] **T8.2** — Classificação: `DENTRO_DO_PORTO`, `FORA_DO_PORTO`, `NO_PORTO_DE_DESTINO`.
- [x] **T8.3** — Cálculo de estimativa de tempo de chegada baseado em rota pré-cadastrada.

### 8.2. Cálculos de Tempo

- [x] **T8.4** — Tempo de permanência da carga no porto.
- [x] **T8.5** — Tempo de carga fora do porto para entrega.
- [x] **T8.6** — Tempo total do navio fora do porto.

---

## FASE 9 — Testes, Integração e Implantação

### 9.1. Testes

- [x] **T9.1** — Testes unitários das regras de negócio (especialmente fluxo de cargas e permissões).
- [x] **T9.2** — Testes de integração do fluxo completo de carga (Agendamento → Entregue).
- [x] **T9.3** — Testes de segurança (autenticação, autorização por cargo, acesso negado a dados de outros).
- [x] **T9.4** — Testes de geração e leitura de QR Code.
- [x] **T9.5** — Testes de geração de PDF (etiquetas e relatórios).

### 9.2. Documentação

- [x] **T9.6** — Manual de usuário por cargo.

### 9.3. Implantação

- [x] **T9.9** — Configuração de ambiente de produção (acesso interno do porto, sem clientes externos).
- [x] **T9.10** — Treinamento dos funcionários por perfil de cargo.

---

## Dependências Críticas (Ordem de Execução)

```javascript
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

---

## Glossário de Códigos de Tarefa

| Código | Fase | Descrição Resumida |
| --- | --- | --- |
| T1.x | Fase 1 | Autenticação e Permissões |
| T2.x | Fase 2 | Cadastros Base |
| T3.x | Fase 3 | Fluxo de Cargas |
| T4.x | Fase 4 | Manutenções e Emergências |
| T5.x | Fase 5 | QR Code e Etiquetas |
| T6.x | Fase 6 | Dashboards e Relatórios |
| T7.x | Fase 7 | Logs, Trail e Delegação |
| T8.x | Fase 8 | Localização e Tempos |
| T9.x | Fase 9 | Testes e Implantação |

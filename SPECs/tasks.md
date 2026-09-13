# Sistema de Automação de Carregamentos para um Porto

## Decomposição de Tarefas por Fase

---

## FASE 1 — Fundação & Modelagem

### 1.1. Modelagem do Domínio

- [ ] **T1.1** — Produzir Diagrama de Casos de Uso (UML) mapeando todos os 9 cargos/perfis e suas interações com o sistema.
- [ ] **T1.2** — Produzir Diagrama de Classes (UML) com entidades: Navio, Contêiner, Carga, Funcionário, Manutenção, Checklist, Tipo de Carga, Rota Marítima, Guindaste, Trail de Decisões, Log de Alterações, Visitante.
- [ ] **T1.3** — Produzir Diagrama de Estados da Carga (State Machine UML) contemplando as 8 etapas do fluxo + transições de aprovação, recusa e cancelamento.
- [ ] **T1.4** — Produzir Wireframes das telas principais: login, dashboard por cargo, cadastros (navio, contêiner, carga, funcionário), inspeção com checklist, liberação pelo Supervisor, trail de decisões, geração/impressão de etiqueta QR Code.

### 1.2. Arquitetura & Banco de Dados

- [ ] **T1.5** — Definir modelo relacional (MER) e dicionário de dados com tipos, constraints e índices.
- [ ] **T1.6** — Criar scripts DDL para criação de todas as tabelas e relacionamentos.
- [ ] **T1.7** — Implementar seed de dados iniciais (cargos, tipos de carga de exemplo, usuários admin de teste).
- [ ] **T1.8** — Definir estratégia de geração de código individual único por funcionário (vinculado à matrícula).

---

## FASE 2 — Autenticação & Controle de Acesso

### 2.1. Sistema de Login

- [ ] **T2.1** — Tela de login com campo de código individual único vinculado à matrícula do funcionário.
- [ ] **T2.2** — Carregamento automático do cargo pelo sistema; exibição para confirmação do usuário.
- [ ] **T2.3** — Middleware/Guard de autenticação validando código individual ativo.

### 2.2. Hierarquia de Permissões (RBAC)

- [ ] **T2.4** — Implementar camada de Visão Própria: filtro automático de dados pela entidade vinculada ao funcionário logado.
- [ ] **T2.5** — Implementar camada de Visão Operacional (Inspetor e Supervisor): leitura de todos os dados operacionais, exceto documentação interna de funcionários e visitantes.
- [ ] **T2.6** — Implementar camada de Visão Estratégica (Diretor): acesso total de leitura + dashboards exclusivos + exportação.
- [ ] **T2.7** — Implementar controle de acesso às rotas/APIs por cargo (Estivador, Conferente, Arrumador, Planejador, Técnico, Supervisor, Inspetor, Diretor).

### 2.3. Gestão de Códigos de Acesso

- [ ] **T2.8** — Funcionalidade para Técnico em Portos invalidar código perdido/esquecido e gerar novo código vinculado à mesma matrícula.

---

## FASE 3 — Cadastros Base (CRUDs)

### 3.1. Funcionários e Visitantes

- [ ] **T3.1** — CRUD de Funcionários (dados pessoais, cargo, código individual, documentação interna) — **Técnico em Portos**.
- [ ] **T3.2** — CRUD de Visitantes Temporários (nome, documento, motivo, data/hora de entrada) — **Técnico em Portos**.

### 3.2. Tipos de Carga e Rotas

- [ ] **T3.3** — CRUD de Tipos de Carga (nome, categoria de risco, requisitos especiais, modelo de checklist vinculado) — **Supervisor**.
- [ ] **T3.4** — CRUD de Rotas Marítimas (origem, destino, distância fixa) — **Supervisor**.

### 3.3. Equipamentos e Embarcações

- [ ] **T3.5** — CRUD de Navios (nome, IMO, porto origem/destino) — **Inspetor** (cadastro inicial).
- [ ] **T3.6** — CRUD de Contêineres (número de identificação, tipo de carga, material, data fabricação, data última manutenção, tempo de uso, estado, navio vinculado, **referência de tempo de uso definida pelo Supervisor: data de fabricação ou data da última manutenção**) — **Inspetor** (cadastro inicial); **Supervisor** (definição da referência de tempo de uso).
- [ ] **T3.7** — CRUD de Guindastes (número de identificação, estado, data última manutenção) — **Inspetor** (cadastro inicial).

### 3.4. Atualizações Operacionais

- [ ] **T3.8** — Atualização de estado e informações operacionais de Navios (estado, coordenadas, tempo fora do porto) — **Planejador de Pátio e de Navios**.
- [ ] **T3.9** — Atualização de dados operacionais de Contêineres — **Planejador de Pátio e de Navios**.
- [ ] **T3.10** — Registro de horário de chegada dos navios ao porto (data/hora) — **Supervisor**.

---

## FASE 4 — Fluxo de Cargas (Core Business)

### 4.1. Cadastro e Agendamento

- [ ] **T4.1** — Cadastro de Carga com atributos obrigatórios (peso, volume, valor declarado, natureza, tipo vinculado, porto de descarga, destino e demais atributos definidos pelo Supervisor).
- [ ] **T4.2** — Validação: agendamento só permitido se Tipo de Carga já cadastrado com checklist.
- [ ] **T4.3** — Validação: cargas sem agendamento prévio têm aceitação negada no recebimento.
- [ ] **T4.4** — Geração automática de QR Code único no primeiro cadastro da carga.
- [ ] **T4.5** — Geração automática de QR Code único no primeiro cadastro do contêiner.

### 4.2. Recebimento e Inspeção

- [ ] **T4.6** — Registro de recebimento físico (data/hora chegada, quantidade, estado geral) — **Conferente**.
- [ ] **T4.7** — Tela de inspeção técnica formal com checklist dinâmico conforme Tipo de Carga — **Inspetor**.
- [ ] **T4.8** — Regra: aprovação só se todos os itens críticos do checklist estiverem "Conforme".
- [ ] **T4.9** — Fluxo de Aprovação: carga segue para armazenagem.
- [ ] **T4.10** — Fluxo de Recusa: registro de data, motivo (texto livre) e cargo responsável; status permanece **RECUSADA**.

### 4.3. Armazenagem e Vinculação

- [ ] **T4.11** — Status de Armazenagem (estoque no pátio).
- [ ] **T4.12** — Vinculação Carga → Contêiner → Navio (registro no sistema, sem estado separado).
- [ ] **T4.13** — Regra de negócio: navio em reforma ou agendado para reforma não pode receber carga.

### 4.4. Preparação e Liberação

- [ ] **T4.14** — Alteração de status para "Pronta para Entrega" — **Arrumador e Consertador**.
- [ ] **T4.15** — Liberação de saída de cargas individualmente — **Supervisor**.
- [ ] **T4.16** — Liberação de navio para saída (implica liberação automática de todos os contêineres/cargas vinculados) — **Supervisor**.
- [ ] **T4.17** — Registro de data, hora e destino na liberação do navio.
- [ ] **T4.18** — Cálculo automático de estimativa de chegada (distância da rota / 33 km/h).
- [ ] **T4.19** — Bloqueio de liberação se rota entre origem e destino não estiver cadastrada.

### 4.5. Trânsito e Entrega

- [ ] **T4.20** — Status "Em Trânsito" após liberação do navio.
- [ ] **T4.21** — Status "Entregue" quando navio localização = `NO_PORTO_DE_DESTINO` ou confirmação manual do Supervisor.
- [ ] **T4.22** — Propagação automática de estado/localização do navio/contêiner para cargas vinculadas.

### 4.6. Cancelamento

- [ ] **T4.23** — Cancelamento de entrega pelo Supervisor (só permitido nos estados: Agendamento, Armazenagem, Pronta para Entrega).
- [ ] **T4.24** — Registro obrigatório de motivo no cancelamento.

---

## FASE 5 — Manutenções e Emergências

### 5.1. Gestão de Manutenções

- [ ] **T5.1** — Registro de estado de navios/contêineres: Operante, Agendado para reforma, Em reforma, Aprovado para reforma — **Inspetor**.
- [ ] **T5.2** — Solicitação de manutenção de navios e guindastes — **Supervisor**.
- [ ] **T5.3** — Aprovação/Recusa de manutenções — **Supervisor**.
- [ ] **T5.4** — Histórico de manutenções (data, descrição dos serviços) para navios, contêineres e guindastes.
- [ ] **T5.5** — Coordenação de procedimentos de emergência e acionamento de alarmes — **Inspetor**.
- [ ] **T5.6** — Sugestão automática de manutenção preventiva (ciclos de 3 anos a partir do cadastro ou última manutenção).

---

## FASE 6 — QR Code e Etiquetas

### 6.1. Geração

- [ ] **T6.1** — Geração de QR Code único no cadastro de carga e contêiner (codificando URL interna ou identificador cru).
- [ ] **T6.2** — Tela de confirmação de cadastro exibindo QR Code gerado em tempo real.

### 6.2. Impressão

- [ ] **T6.3** — Geração de PDF de etiqueta padronizado (10×10 cm ou 10×15 cm) com QR Code centralizado, número da entidade, tipo de carga e data.
- [ ] **T6.4** — Botão "Imprimir Etiqueta" na tela de confirmação e nas telas de consulta.
- [ ] **T6.5** — Funcionalidade de reimpressão (mesmo QR Code, sem gerar novo) com registro no log.

### 6.3. Leitura no Pátio

- [ ] **T6.6** — Leitor de QR Code via câmera do dispositivo móvel dentro do sistema (navegador).
- [ ] **T6.7** — Redirecionamento direto para tela da entidade escaneada conforme cargo do usuário:

- Estivador → movimentação
- Conferente → recebimento/condições de saída
- Inspetor → checklist de inspeção
- Arrumador → alterar status "pronta para entrega"
- Supervisor → visualizar cargas vinculadas ao contêiner

- [ ] **T6.8** — Registro de leitura (scan) no log de alterações (funcionário, data/hora, entidade).
- [ ] **T6.9** — Validação de autenticação obrigatória para acesso via QR Code.

---

## FASE 7 — Dashboards, Pesquisa e Relatórios

### 7.1. Dashboards Operacionais

- [ ] **T7.1** — Cards de visão geral: navios em manutenção, navios fora do porto, cargas em armazenagem, cargas prontas aguardando liberação, cargas recusadas, ocupação do pátio, navios com manutenção preventiva sugerida (>3 anos).
- [ ] **T7.2** — Acesso restrito a Supervisor, Inspetor e cargos superiores.
- [ ] **T7.3** — Navegação de card para página de detalhes.
- [ ] **T7.4** — Atualização periódica (diária ou por hora).

### 7.2. Dashboards Estratégicos (Diretor)

- [ ] **T7.5** — Dashboards exclusivos com gráficos: taxa de aprovação/recusa, tempo médio de permanência, navios mais utilizados, produtividade por cargo.
- [ ] **T7.6** — Exportação de dados históricos.

### 7.3. Pesquisa

- [ ] **T7.7** — Tela de pesquisa com filtros: nome do navio, número do contêiner, tipo de carga, período de data, status do fluxo.

### 7.4. Relatórios

- [ ] **T7.8** — Relatório PDF A4 em 4 seções (Dados da Carga, Dados do Navio, Dados do Contêiner, Resumo do Fluxo).
- [ ] **T7.9** — Relatório de Produtividade por cargo e funcionário (volume de operações).
- [ ] **T7.10** — Acesso ao relatório de produtividade: Diretor, Inspetor e próprio funcionário (visão restrita a si mesmo).

---

## FASE 8 — Logs, Trail e Auditoria

### 8.1. Log de Alterações

- [ ] **T8.1** — Registro automático de todas as alterações: data/hora, cargo, código individual do usuário, entidade alterada, tipo de alteração (criação, edição, exclusão).
- [ ] **T8.2** — Tela de consulta do log de alterações.

### 8.2. Trail de Decisões Críticas

- [ ] **T8.3** — Registro imutável de decisões de alto impacto:

- Inspetor: Aprovou Carga, Recusou Carga, Solicitou Manutenção de Navio/Contêiner.
- Supervisor: Liberou Navio, Cancelou Entrega, Aprovou Manutenção, Recusou Manutenção, Designou Substituto.

- [ ] **T8.4** — Funcionalidade de retificação vinculada ao registro original (enquanto entidade não avançar de estado).
- [ ] **T8.5** — Tela separada de consulta do trail de decisões.

### 8.3. Delegação de Supervisor

- [ ] **T8.6** — Funcionalidade de designação de substituto temporário com poderes de liberação — **Supervisor**.
- [ ] **T8.7** — Registro de período de vigência da delegação.
- [ ] **T8.8** — Regra: apenas um substituto ativo por Supervisor.
- [ ] **T8.9** — Revogação antecipada da delegação pelo Supervisor titular.

---

## FASE 9 — Localização e Tempos

### 9.1. Localização dos Navios

- [ ] **T9.1** — Registro de coordenadas GPS marítimas fictícias.
- [ ] **T9.2** — Classificação: `DENTRO_DO_PORTO`, `FORA_DO_PORTO`, `NO_PORTO_DE_DESTINO`.
- [ ] **T9.3** — Cálculo de estimativa de tempo de chegada baseado em rota pré-cadastrada.

### 9.2. Cálculos de Tempo

- [ ] **T9.4** — Tempo de permanência da carga no porto.
- [ ] **T9.5** — Tempo de carga fora do porto para entrega.
- [ ] **T9.6** — Tempo total do navio fora do porto.

---

## FASE 10 — Testes, Integração e Implantação

### 10.1. Testes

- [ ] **T10.1** — Testes unitários das regras de negócio (especialmente fluxo de cargas e permissões).
- [ ] **T10.2** — Testes de integração do fluxo completo de carga (Agendamento → Entregue).
- [ ] **T10.3** — Testes de segurança (autenticação, autorização por cargo, acesso negado a dados de outros).
- [ ] **T10.4** — Testes de geração e leitura de QR Code.
- [ ] **T10.5** — Testes de geração de PDF (etiquetas e relatórios).

### 10.2. Documentação

- [ ] **T10.6** — Documentação técnica da API (se aplicável).
- [ ] **T10.7** — Manual de usuário por cargo.
- [ ] **T10.8** — Revisão final dos artefatos de modelagem (casos de uso, classes, estados, wireframes).

### 10.3. Implantação

- [ ] **T10.9** — Configuração de ambiente de produção (acesso interno do porto, sem clientes externos).
- [ ] **T10.10** — Treinamento dos funcionários por perfil de cargo.

---

## Dependências Críticas (Ordem de Execução)

```javascript
T1.5 (Modelo BD) → T2.x (Autenticação) → T3.x (Cadastros Base)
                                    ↓
T3.3 (Tipo de Carga) → T4.2 (Agendamento) → T4.x (Fluxo de Cargas)
                                    ↓
T3.5 (Navio) + T3.6 (Contêiner) → T4.12 (Vinculação) → T4.16 (Liberação)
                                    ↓
T4.1 (Carga) → T6.1 (QR Code) → T6.6 (Leitura QR)
                                    ↓
T8.1 (Log) + T8.3 (Trail) → T10.2 (Testes Integração)
```

---

## Glossário de Códigos de Tarefa

| Código | Fase | Descrição Resumida |
| --- | --- | --- |
| T1.x | Fase 1 | Modelagem e Arquitetura |
| T2.x | Fase 2 | Autenticação e Permissões |
| T3.x | Fase 3 | Cadastros Base |
| T4.x | Fase 4 | Fluxo de Cargas |
| T5.x | Fase 5 | Manutenções e Emergências |
| T6.x | Fase 6 | QR Code e Etiquetas |
| T7.x | Fase 7 | Dashboards e Relatórios |
| T8.x | Fase 8 | Logs, Trail e Delegação |
| T9.x | Fase 9 | Localização e Tempos |
| T10.x | Fase 10 | Testes e Implantação |

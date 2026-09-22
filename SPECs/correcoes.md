# 📋 Documento Integrado de Refatoração, Diagnóstico & Conformidade (NexusPort)

**Para:** Jules (Desenvolvedor Lead)  
**De:** Equipe de Qualidade e Operações  
**Data:** 21 de Setembro de 2026  
**Referência:** Especificação Funcional do Sistema (`Spec.md`)  
**Projeto Supabase:** `TCC - Automação Para um Sistema de Cargas de um Porto`  
**Ambiente:** NexusPort Terminal STS-01 — Porto de Santos  

---

## 🎯 Objetivo Geral
Este documento consolida todas as inconsistências técnicas, erros de segurança, falhas de integração com o Supabase e desalinhamentos com a `Spec.md`. Ele serve como **guia definitivo de refatoração** para adequação do sistema.

---

## 🚨 1. DIRETRIZ ARQUITETURAL DE ALTA PRIORIDADE

> **NÃO MANTENHA TODO O SISTEMA EM UMA ÚNICA PÁGINA MONOLÍTICA (`dashboard.html`).**
> 
> O sistema deve ser dividido em **páginas HTML dedicadas por módulo/funcionalidade**, compartilhando uma **Barra Lateral de Navegação (Sidebar Persistente)** para transição rápida entre as áreas operacionais.

### Requisitos da Barra Lateral (Sidebar Persistente):
- **Posição:** Fixa à esquerda em todas as telas internas.
- **Cabeçalho:** Nome, Cargo, Código/Matrícula do usuário logado e Badge da **Camada de Visão (RLS)** ativa.
- **Links do Menu:**
  - 📊 `Painel Geral` (`dashboard.html`)
  - 📦 `Cargas & Pátio` (`cargas.html`)
  - 🔍 `Inspeção & Checklist` (`inspecao.html`)
  - 📷 `Scanner QR Code` (`scanner.html` / Modal Câmera)
  - 🚢 `Embarcações & GPS` (`embarcacoes.html`)
  - 🛠️ `Manutenção & OS` (`manutencao.html`)
  - 👥 `Delegação de Supervisor` (`delegacao.html`)
  - 💼 `Gestão de Pessoas / Visitantes` (`tecnico_portos.html` - Restrito)
  - 📈 `Relatórios & PDF` (`relatorios.html`)
  - 🚪 `Sair` (Encerra sessão → `index.html`)

---

## 🏛️ 2. Divisão Obrigatória da Arquitetura de Páginas

1. **`index.html` (Tela de Autenticação):**
   - Formulário de Login por Código Individual.
   - **(RF 1 / RN 15):** Validação obrigatória do código no Supabase e modal de **Confirmação do Cargo** antes de conceder acesso.

2. **`dashboard.html` (Visão Geral & Indicadores):**
   - Exclusivamente os **7 Cards Indicadores Operacionais** (RF 7).
   - Tabela de **Log Geral de Alterações** (RF 12).
   - Tabela do **Trail de Decisões Críticas Imutável** com suporte a `[Anexar Retificação]` (RF 13).

3. **`cargas.html` (Gestão de Cargas & Pátio):**
   - Tabela do Fluxo de Cargas nas 8 Etapas (RF 6).
   - **(RF 1):** Ocultação rigorosa dos botões de ação que não pertençam ao cargo autenticado.
   - Modal de Agendamento com confirmação automática exibindo o QR Code gerado em tempo real (RF 17.1).

4. **`inspecao.html` (Inspeção com Checklist - RF 9 & RN 14):**
   - Interface para o Inspetor realizar a inspeção técnica e preencher os itens do checklist.

5. **`scanner.html` (Leitor QR via Câmera - RF 17.3 & RN 19):**
   - Leitor de QR Code integrado à câmera do navegador/dispositivo móvel via API `getUserMedia`.
   - Direcionamento automático para a ficha da carga ou contêiner escaneado.

6. **`embarcacoes.html` (Gestão de Navios, Contêineres & GPS - RF 2, 4, 5, 8):**
   - Tabela de localização GPS marítima, estimativas a 33 km/h e monitoramento de navios e contêineres.

7. **`manutencao.html` (Gestão de Manutenções & Guindastes - RF 2, 3, 7):**
   - Gestão de Ordens de Serviço (OS), histórico de manutenções, alerta de ciclo preventivo (>3 anos) e botão de emergência.

8. **`delegacao.html` (Delegação de Supervisor - RF 14):**
   - Painel para o Supervisor designar e revogar o substituto temporário ativo (máximo 1 ativo por vez).

9. **`tecnico_portos.html` (Módulo do Técnico em Portos - RF 15):**
   - Cadastro e documentação interna de funcionários e controle do livro/ficha de visitantes temporários.

10. **`relatorios.html` (Relatórios & PDF - RF 11 & 16):**
    - Gerador de Relatório PDF A4 estruturado rigidamente em **4 seções sequenciais** (*Dados da Carga, Dados do Navio, Dados do Contêiner, Resumo do Fluxo*) e painel de produtividade.

---

## 🔒 3. Diagnóstico de Inconsistências & Erros do Sistema

### A. Autenticação & Tela de Login (`index.html`)
* ❌ **Login Aceita Códigos Inexistentes/Inválidos:** O sistema atualmente permite a entrada com qualquer texto digitado sem validar a existência do funcionário na base de dados.
  * **Correção (RF 1 / RN 15):** O botão de login deve realizar uma consulta (`SELECT`) na tabela de funcionários no Supabase. Se não existir, deve bloquear o acesso. Se existir, deve abrir o modal exibindo o **nome e cargo do usuário para confirmação** antes de redirecionar ao dashboard.
* ❌ **Placeholder Desconectado:** O campo de exemplo exibe `NX-8821-SP`, devendo ser corrigido para os prefixos oficiais (`EST`, `CONF`, `INSP`, `SUP`, etc.).

### B. Gestão de Cargas e Permissões (`cargas.html`)
* ❌ **Violação das Permissões por Cargo (RF 1):** Na visão do Inspetor, a tabela exibe botões como `[Receber]`, `[Vincular]`, `[Pronta]` e `[Liberar]`. A visão do Inspetor é estritamente de **leitura** sobre estas fases. Ocultar botões que não pertencem ao perfil logado.
* ❌ **Ausência de Confirmação Automática de QR Code (RF 17.1):** O cadastro de nova carga não abre o pop-up com o QR Code gerado em tempo real.
* ❌ **Ausência de Leitor Câmera (RF 17.3):** Falta o modal de scanner com integração via `getUserMedia`.

### C. Embarcações e Rastreamento (`embarcacoes.html`)
* ❌ **Inconsistência no Tempo de Navio no Destino (RF 5 & RN 8):** O navio *MV Atlantic Breeze* é classificado como `NO_PORTO_DE_DESTINO`, contudo indica *"12d 0h fora do porto"*. A contagem deve ser pausada/finalizada após a atracação no destino.

---

## 🚨 4. Inconsistências na Base de Dados e Supabase

### 1. Elevada Taxa de Erros na API Gateway (64.8% Success Rate)
* **Inconsistência:** O painel do Supabase indica **27 Erros** e **62 Warnings** de um total de 91 requisições.
* **Causa:** O frontend realiza chamadas para colunas/tabelas inexistentes ou envia dados com tipos incompatíveis.
* **Ação:** Checar **`Logs` -> `API Gateway`** no Supabase e corrigir as requisições no JavaScript.

### 2. Ausência de Versionamento de Migrações (`LAST MIGRATION: No migrations`)
* **Inconsistência:** As tabelas foram criadas visualmente no *Table Editor* sem uso de migrações SQL.
* **Ação:** Extrair o script DDL (`CREATE TABLE`, `ALTER TABLE`) via **SQL Editor** do Supabase e commitar o arquivo `.sql` na raiz do repositório GitHub (`SANTCC/Projeto-TCC`).

### 3. Falta de Políticas RLS (Row Level Security) nas Tabelas (RF 1)
* **Inconsistência:** O controle de visão (*Própria, Operacional, Estratégica*) está apenas no frontend, permitindo vulnerabilidade a acessos diretos via API.
* **Ação:** Ativar **Row Level Security (RLS)** em todas as tabelas no Supabase (`Authentication -> Policies`) e criar regras de leitura/escrita por perfil de cargo.

---

## ⚙️ 5. Regras de Negócio e Travas de Código Obrigatórias

1. **Trava de Pré-requisito do Tipo de Carga (RF 2 & RN 13):** Impedir o agendamento de cargas cujo tipo não possua checklist pré-cadastrado pelo Supervisor.
2. **Validação de Itens Críticos no Checklist (RF 9 & RN 14):** O botão **"Aprovar Carga"** em `inspecao.html` só pode ser liberado se **100% dos itens críticos** estiverem como "Conforme".
3. **Seletor de Referência de Tempo de Contêiner (RN 7):** Incluir campo obrigatório no cadastro para escolher entre *Data de Fabricação* ou *Data da Última Manutenção*.
4. **Bloqueio de Saída sem Rota (RN 9):** Bloquear a liberação de navios que não possuam rota cadastrada com distância fixa.
5. **Propagação Automática de Status via Trigger (RN 12):** Alterações no status/localização do navio devem propagar em cascata para contêineres e cargas vinculadas via *Trigger* em PL/pgSQL no Supabase.
6. **Delegação Única de Supervisor (RF 14):** Garantir o limite rígido de apenas 1 substituto ativo por vez com botão de revogação.
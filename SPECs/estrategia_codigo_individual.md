# Estratégia de Geração e Gestão do Código Individual Único — NexusPort

Este documento especifica o padrão de formato, regras de geração, mecânica de armazenamento seguro e o fluxo operacional de reemissão para o **Código Individual Único** do sistema **NexusPort**, alinhado ao Requisito Funcional 1, Regra de Negócio 15 e seções 6 e 11 de `SPECs/agents.md`.

---

## 1. Padrão de Formatação

O código individual único do funcionário deve seguir uma estrutura padronizada de leitura rápida, legível em cartões ou telas mobile de pátio:

```text
[PREFIXO SISTEMA]-[DÍGITOS ALEATÓRIOS/SEQUENCIAIS]-[SIGLA CARGO]
```

Exemplo: `NX-8821-SP` ou `NX-1001-ES`

- **Prefixo do Sistema (`NX`):** Identificador do ecossistema NexusPort.
- **Números (`4 dígitos`):** Sequencial com hash de entropia baseado na matrícula.
- **Sigla do Cargo (`2 letras`):**
  - `ES`: Estivador
  - `CF`: Conferente de Carga
  - `AR`: Arrumador e Consertador
  - `PL`: Planejador de Pátio e Navios
  - `TP`: Técnico em Portos
  - `SP`: Supervisor / Gerente de Operações
  - `IN`: Inspetor
  - `DL`: Diretor de Operações e Logística
  - `DP`: Diretor-Presidente / Superintendente / Conselho

---

## 2. Regras de Geração e Unicidade

1. **Vínculo Obrigatório com a Matrícula:** Cada funcionário possui exatamente uma `matricula` ativa e um `codigo_individual` único associado.
2. **Garantia no Banco de Dados:** A coluna `codigo_individual` da tabela `funcionarios` possui a constraint `UNIQUE NOT NULL`.
3. **Algoritmo de Geração:**
   - No cadastro inicial (realizado pelo Técnico em Portos), o sistema gera o código automaticamente concatenando `NX-` + 4 dígitos pseudoaleatórios não conflitantes + sigla do cargo.
   - Em caso de colisão no banco (`duplicate key`), o algoritmo gera novos dígitos até obter uma chave única.

---

## 3. Armazenamento e Autenticação Segura (Supabase / Postgres)

1. **Hash de Verificação:** Para garantir a segurança em caso de vazamento do banco, o código é armazenado em formato Hash (bcrypt / pgcrypto) na tabela de credenciais ou validado via Supabase Auth custom claims.
2. **Resolução de Cargo Sem Seleção Manual:**
   - Durante o login, o funcionário digita apenas o código individual único.
   - A API backend pesquisa a credencial correspondente e retorna os dados do usuário, incluindo o **cargo**, que é exibido no front-end em um campo desabilitado (`readonly`/`disabled`), servindo apenas para confirmação.

---

## 4. Reemissão por Perda ou Esquecimento (RN 15 / T2.8)

Conforme a Regra de Negócio 15 do `Spec.md`:
> *"Em caso de perda ou esquecimento do código, o Técnico em Portos é responsável por invalidar o código anterior e gerar um novo, vinculado à mesma matrícula."*

### Fluxo Operacional de Reemissão:
1. O funcionário solicita a troca presencialmente ao **Técnico em Portos**.
2. O Técnico em Portos acessa a tela de **Gestão de Funcionários** (`/tecnico/funcionarios`).
3. Seleciona o funcionário pela matrícula e clica na ação **"Invalidar e Reemitir Código"**.
4. O sistema:
   - Invalida e revoga o código individual anterior.
   - Gera um novo código individual único ativo.
   - Grava um registro no **Log de Alterações** (`logs_alteracoes`) identificando a ação `EDICAO`, o código do Técnico em Portos responsável e o novo código gerado.
5. O novo código é exibido para impressão/repassado ao funcionário.

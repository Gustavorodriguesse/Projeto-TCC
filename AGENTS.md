# AGENTS.md — Diretrizes e Arquitetura do Projeto NexusPort

Este documento contém diretrizes, arquitetura e instruções para futuros agentes (como Jules) ao trabalharem neste repositório.

---

## 🏛️ Arquitetura e Princípios Core

1. **Frontend Estático (GitHub Pages):**
   - A aplicação é hospedada estaticamente no GitHub Pages.
   - Não depende de um servidor backend Node.js separado para execução em produção.
   - Toda comunicação de backend é feita diretamente do cliente via SDK do **Supabase** (`@supabase/supabase-js`).

2. **Supabase + PostgreSQL + PostGIS:**
   - O Supabase é a fonte de verdade para banco de dados, autenticação e funções RPC espaciais.
   - O PostgreSQL utiliza a extensão **PostGIS** para dados e consultas geográficas no padrão WGS84 (`geography(Point, 4326)`).
   - O arquivo DDL mestre está localizado em `SPECs/schema.sql`.

3. **Fallback Offline Gracioso:**
   - O sistema deve permanecer plenamente funcional em modo de simulação/offline caso as credenciais do Supabase não estejam preenchidas em `js/config.js`.
   - O módulo `js/postgis-service.js` (`window.NexusPostGIS`) fornece os cálculos geodésicos (Haversine/WGS84) e CRUDs locais em `localStorage` quando o Supabase não estiver conectado.

---

## 🔒 Regras de Segurança

1. **Jamais expor credenciais privadas:**
   - NUNCA inclua a `service_role` key do Supabase, senhas ou segredos no código do frontend ou em arquivos rastreados pelo git.
   - Utilize apenas a `SUPABASE_ANON_KEY` para acesso pelo cliente.
   - Toda tabela no banco DEVE ter Row Level Security (RLS) habilitado.

---

## ⛵ Regras do Negócio Náutico & PostGIS

1. **Distância Geodésica vs Náutica:**
   - O cálculo `ST_Distance` em PostGIS representa uma distância geodésica em linha reta no elipsoide WGS84.
   - A interface e a documentação DEVEM sempre destacar que se trata de uma estimativa geográfica, não de uma rota marítima navegável operacional.

2. **Velocidade Média das Embarcações:**
   - NÃO inventar uma velocidade média universal para todas as embarcações.
   - A velocidade média é configurável individualmente por embarcação (`velocidade_media` na tabela `navios`).
   - Se a embarcação não possuir velocidade média cadastrada ou for $\le 0$, o sistema DEVE informar expressamente que não é possível calcular a estimativa de tempo e ETA.

---

## 🧪 Como Executar e Testar

1. **Servidor Local para Testes:**
   ```bash
   python3 -m http.server 3000 &
   ```

2. **Suíte de Testes Automatizada:**
   ```bash
   npm test
   ```
   *Executa os scripts de verificação Playwright (`verify_phase*.py`).*

3. **Inclusão de Novos Módulos:**
   - Ao adicionar novos módulos ou scripts JS, certifique-se de incluí-los nas páginas HTML correspondentes e manter os scripts de verificação atualizados.

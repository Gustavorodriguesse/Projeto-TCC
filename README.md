# NexusPort - Sistema de Automação e Gestão Operacional Portuária

**Terminal STS-01 Santos & Rede Portuária Nacional**

NexusPort é uma plataforma web completa para gestão de fluxos de cargas, logística de frotas, infraestrutura portuária, controle de acessos e geolocalização com **Supabase**, **PostgreSQL** e **PostGIS**.

---

## 🏗️ Arquitetura do Sistema

```
USUÁRIO (Navegador)
   ↓
GitHub Pages (Hospedagem Estática HTML/CSS/JS)
   ↓
Supabase (BaaS)
   ├── PostgreSQL (Banco Relacional Core)
   ├── PostGIS (Extensão para Dados Espaciais & WGS84)
   ├── Supabase Auth & RLS (Segurança Row Level Security)
   └── REST / RPC APIs
```

- **Frontend Estático:** Desenvolvido em HTML5, Tailwind CSS, JavaScript ES6 e Leaflet.js para mapas interativos.
- **Backend / BaaS:** Supabase PostgreSQL com suporte nativo à extensão espacial **PostGIS**.
- **Hospedagem:** Preparado para GitHub Pages sem dependência de servidores Node.js ou bancos locais em produção.

---

## 🌐 PostGIS & Banco de Dados

### 1. Extensão e Habilitação
No editor SQL do Supabase ou banco PostgreSQL local, habilite as extensões:
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
```

### 2. Estrutura e Hierarquia Física das Tabelas
A infraestrutura separa claramente os elementos físicos e logísticos do porto:

- **`portos`**:
  - `id`, `codigo` (ex: BRSSZ), `nome`, `pais`, `cidade`, `latitude`, `longitude`.
  - `localizacao`: Tipo `geography(Point, 4326)` indexado via GiST.
- **`bercos`**:
  - `id`, `porto_id` (FK `portos`), `nome_codigo`, `capacidade`, `status` (`DISPONIVEL`, `OCUPADO`, `EM_MANUTENCAO`, `INDISPONIVEL`), `caracteristicas`, `localizacao`.
- **`guindastes`**:
  - *Separados dos berços.* `id`, `porto_id` (FK), `berco_id` (FK opcional), `numero_identificacao`, `tipo`, `capacidade`, `status` (`DISPONIVEL`, `OPERANDO`, `MANUTENCAO`, `INDISPONIVEL`), `localizacao`.
- **`patios`**:
  - *Áreas de armazenamento separadas.* `id`, `porto_id` (FK), `codigo`, `nome`, `capacidade`, `ocupacao`, `status`, `area_localizacao`.
- **`containers`**:
  - Relacionado a `carga`, `navio`, `porto_id`, `patio_id`, `localizacao_atual` `geography(Point, 4326)`.
- **`navios`**:
  - `id`, `nome`, `numero_imo`, `porto_origem_id`, `porto_destino_id`, `velocidade_media` (km/h configurável por navio), `posicao_geografica` `geography(Point, 4326)`, `localizacao` (`DENTRO_DO_PORTO`, `FORA_DO_PORTO`, `NO_PORTO_DE_DESTINO`).

O DDL completo está disponível em `SPECs/schema.sql`.

---

## 📏 Cálculos de Distância, Tempo de Viagem e Previsão de Chegada (ETA)

### 1. Distância Geográfica Geodésica entre Portos
Calculada via PostGIS utilizando a função espacial `ST_Distance` em coordenadas geográficas `geography(Point, 4326)` (elipsoide WGS84):
```sql
SELECT (ST_Distance(p1.localizacao, p2.localizacao) / 1000.0) AS distancia_km
FROM portos p1, portos p2
WHERE p1.codigo = 'BRSSZ' AND p2.codigo = 'BRPNG';
```
> **Nota de Transparência:** A função `ST_Distance` representa a distância geodésica em linha reta (geodésica WGS84) entre as coordenadas dos portos. Não deve ser apresentada como se fosse a rota marítima navegável exata.

### 2. Tempo Estimado de Viagem
Fórmula:
$$\text{tempo (horas)} = \frac{\text{distância (km)}}{\text{velocidade média (km/h)}}$$

- **Velocidade Média Configurável:** Cada embarcação possui seu próprio parâmetro de velocidade média cadastrado (`velocidade_media` na tabela `navios`). Ex: *MV Santos Star = 20 km/h*, *MV Pacific Giant = 25 km/h*.
- **Tratamento de Exceções:** Se a embarcação não possuir velocidade cadastrada ou o valor for $\le 0$, o sistema informa expressamente que não é possível calcular a estimativa com precisão suficiente, evitando premissas arbitrárias.

### 3. Previsão Estimada de Chegada (ETA)
$$\text{ETA} = \text{Data/Hora de Partida} + \text{Tempo Estimado de Viagem}$$

---

## 🎯 Automação Logística Espacial
O sistema permite localizar automaticamente guindastes e equipamentos disponíveis próximos de uma localização ou contêiner específico utilizando consultas PostGIS:
```sql
SELECT g.numero_identificacao, g.tipo, ST_Distance(v_ponto, g.localizacao) AS distancia_metros
FROM guindastes g
WHERE ST_DWithin(v_ponto, g.localizacao, 5000) AND g.status = 'DISPONIVEL'
ORDER BY ST_Distance(v_ponto, g.localizacao) ASC;
```

---

## ⚙️ Configuração do Supabase & Hospedagem

### 1. Arquivo de Configuração
Crie ou edite `js/config.js` (copie a partir de `js/config.example.js`):
```javascript
window.NEXUS_CONFIG = {
  SUPABASE_URL: "https://seu-projeto.supabase.co",
  SUPABASE_ANON_KEY: "sua-chave-anon-aqui"
};
```
*Atenção: Utilize APENAS a chave anônima (anon key). NUNCA coloque a service_role key no frontend.*

### 2. Executar Localmente
```bash
python3 -m http.server 3000
# Acesse http://localhost:3000
```

### 3. Executar Testes Automatizados
```bash
npm test
```

### 4. Deploy no GitHub Pages
O repositório inclui a action `.github/workflows/deploy.yml` para publicação estática automática ao realizar push na branch principal.

---

## 🛡️ Segurança (RLS)
Todas as tabelas do Supabase possuem Row Level Security (RLS) ativado com políticas de acesso configuradas para leitura e escrita seguras via chave pública anônima/autenticada.

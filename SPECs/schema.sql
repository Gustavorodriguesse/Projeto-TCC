-- ============================================================
-- SISTEMA DE AUTOMAÇÃO DE CARREGAMENTOS PARA PORTO (NexusPort)
-- Esquema PostgreSQL + PostGIS (Supabase DDL Completo)
-- ============================================================

-- 1. EXTENSÕES
-- ============================================================
create extension if not exists "pgcrypto";
create extension if not exists "postgis";

-- 2. ENUMS
-- ============================================================
create type cargo_enum as enum (
  'ESTIVADOR',
  'CONFERENTE_CARGA',
  'ARRUMADOR_CONSERTADOR',
  'PLANEJADOR_PATIO_NAVIOS',
  'TECNICO_PORTOS',
  'SUPERVISOR_GERENTE_OPERACOES',
  'INSPETOR',
  'DIRETOR_OPERACOES_LOGISTICA',
  'DIRETOR_PRESIDENTE_SUPERINTENDENTE',
  'CONSELHO_ADMINISTRACAO'
);

create type nivel_acesso_enum as enum ('OPERACIONAL', 'GESTAO', 'TATICO', 'ESTRATEGICO');

create type estado_navio_enum as enum (
  'OPERANTE',
  'AGENDADO_PARA_REFORMA',
  'EM_REFORMA',
  'APROVADO_PARA_REFORMA'
);

create type estado_container_enum as enum (
  'OPERANTE',
  'AGENDADO_PARA_REFORMA',
  'EM_REFORMA',
  'APROVADO_PARA_REFORMA'
);

create type status_berco_enum as enum ('DISPONIVEL', 'OCUPADO', 'EM_MANUTENCAO', 'INDISPONIVEL');

create type status_guindaste_enum as enum ('DISPONIVEL', 'OPERANDO', 'MANUTENCAO', 'INDISPONIVEL');

create type estado_guindaste_enum as enum ('OPERANTE', 'EM_MANUTENCAO');

create type localizacao_navio_enum as enum (
  'DENTRO_DO_PORTO',
  'FORA_DO_PORTO',
  'NO_PORTO_DE_DESTINO'
);

create type status_carga_enum as enum (
  'AGENDAMENTO',
  'RECEBIMENTO_INSPECAO',
  'ARMAZENAGEM',
  'PRONTA_PARA_ENTREGA',
  'SAIDA',
  'EM_TRANSITO',
  'ENTREGUE',
  'CANCELADA',
  'RECUSADA'
);

create type tipo_decisao_enum as enum (
  'APROVOU_CARGA',
  'RECUSOU_CARGA',
  'SOLICITOU_MANUTENCAO_NAVIO',
  'SOLICITOU_MANUTENCAO_CONTAINER',
  'LIBEROU_NAVIO',
  'CANCELOU_ENTREGA',
  'APROVOU_MANUTENCAO',
  'RECUSOU_MANUTENCAO',
  'DESIGNOU_SUBSTITUTO'
);

create type tipo_entidade_enum as enum (
  'NAVIO',
  'CONTAINER',
  'CARGA',
  'FUNCIONARIO',
  'VISITANTE',
  'GUINDASTE',
  'MANUTENCAO',
  'CHECKLIST',
  'ROTA',
  'TIPO_CARGA',
  'PORTO',
  'BERCO',
  'PATIO'
);

create type tipo_alteracao_enum as enum (
  'CRIACAO',
  'EDICAO',
  'EXCLUSAO',
  'REIMPRESSAO_ETIQUETA'
);

create type referencia_tempo_enum as enum ('DATA_FABRICACAO', 'DATA_ULTIMA_MANUTENCAO');

create type resultado_inspecao_enum as enum ('PENDENTE', 'APROVADA', 'RECUSADA');

create type status_manutencao_enum as enum ('SOLICITADA', 'APROVADA', 'RECUSADA', 'CONCLUIDA');

create type estado_carregamento_enum as enum ('EM_CARREGAMENTO', 'PARADO', 'CONCLUIDO');

-- 3. TABELAS DE DOMÍNIO E HIERARQUIA FÍSICA
-- ============================================================

create table cargo_niveis (
  cargo cargo_enum primary key,
  nivel nivel_acesso_enum not null
);

create table funcionarios (
  id uuid primary key default gen_random_uuid(),
  matricula text not null unique,
  codigo_individual text not null unique,
  nome text not null,
  cargo cargo_enum not null,
  email text unique,
  telefone text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table visitantes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text not null,
  motivo text,
  data_hora_entrada timestamptz not null default now(),
  data_hora_saida timestamptz,
  registrado_por uuid references funcionarios(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table tipos_carga (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  categoria_risco text,
  requisitos_especiais text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table checklist_modelos (
  id uuid primary key default gen_random_uuid(),
  tipo_carga_id uuid not null references tipos_carga(id) on delete restrict,
  nome text not null,
  descricao text,
  criado_por uuid references funcionarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_checklist_modelo_tipo_carga unique (tipo_carga_id)
);

create table checklist_itens (
  id uuid primary key default gen_random_uuid(),
  checklist_modelo_id uuid not null references checklist_modelos(id) on delete cascade,
  descricao text not null,
  critico boolean not null default false,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

-- 4. INFRAESTRUTURA PORTUÁRIA (PORTOS, BERÇOS, GUINDASTES, PÁTIOS)
-- ============================================================

-- Portos
create table portos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  pais text not null default 'Brasil',
  cidade text,
  latitude numeric(10, 6) not null,
  longitude numeric(10, 6) not null,
  localizacao geography(Point, 4326) generated always as (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Berços (Um porto possui vários berços)
create table bercos (
  id uuid primary key default gen_random_uuid(),
  porto_id uuid not null references portos(id) on delete cascade,
  nome_codigo text not null,
  capacidade numeric(12, 2) default 50000.0,
  status status_berco_enum not null default 'DISPONIVEL',
  caracteristicas text,
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  localizacao geography(Point, 4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Guindastes / Equipamentos (Separados dos berços)
create table guindastes (
  id uuid primary key default gen_random_uuid(),
  porto_id uuid not null references portos(id) on delete cascade,
  berco_id uuid references bercos(id) on delete set null,
  numero_identificacao text not null unique,
  tipo text not null default 'STAG / STS Crane',
  capacidade numeric(12, 2) default 65.0,
  status status_guindaste_enum not null default 'DISPONIVEL',
  data_ultima_manutencao date,
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  localizacao geography(Point, 4326),
  qr_code_url text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pátios (Áreas de armazenamento separadas)
create table patios (
  id uuid primary key default gen_random_uuid(),
  porto_id uuid not null references portos(id) on delete cascade,
  codigo text not null unique,
  nome text not null,
  capacidade int not null default 1000,
  ocupacao int not null default 0,
  status text not null default 'OPERANTE',
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  area_localizacao geography(Point, 4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rotas Marítimas
create table rotas_maritimas (
  id uuid primary key default gen_random_uuid(),
  porto_origem_id uuid references portos(id) on delete cascade,
  porto_destino_id uuid references portos(id) on delete cascade,
  origem text not null,
  destino text not null,
  distancia_km numeric(12, 2) not null check (distancia_km >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_rota_origem_destino unique (origem, destino)
);

-- 5. EQUIPAMENTOS E EMBARCAÇÕES (NAVIOS, CONTAINERS)
-- ============================================================

create table navios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  numero_imo text not null unique,
  data_registro_sistema date not null default current_date,
  quantidade_cargas_realizadas int not null default 0 check (quantidade_cargas_realizadas >= 0),
  estado_operacional estado_navio_enum not null default 'OPERANTE',
  coordenadas_gps text,
  tempo_fora_do_porto text,
  porto_origem text,
  porto_destino text,
  porto_origem_id uuid references portos(id) on delete set null,
  porto_destino_id uuid references portos(id) on delete set null,
  velocidade_media numeric(8, 2) check (velocidade_media >= 0), -- Velocidade média em km/h configurável por navio
  previsao_chegada timestamptz,
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  posicao_geografica geography(Point, 4326),
  localizacao localizacao_navio_enum not null default 'DENTRO_DO_PORTO',
  data_chegada timestamptz,
  data_saida timestamptz,
  qr_code_url text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table containers (
  id uuid primary key default gen_random_uuid(),
  numero_identificacao text not null unique,
  tipo_carga_id uuid references tipos_carga(id) on delete restrict,
  material_carregado text,
  data_fabricacao date,
  data_ultima_manutencao date,
  tempo_uso_referencia referencia_tempo_enum default 'DATA_FABRICACAO',
  estado estado_container_enum not null default 'OPERANTE',
  navio_id uuid references navios(id) on delete set null,
  porto_id uuid references portos(id) on delete set null,
  patio_id uuid references patios(id) on delete set null,
  latitude numeric(10, 6),
  longitude numeric(10, 6),
  localizacao_atual geography(Point, 4326),
  qr_code_url text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. TABELAS DE CARGAS E FLUXO
-- ============================================================

create table cargas (
  id uuid primary key default gen_random_uuid(),
  tipo_carga_id uuid references tipos_carga(id) on delete restrict,
  quantidade numeric(15, 3) default 1 check (quantidade >= 0),
  material text,
  peso numeric(15, 3) not null check (peso >= 0),
  volume numeric(15, 3) not null check (volume >= 0),
  valor_declarado numeric(15, 2) not null check (valor_declarado >= 0),
  natureza text not null,
  data_entrada timestamptz,
  data_saida timestamptz,
  destino text,
  porto_descarga text not null,
  status_fluxo status_carga_enum not null default 'AGENDAMENTO',
  container_id uuid references containers(id) on delete set null,
  checklist_modelo_id uuid references checklist_modelos(id) on delete restrict,
  resultado_inspecao resultado_inspecao_enum not null default 'PENDENTE',
  motivo_recusa text,
  qr_code_url text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  carga_id uuid not null unique references cargas(id) on delete cascade,
  data_prevista_entrega date not null,
  agendado_por uuid references funcionarios(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table estivador_cargas (
  id uuid primary key default gen_random_uuid(),
  estivador_id uuid not null references funcionarios(id) on delete cascade,
  carga_id uuid not null references cargas(id) on delete cascade,
  estado_carregamento estado_carregamento_enum not null default 'EM_CARREGAMENTO',
  data_inicio timestamptz,
  data_fim timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_estivador_carga unique (estivador_id, carga_id)
);

-- 7. TABELAS DE MANUTENÇÃO E INSPEÇÕES
-- ============================================================

create table manutencoes (
  id uuid primary key default gen_random_uuid(),
  entidade_tipo tipo_entidade_enum not null,
  navio_id uuid references navios(id) on delete cascade,
  container_id uuid references containers(id) on delete cascade,
  guindaste_id uuid references guindastes(id) on delete cascade,
  data_solicitacao timestamptz not null default now(),
  data_aprovacao timestamptz,
  data_conclusao timestamptz,
  descricao text not null,
  status status_manutencao_enum not null default 'SOLICITADA',
  solicitado_por uuid references funcionarios(id) on delete restrict,
  aprovado_por uuid references funcionarios(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table historico_manutencoes (
  id uuid primary key default gen_random_uuid(),
  navio_id uuid references navios(id) on delete cascade,
  container_id uuid references containers(id) on delete cascade,
  guindaste_id uuid references guindastes(id) on delete cascade,
  data_manutencao date not null,
  descricao_servicos text not null,
  registrado_por uuid references funcionarios(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table inspecoes (
  id uuid primary key default gen_random_uuid(),
  carga_id uuid not null unique references cargas(id) on delete cascade,
  checklist_modelo_id uuid references checklist_modelos(id) on delete restrict,
  inspetor_id uuid references funcionarios(id) on delete restrict,
  data_inspecao timestamptz not null default now(),
  resultado resultado_inspecao_enum not null default 'PENDENTE',
  observacoes text,
  created_at timestamptz not null default now()
);

create table inspecao_itens (
  id uuid primary key default gen_random_uuid(),
  inspecao_id uuid not null references inspecoes(id) on delete cascade,
  checklist_item_id uuid not null references checklist_itens(id) on delete restrict,
  conforme boolean,
  observacao text,
  created_at timestamptz not null default now(),
  constraint uq_inspecao_item unique (inspecao_id, checklist_item_id)
);

-- 8. AUDITORIA, DECISÕES E DELEGAÇÕES
-- ============================================================

create table logs_alteracoes (
  id uuid primary key default gen_random_uuid(),
  data_hora timestamptz not null default now(),
  funcionario_id uuid references funcionarios(id) on delete restrict,
  cargo cargo_enum not null,
  codigo_individual text not null,
  entidade_tipo tipo_entidade_enum not null,
  entidade_id text not null,
  tipo_alteracao tipo_alteracao_enum not null,
  detalhes jsonb,
  created_at timestamptz not null default now()
);

create table trail_decisoes (
  id uuid primary key default gen_random_uuid(),
  data_hora timestamptz not null default now(),
  funcionario_id uuid references funcionarios(id) on delete restrict,
  cargo cargo_enum not null,
  codigo_individual text not null,
  tipo_decisao tipo_decisao_enum not null,
  entidade_tipo tipo_entidade_enum not null,
  entidade_id text not null,
  motivo text,
  detalhes jsonb,
  created_at timestamptz not null default now()
);

create table retificacoes_trail (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references trail_decisoes(id) on delete restrict,
  funcionario_id uuid references funcionarios(id) on delete restrict,
  retificacao text not null,
  data_hora timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table delegacoes_supervisor (
  id uuid primary key default gen_random_uuid(),
  supervisor_titular_id uuid references funcionarios(id) on delete cascade,
  substituto_id uuid references funcionarios(id) on delete cascade,
  data_inicio timestamptz not null,
  data_fim_previsto timestamptz not null,
  data_revogacao timestamptz,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table leituras_qr_code (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid references funcionarios(id) on delete restrict,
  entidade_tipo tipo_entidade_enum not null,
  entidade_id text not null,
  data_hora timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 9. ÍNDICES ESPACIAIS POSTGIS (GiST)
-- ============================================================
create index if not exists idx_portos_localizacao on portos using gist (localizacao);
create index if not exists idx_bercos_localizacao on bercos using gist (localizacao);
create index if not exists idx_guindastes_localizacao on guindastes using gist (localizacao);
create index if not exists idx_patios_localizacao on patios using gist (area_localizacao);
create index if not exists idx_containers_localizacao on containers using gist (localizacao_atual);
create index if not exists idx_navios_posicao on navios using gist (posicao_geografica);

-- 10. FUNÇÕES E PROCEDURES POSTGIS
-- ============================================================

-- Função PostGIS: Cálculo de distância geodésica em metros e km entre dois portos
create or replace function fn_calcular_distancia_portos(
  p_origem_id uuid,
  p_destino_id uuid
)
returns table(
  distancia_metros numeric,
  distancia_km numeric,
  nota_explicativa text
) as $$
begin
  return query
  select
    st_distance(p1.localizacao, p2.localizacao)::numeric(15, 2) as distancia_metros,
    (st_distance(p1.localizacao, p2.localizacao) / 1000.0)::numeric(12, 2) as distancia_km,
    'Distância calculada via PostGIS (ST_Distance geodésica em elipsoide WGS84). Não representa necessariamente a rota marítima exata.'::text as nota_explicativa
  from portos p1, portos p2
  where p1.id = p_origem_id and p2.id = p_destino_id;
end;
$$ language plpgsql;

-- Função PostGIS: Cálculo do Tempo Estimado de Viagem e Previsão de Chegada (ETA)
create or replace function fn_calcular_eta_navio(
  p_navio_id uuid,
  p_origem_id uuid,
  p_destino_id uuid,
  p_data_partida timestamptz default now()
)
returns table(
  navio_nome text,
  velocidade_media_kmh numeric,
  distancia_km numeric,
  tempo_horas numeric,
  previsao_chegada timestamptz,
  status_calculo text,
  mensagem text
) as $$
declare
  v_vel numeric;
  v_nome text;
  v_dist_km numeric;
  v_horas numeric;
  v_eta timestamptz;
begin
  select nome, velocidade_media into v_nome, v_vel from navios where id = p_navio_id;

  if v_vel is null or v_vel <= 0 then
    return query select
      v_nome, v_vel, 0.0::numeric, 0.0::numeric, null::timestamptz,
      'ERRO_VELOCIDADE_AUSENTE'::text,
      'Não é possível calcular o tempo estimado e ETA sem a velocidade média cadastrada para a embarcação.'::text;
    return;
  end if;

  select (st_distance(p1.localizacao, p2.localizacao) / 1000.0)::numeric(12, 2)
  into v_dist_km
  from portos p1, portos p2
  where p1.id = p_origem_id and p2.id = p_destino_id;

  if v_dist_km is null then
    return query select
      v_nome, v_vel, 0.0::numeric, 0.0::numeric, null::timestamptz,
      'ERRO_PORTO_NAO_ENCONTRADO'::text,
      'Porto de origem ou destino não localizado.'::text;
    return;
  end if;

  v_horas := (v_dist_km / v_vel)::numeric(12, 2);
  v_eta := p_data_partida + (v_horas || ' hours')::interval;

  return query select
    v_nome, v_vel, v_dist_km, v_horas, v_eta,
    'SUCESSO'::text,
    'Previsão calculada com base na distância geodésica e velocidade média cadastrada da embarcação.'::text;
end;
$$ language plpgsql;

-- Função PostGIS: Busca de Equipamentos / Guindastes Próximos por Proximidade Espacial
create or replace function fn_buscar_equipamentos_proximos(
  p_lat numeric,
  p_lon numeric,
  p_raio_metros numeric default 5000.0
)
returns table(
  equipamento_id uuid,
  codigo text,
  tipo text,
  capacidade numeric,
  status text,
  distancia_metros numeric
) as $$
declare
  v_ponto geography;
begin
  v_ponto := st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography;

  return query
  select
    g.id as equipamento_id,
    g.numero_identificacao as codigo,
    g.tipo as tipo,
    g.capacidade as capacidade,
    g.status::text as status,
    st_distance(v_ponto, g.localizacao)::numeric(12, 2) as distancia_metros
  from guindastes g
  where g.localizacao is not null
    and st_dwithin(v_ponto, g.localizacao, p_raio_metros)
  order by st_distance(v_ponto, g.localizacao) asc;
end;
$$ language plpgsql;

-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table funcionarios enable row level security;
alter table visitantes enable row level security;
alter table tipos_carga enable row level security;
alter table checklist_modelos enable row level security;
alter table checklist_itens enable row level security;
alter table portos enable row level security;
alter table bercos enable row level security;
alter table guindastes enable row level security;
alter table patios enable row level security;
alter table rotas_maritimas enable row level security;
alter table navios enable row level security;
alter table containers enable row level security;
alter table cargas enable row level security;
alter table agendamentos enable row level security;
alter table manutencoes enable row level security;
alter table historico_manutencoes enable row level security;
alter table inspecoes enable row level security;
alter table inspecao_itens enable row level security;
alter table logs_alteracoes enable row level security;
alter table trail_decisoes enable row level security;
alter table retificacoes_trail enable row level security;
alter table delegacoes_supervisor enable row level security;
alter table leituras_qr_code enable row level security;

-- Permissão de leitura publica/autenticada para operacoes generales
create policy "Acesso geral portos" on portos for all using (true);
create policy "Acesso geral bercos" on bercos for all using (true);
create policy "Acesso geral guindastes" on guindastes for all using (true);
create policy "Acesso geral patios" on patios for all using (true);
create policy "Acesso geral cargas" on cargas for all using (true);
create policy "Acesso geral navios" on navios for all using (true);
create policy "Acesso geral containers" on containers for all using (true);
create policy "Acesso geral tipos_carga" on tipos_carga for all using (true);
create policy "Acesso geral rotas_maritimas" on rotas_maritimas for all using (true);
create policy "Acesso geral funcionarios" on funcionarios for all using (true);
create policy "Acesso geral visitantes" on visitantes for all using (true);

-- 12. TRIGGER DE PROPAGAÇÃO EM CASCATA
-- ============================================================

create or replace function fn_propagar_status_navio()
returns trigger as $$
begin
  if NEW.localizacao = 'NO_PORTO_DE_DESTINO' then
    update cargas
    set status_fluxo = 'ENTREGUE', updated_at = now()
    where container_id in (select id from containers where navio_id = NEW.id)
      and status_fluxo = 'EM_TRANSITO';
  elsif NEW.localizacao = 'FORA_DO_PORTO' then
    update cargas
    set status_fluxo = 'EM_TRANSITO', updated_at = now()
    where container_id in (select id from containers where navio_id = NEW.id)
      and status_fluxo = 'PRONTA_PARA_ENTREGA';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_propagar_status_navio
after update of localizacao on navios
for each row
execute function fn_propagar_status_navio();

-- 13. POPULAÇÃO INICIAL (SEED DATA)
-- ============================================================

insert into cargo_niveis (cargo, nivel) values
  ('ESTIVADOR', 'OPERACIONAL'),
  ('CONFERENTE_CARGA', 'OPERACIONAL'),
  ('ARRUMADOR_CONSERTADOR', 'OPERACIONAL'),
  ('PLANEJADOR_PATIO_NAVIOS', 'OPERACIONAL'),
  ('TECNICO_PORTOS', 'OPERACIONAL'),
  ('SUPERVISOR_GERENTE_OPERACOES', 'GESTAO'),
  ('INSPETOR', 'TATICO'),
  ('DIRETOR_OPERACOES_LOGISTICA', 'ESTRATEGICO'),
  ('DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'ESTRATEGICO'),
  ('CONSELHO_ADMINISTRACAO', 'ESTRATEGICO')
on conflict (cargo) do nothing;

-- Inserir Portos
insert into portos (codigo, nome, pais, cidade, latitude, longitude) values
  ('BRSSZ', 'Porto de Santos (STS-01)', 'Brasil', 'Santos', -23.960800, -46.302200),
  ('BRPNG', 'Porto de Paranaguá', 'Brasil', 'Paranaguá', -25.501100, -48.511700),
  ('BRRIG', 'Porto do Rio de Janeiro', 'Brasil', 'Rio de Janeiro', -22.898300, -43.181200),
  ('BRSUA', 'Porto de Suape', 'Brasil', 'Ipojuca', -8.394400, -34.958300),
  ('BRBGZ', 'Porto de Bragança', 'Brasil', 'Bragança', -1.053600, -46.765600)
on conflict (codigo) do nothing;

-- Inserir Berços
insert into bercos (porto_id, nome_codigo, capacidade, status, caracteristicas, latitude, longitude, localizacao)
select
  p.id,
  b.nome_codigo,
  b.capacidade,
  b.status::status_berco_enum,
  b.caracteristicas,
  b.latitude,
  b.longitude,
  st_setsrid(st_makepoint(b.longitude, b.latitude), 4326)::geography
from portos p
cross join (values
  ('BRSSZ', 'Berço 01 - Conteineres', 80000.0, 'DISPONIVEL', 'Calado 15m - Terminal STS-01', -23.961000, -46.302000),
  ('BRSSZ', 'Berço 02 - Carga Geral', 60000.0, 'OCUPADO', 'Calado 13.5m - Terminal STS-01', -23.961500, -46.302500),
  ('BRSSZ', 'Berço 03 - Granel', 70000.0, 'DISPONIVEL', 'Calado 14m - Berço de Granéis', -23.962000, -46.303000),
  ('BRPNG', 'Berço 101 - Paranaguá', 75000.0, 'DISPONIVEL', 'Terminal de Contêineres de Paranaguá', -25.501500, -48.512000),
  ('BRRIG', 'Berço 01 - Rio de Janeiro', 65000.0, 'DISPONIVEL', 'Pier de Cargas Rio', -22.898800, -43.181800),
  ('BRSUA', 'Berço 01 - Suape', 90000.0, 'DISPONIVEL', 'Calado Profundo Suape', -8.395000, -34.959000),
  ('BRBGZ', 'Berço 01 - Bragança', 40000.0, 'DISPONIVEL', 'Atendimento Regional Bragança', -1.054000, -46.766000)
) as b(codigo_porto, nome_codigo, capacidade, status, caracteristicas, latitude, longitude)
where p.codigo = b.codigo_porto
on conflict do nothing;

-- Inserir Guindastes
insert into guindastes (porto_id, berco_id, numero_identificacao, tipo, capacidade, status, latitude, longitude, localizacao)
select
  p.id,
  bc.id,
  g.numero_identificacao,
  g.tipo,
  g.capacidade,
  g.status::status_guindaste_enum,
  g.latitude,
  g.longitude,
  st_setsrid(st_makepoint(g.longitude, g.latitude), 4326)::geography
from portos p
cross join (values
  ('BRSSZ', 'Berço 01 - Conteineres', 'GND-01-STS', 'Portêiner STS Super Post-Panamax', 80.0, 'DISPONIVEL', -23.961100, -46.302100),
  ('BRSSZ', 'Berço 02 - Carga Geral', 'GND-02-STS', 'Guindaste sobre Esteiras MHC-150', 50.0, 'OPERANDO', -23.961600, -46.302600),
  ('BRPNG', 'Berço 101 - Paranaguá', 'GND-01-PNG', 'Portêiner STS Post-Panamax', 65.0, 'DISPONIVEL', -25.501600, -48.512100),
  ('BRRIG', 'Berço 01 - Rio de Janeiro', 'GND-01-RIG', 'Guindaste de Lança Articulada', 40.0, 'DISPONIVEL', -22.898900, -43.181900)
) as g(codigo_porto, berco_nome, numero_identificacao, tipo, capacidade, status, latitude, longitude)
left join bercos bc on bc.porto_id = p.id and bc.nome_codigo = g.berco_nome
where p.codigo = g.codigo_porto
on conflict (numero_identificacao) do nothing;

-- Inserir Pátios
insert into patios (porto_id, codigo, nome, capacidade, ocupacao, status, latitude, longitude, area_localizacao)
select
  p.id,
  pt.codigo,
  pt.nome,
  pt.capacidade,
  pt.ocupacao,
  pt.status,
  pt.latitude,
  pt.longitude,
  st_setsrid(st_makepoint(pt.longitude, pt.latitude), 4326)::geography
from portos p
cross join (values
  ('BRSSZ', 'PATIO-A-STS', 'Pátio A - Contêineres Refrigerados / Carga Geral', 2500, 850, 'OPERANTE', -23.960500, -46.301500),
  ('BRSSZ', 'PATIO-B-STS', 'Pátio B - Estocagem Mista e Exportação', 1800, 420, 'OPERANTE', -23.962500, -46.303500),
  ('BRPNG', 'PATIO-01-PNG', 'Pátio de Exportação Paranaguá', 3000, 1100, 'OPERANTE', -25.502000, -48.513000)
) as pt(codigo_porto, codigo, nome, capacidade, ocupacao, status, latitude, longitude)
where p.codigo = pt.codigo_porto
on conflict (codigo) do nothing;

-- Inserir Navios com Velocidade Média Configurável
insert into navios (nome, numero_imo, quantidade_cargas_realizadas, estado_operacional, porto_origem, porto_destino, velocidade_media, localizacao, latitude, longitude, posicao_geografica)
values
  ('MV Santos Star', 'IMO-9821034', 12, 'OPERANTE', 'Porto de Santos (STS-01)', 'Porto de Paranaguá', 20.00, 'DENTRO_DO_PORTO', -23.960800, -46.302200, st_setsrid(st_makepoint(-46.302200, -23.960800), 4326)::geography),
  ('MV Pacific Giant', 'IMO-9742110', 8, 'OPERANTE', 'Porto de Santos (STS-01)', 'Porto de Suape', 25.00, 'FORA_DO_PORTO', -12.046300, -77.042800, st_setsrid(st_makepoint(-77.042800, -12.046300), 4326)::geography),
  ('MV Atlantic Breeze', 'IMO-9651002', 15, 'AGENDADO_PARA_REFORMA', 'Porto de Santos (STS-01)', 'Porto do Rio de Janeiro', 22.00, 'NO_PORTO_DE_DESTINO', -22.898300, -43.181200, st_setsrid(st_makepoint(-43.181200, -22.898300), 4326)::geography),
  ('Log-In Pantanal', 'IMO-9510022', 20, 'OPERANTE', 'Porto de Santos (STS-01)', 'Porto de Bragança', 28.00, 'FORA_DO_PORTO', -10.000000, -40.000000, st_setsrid(st_makepoint(-40.000000, -10.000000), 4326)::geography),
  ('Cap San Lorenzo', 'IMO-9648283', 5, 'OPERANTE', 'Porto de Paranaguá', 'Porto de Santos (STS-01)', 30.00, 'DENTRO_DO_PORTO', -25.501100, -48.511700, st_setsrid(st_makepoint(-48.511700, -25.501100), 4326)::geography)
on conflict (numero_imo) do nothing;

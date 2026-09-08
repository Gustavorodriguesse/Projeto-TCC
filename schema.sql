-- ============================================================
-- SISTEMA DE AUTOMAÇÃO DE CARREGAMENTOS PARA PORTO
-- Esquema PostgreSQL (Supabase)
-- ============================================================

-- 1. EXTENSÕES
-- ============================================================
create extension if not exists "pgcrypto";

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
  'TIPO_CARGA'
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

-- 3. TABELAS DE DOMÍNIO E HIERARQUIA
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
  data_hora_entrada timestamptz not null,
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
  criado_por uuid not null references funcionarios(id) on delete restrict,
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

create table rotas_maritimas (
  id uuid primary key default gen_random_uuid(),
  origem text not null,
  destino text not null,
  distancia_km numeric(12, 2) not null check (distancia_km > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_rota_origem_destino unique (origem, destino)
);

-- 4. TABELAS DE EQUIPAMENTOS E EMBARCAÇÕES
-- ============================================================

create table navios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  numero_imo text not null unique,
  data_registro_sistema date not null default current_date,
  quantidade_cargas_realizadas int not null default 0 check (quantidade_cargas_realizadas >= 0),
  estado_operacional estado_navio_enum not null default 'OPERANTE',
  coordenadas_gps text,
  tempo_fora_do_porto interval,
  porto_origem text,
  porto_destino text,
  localizacao localizacao_navio_enum not null default 'DENTRO_DO_PORTO',
  data_chegada timestamptz,
  data_saida timestamptz,
  qr_code_url text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table guindastes (
  id uuid primary key default gen_random_uuid(),
  numero_identificacao text not null unique,
  estado estado_guindaste_enum not null default 'OPERANTE',
  data_ultima_manutencao date,
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
  tempo_uso_referencia referencia_tempo_enum,
  estado estado_container_enum not null default 'OPERANTE',
  navio_id uuid references navios(id) on delete set null,
  qr_code_url text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. TABELAS DE CARGAS E FLUXO
-- ============================================================

create table cargas (
  id uuid primary key default gen_random_uuid(),
  tipo_carga_id uuid not null references tipos_carga(id) on delete restrict,
  quantidade numeric(15, 3) not null check (quantidade >= 0),
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
  agendado_por uuid not null references funcionarios(id) on delete restrict,
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

-- 6. TABELAS DE MANUTENÇÃO
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
  solicitado_por uuid not null references funcionarios(id) on delete restrict,
  aprovado_por uuid references funcionarios(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_manutencao_entidade check (
    (entidade_tipo = 'NAVIO' and navio_id is not null and container_id is null and guindaste_id is null) or
    (entidade_tipo = 'CONTAINER' and container_id is not null and navio_id is null and guindaste_id is null) or
    (entidade_tipo = 'GUINDASTE' and guindaste_id is not null and navio_id is null and container_id is null)
  )
);

create table historico_manutencoes (
  id uuid primary key default gen_random_uuid(),
  navio_id uuid references navios(id) on delete cascade,
  container_id uuid references containers(id) on delete cascade,
  guindaste_id uuid references guindastes(id) on delete cascade,
  data_manutencao date not null,
  descricao_servicos text not null,
  registrado_por uuid not null references funcionarios(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint chk_historico_entidade check (
    (navio_id is not null and container_id is null and guindaste_id is null) or
    (container_id is not null and navio_id is null and guindaste_id is null) or
    (guindaste_id is not null and navio_id is null and container_id is null)
  )
);

-- 7. TABELAS DE INSPEÇÃO E CHECKLIST
-- ============================================================

create table inspecoes (
  id uuid primary key default gen_random_uuid(),
  carga_id uuid not null unique references cargas(id) on delete cascade,
  checklist_modelo_id uuid not null references checklist_modelos(id) on delete restrict,
  inspetor_id uuid not null references funcionarios(id) on delete restrict,
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

-- 8. TABELAS DE AUDITORIA E DECISÕES
-- ============================================================

create table logs_alteracoes (
  id uuid primary key default gen_random_uuid(),
  data_hora timestamptz not null default now(),
  funcionario_id uuid not null references funcionarios(id) on delete restrict,
  cargo cargo_enum not null,
  codigo_individual text not null,
  entidade_tipo tipo_entidade_enum not null,
  entidade_id uuid not null,
  tipo_alteracao tipo_alteracao_enum not null,
  detalhes jsonb,
  created_at timestamptz not null default now()
);

create table trail_decisoes (
  id uuid primary key default gen_random_uuid(),
  data_hora timestamptz not null default now(),
  funcionario_id uuid not null references funcionarios(id) on delete restrict,
  cargo cargo_enum not null,
  codigo_individual text not null,
  tipo_decisao tipo_decisao_enum not null,
  entidade_tipo tipo_entidade_enum not null,
  entidade_id uuid not null,
  motivo text,
  detalhes jsonb,
  created_at timestamptz not null default now()
);

create table retificacoes_trail (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references trail_decisoes(id) on delete restrict,
  funcionario_id uuid not null references funcionarios(id) on delete restrict,
  retificacao text not null,
  data_hora timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 9. DELEGAÇÃO DE SUPERVISOR
-- ============================================================

create table delegacoes_supervisor (
  id uuid primary key default gen_random_uuid(),
  supervisor_titular_id uuid not null references funcionarios(id) on delete cascade,
  substituto_id uuid not null references funcionarios(id) on delete cascade,
  data_inicio timestamptz not null,
  data_fim_previsto timestamptz not null,
  data_revogacao timestamptz,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_delegacao_datas check (data_fim_previsto > data_inicio),
  constraint chk_substituto_diferente check (supervisor_titular_id <> substituto_id)
);

-- 10. LEITURAS DE QR CODE
-- ============================================================

create table leituras_qr_code (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references funcionarios(id) on delete restrict,
  entidade_tipo tipo_entidade_enum not null,
  entidade_id uuid not null,
  data_hora timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 11. ÍNDICES
-- ============================================================

create index idx_funcionarios_cargo on funcionarios(cargo);
create index idx_funcionarios_codigo on funcionarios(codigo_individual);
create index idx_visitantes_documento on visitantes(documento);
create index idx_navios_imo on navios(numero_imo);
create index idx_navios_localizacao on navios(localizacao);
create index idx_navios_estado on navios(estado_operacional);
create index idx_containers_numero on containers(numero_identificacao);
create index idx_containers_navio on containers(navio_id);
create index idx_containers_estado on containers(estado);
create index idx_cargas_status on cargas(status_fluxo);
create index idx_cargas_container on cargas(container_id);
create index idx_cargas_tipo on cargas(tipo_carga_id);
create index idx_cargas_porto_descarga on cargas(porto_descarga);
create index idx_manutencoes_status on manutencoes(status);
create index idx_manutencoes_navio on manutencoes(navio_id);
create index idx_manutencoes_container on manutencoes(container_id);
create index idx_manutencoes_guindaste on manutencoes(guindaste_id);
create index idx_logs_alteracoes_funcionario on logs_alteracoes(funcionario_id);
create index idx_logs_alteracoes_entidade on logs_alteracoes(entidade_tipo, entidade_id);
create index idx_trail_decisoes_funcionario on trail_decisoes(funcionario_id);
create index idx_trail_decisoes_entidade on trail_decisoes(entidade_tipo, entidade_id);
create index idx_trail_decisoes_tipo on trail_decisoes(tipo_decisao);
create index idx_leituras_qr_funcionario on leituras_qr_code(funcionario_id);
create index idx_leituras_qr_entidade on leituras_qr_code(entidade_tipo, entidade_id);
create index idx_estivador_cargas_estivador on estivador_cargas(estivador_id);
create index idx_estivador_cargas_carga on estivador_cargas(carga_id);
create index idx_inspecoes_carga on inspecoes(carga_id);
create index idx_inspecoes_inspetor on inspecoes(inspetor_id);
create index idx_delegacoes_titular on delegacoes_supervisor(supervisor_titular_id);
create index idx_delegacoes_substituto on delegacoes_supervisor(substituto_id);
create index idx_delegacoes_ativo on delegacoes_supervisor(ativo);
create index idx_historico_manutencoes_navio on historico_manutencoes(navio_id);
create index idx_historico_manutencoes_container on historico_manutencoes(container_id);
create index idx_historico_manutencoes_guindaste on historico_manutencoes(guindaste_id);
create index idx_rotas_origem_destino on rotas_maritimas(origem, destino);

-- 12. POPULAÇÃO INICIAL DE NÍVEIS DE CARGO
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
  ('CONSELHO_ADMINISTRACAO', 'ESTRATEGICO');

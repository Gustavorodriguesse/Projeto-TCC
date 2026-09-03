-- =============================================================================
-- ESQUEMA DE BANCO DE DADOS RELACIONAL (SQL)
-- Sistema de Automação de Carregamentos para um Porto
-- Baseado na Especificação (Spec.md) do Repositório
-- =============================================================================

-- Desabilitar/Habilitar verificação de chaves estrangeiras se necessário
PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------------------
-- 1. TABELA DE FUNCIONÁRIOS (RF 1, RF 15)
-- Registra dados de funcionários e seus cargos de acesso no porto.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS funcionarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_individual TEXT NOT NULL UNIQUE, -- Código individual único de matrícula (RF 1, RN 15)
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL CHECK (
        cargo IN (
            'Estivador',
            'Conferente de Carga',
            'Arrumador e Consertador',
            'Planejador de Pátio e de Navios',
            'Técnico em Portos',
            'Supervisor',
            'Inspetor',
            'Diretor'
        )
    ),
    documentacao_interna TEXT, -- Ficha ou livro de registro de empregados (RF 15)
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. TABELA DE VISITANTES (RF 15)
-- Registra pessoas temporárias que entram no porto (entidade separada dos funcionários).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visitantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    documento TEXT NOT NULL,
    motivo TEXT NOT NULL,
    data_hora_entrada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    registrado_por_codigo TEXT NOT NULL,
    FOREIGN KEY (registrado_por_codigo) REFERENCES funcionarios(codigo_individual)
);

-- -----------------------------------------------------------------------------
-- 3. TABELA DE DELEGAÇÕES DE SUPERVISOR (RF 14)
-- Designação de substitutos temporários com poderes de liberação.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delegacoes_supervisor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supervisor_codigo TEXT NOT NULL,
    substituto_codigo TEXT NOT NULL,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supervisor_codigo) REFERENCES funcionarios(codigo_individual),
    FOREIGN KEY (substituto_codigo) REFERENCES funcionarios(codigo_individual)
);

-- -----------------------------------------------------------------------------
-- 4. TABELA DE ROTAS MARÍTIMAS (RF 2, RN 9)
-- Origem, destino e distância fixa para cálculo automático da estimativa de chegada (33 km/h).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rotas_maritimas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origem TEXT NOT NULL,
    destino TEXT NOT NULL,
    distancia_km REAL NOT NULL CHECK (distancia_km > 0),
    UNIQUE(origem, destino)
);

-- -----------------------------------------------------------------------------
-- 5. TABELA DE NAVIOS (RF 2, RF 3, RF 5, RF 8, RN 1, RN 2, RN 8, RN 11)
-- Embarcações que transportam apenas contêineres, com estado e GPS marítimo.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS navios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    numero_imo TEXT NOT NULL UNIQUE, -- Número IMO único (International Maritime Organization)
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quantidade_cargas_realizadas INTEGER DEFAULT 0 CHECK (quantidade_cargas_realizadas >= 0),
    estado_operacional TEXT NOT NULL CHECK (
        estado_operacional IN (
            'OPERANTE',
            'AGENDADO_PARA_REFORMA',
            'EM_REFORMA',
            'APROVADO_PARA_REFORMA'
        )
    ) DEFAULT 'OPERANTE',
    localizacao_latitude REAL,
    localizacao_longitude REAL,
    status_localizacao TEXT NOT NULL CHECK (
        status_localizacao IN ('DENTRO_DO_PORTO', 'FORA_DO_PORTO', 'NO_PORTO_DE_DESTINO')
    ) DEFAULT 'DENTRO_DO_PORTO',
    tempo_fora_porto_segundos INTEGER DEFAULT 0 CHECK (tempo_fora_porto_segundos >= 0), -- RF 5
    porto_origem TEXT,
    porto_destino TEXT,
    data_ultima_manutencao TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 6. TABELA DE TIPOS DE CARGA (RF 2, RF 9, RN 13)
-- Classificação das mercadorias, cadastrado pelo Supervisor.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_carga (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    categoria_risco TEXT NOT NULL,
    requisitos_especiais TEXT,
    cadastrado_por_codigo TEXT NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cadastrado_por_codigo) REFERENCES funcionarios(codigo_individual)
);

-- -----------------------------------------------------------------------------
-- 7. TABELA DE MODELOS DE CHECKLIST (RF 2, RF 9, RN 14)
-- Vinculado a cada Tipo de Carga, criado pelo Supervisor.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklist_modelos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_carga_id INTEGER NOT NULL UNIQUE,
    titulo TEXT NOT NULL,
    criado_por_codigo TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_carga_id) REFERENCES tipos_carga(id),
    FOREIGN KEY (criado_por_codigo) REFERENCES funcionarios(codigo_individual)
);

-- -----------------------------------------------------------------------------
-- 8. TABELA DE ITENS DE CHECKLIST (RF 9, RN 14)
-- Itens de verificação do checklist. Itens críticos exigem "Conforme" para aprovação.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklist_itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modelo_id INTEGER NOT NULL,
    descricao TEXT NOT NULL,
    is_critico BOOLEAN NOT NULL DEFAULT 0, -- 1 = Crítico (bloqueia aprovação se Não Conforme), 0 = Não crítico
    FOREIGN KEY (modelo_id) REFERENCES checklist_modelos(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 9. TABELA DE CONTÊINERES (RF 2, RF 3, RF 17, RN 5, RN 6, RN 7)
-- Estruturas metálicas vinculadas a um tipo de carga e a um navio.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conteineres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_identificacao TEXT NOT NULL UNIQUE,
    tipo_carga_id INTEGER, -- Um contêiner transporta apenas um tipo de carga (RN 5)
    material_carregado TEXT,
    data_fabricacao DATE NOT NULL,
    data_ultima_manutencao DATE,
    referencia_tempo_uso TEXT NOT NULL CHECK (
        referencia_tempo_uso IN ('FABRICACAO', 'ULTIMA_MANUTENCAO')
    ) DEFAULT 'FABRICACAO', -- Definido pelo Supervisor (RN 7)
    estado TEXT NOT NULL CHECK (
        estado IN (
            'OPERANTE',
            'AGENDADO_PARA_REFORMA',
            'EM_REFORMA',
            'APROVADO_PARA_REFORMA'
        )
    ) DEFAULT 'OPERANTE',
    navio_id INTEGER, -- Alocado a um navio (RN 6: navio carrega apenas contêineres)
    qrcode_id TEXT NOT NULL UNIQUE, -- QR Code único e imutável (RF 17, RN 17)
    FOREIGN KEY (tipo_carga_id) REFERENCES tipos_carga(id),
    FOREIGN KEY (navio_id) REFERENCES navios(id)
);

-- -----------------------------------------------------------------------------
-- 10. TABELA DE CARGAS (RF 2, RF 4, RF 6, RF 17, RN 4, RN 13, RN 16)
-- Cargas movimentadas e armazenadas no porto.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cargas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_identificador TEXT NOT NULL UNIQUE, -- Identificador no formato ex: ABC-2026-0042
    tipo_carga_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    material TEXT NOT NULL,
    peso_kg REAL NOT NULL CHECK (peso_kg > 0), -- Atributo obrigatório (RN 13)
    volume_m3 REAL NOT NULL CHECK (volume_m3 > 0), -- Atributo obrigatório (RN 13)
    valor_declarado REAL NOT NULL CHECK (valor_declarado >= 0), -- Atributo obrigatório (RN 13)
    natureza TEXT NOT NULL, -- Atributo obrigatório (RN 13)
    data_prevista_agendamento TIMESTAMP NOT NULL,
    data_entrada_porto TIMESTAMP,
    data_saida_porto TIMESTAMP,
    destino_final TEXT NOT NULL,
    porto_descarga TEXT NOT NULL, -- Porto de descarga individual da carga (RF 2, RF 6.6, RN 13)
    status_fluxo TEXT NOT NULL CHECK (
        status_fluxo IN (
            'AGENDAMENTO',
            'RECEBIDA_INSPECAO',
            'ARMAZENAGEM',
            'PRONTA_PARA_ENTREGA',
            'SAIDA_DO_PORTO',
            'EM_TRANSITO',
            'ENTREGUE',
            'RECUSADA',
            'CANCELADA'
        )
    ) DEFAULT 'AGENDAMENTO', -- 8 etapas do fluxo + Recusada/Cancelada (RF 6)
    motivo_recusa TEXT, -- Registrado quando RECUSADA (RF 6.2)
    motivo_cancelamento TEXT, -- Registrado pelo Supervisor quando CANCELADA (RF 6, RN 16)
    conteiner_id INTEGER, -- Vinculada ao contêiner
    estivador_selecionado_codigo TEXT, -- Código do estivador que selecionou a carga (RF 1.1)
    qrcode_id TEXT NOT NULL UNIQUE, -- QR Code único e imutável (RF 17, RN 17)
    FOREIGN KEY (tipo_carga_id) REFERENCES tipos_carga(id),
    FOREIGN KEY (conteiner_id) REFERENCES conteineres(id),
    FOREIGN KEY (estivador_selecionado_codigo) REFERENCES funcionarios(codigo_individual)
);

-- -----------------------------------------------------------------------------
-- 11. TABELA DE INSPEÇÕES DE CARGA (RF 1.7, RF 6.2, RF 9, RN 14)
-- Registra as inspeções formais realizadas pelos Inspetores.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspecoes_carga (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carga_id INTEGER NOT NULL,
    inspetor_codigo TEXT NOT NULL,
    data_inspecao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado TEXT NOT NULL CHECK (resultado IN ('APROVADA', 'RECUSADA')),
    observacoes TEXT,
    FOREIGN KEY (carga_id) REFERENCES cargas(id),
    FOREIGN KEY (inspetor_codigo) REFERENCES funcionarios(codigo_individual)
);

-- -----------------------------------------------------------------------------
-- 12. TABELA DE RESPOSTAS DO CHECKLIST DE INSPEÇÃO (RF 9, RN 14)
-- Armazena os itens checados durante a inspeção técnica.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS respostas_checklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspecao_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    conforme BOOLEAN NOT NULL, -- 1 = Conforme, 0 = Não Conforme
    observacao TEXT,
    FOREIGN KEY (inspecao_id) REFERENCES inspecoes_carga(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES checklist_itens(id)
);

-- -----------------------------------------------------------------------------
-- 13. TABELA DE REGISTROS DE CONFERENTE (RF 1.2, RF 6.2)
-- Registra o recebimento físico e as condições físicas na saída pelo Conferente.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recebimentos_saidas_conferente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carga_id INTEGER NOT NULL,
    conferente_codigo TEXT NOT NULL,
    tipo_operacao TEXT NOT NULL CHECK (tipo_operacao IN ('RECEBIMENTO', 'SAIDA')),
    quantidade_observada INTEGER NOT NULL CHECK (quantidade_observada >= 0),
    estado_geral_fisico TEXT NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carga_id) REFERENCES cargas(id),
    FOREIGN KEY (conferente_codigo) REFERENCES funcionarios(codigo_individual)
);

-- -----------------------------------------------------------------------------
-- 14. TABELA DE MOVIMENTAÇÕES DO ESTIVADOR (RF 1.1)
-- Registro de movimentação de carga pelo Estivador.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimentacoes_estivador (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carga_id INTEGER NOT NULL,
    estivador_codigo TEXT NOT NULL,
    estado_movimentacao TEXT NOT NULL CHECK (
        estado_movimentacao IN ('EM_CARREGAMENTO', 'PARADO', 'CONCLUIDO')
    ),
    objeto_carregado TEXT NOT NULL,
    data_hora_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carga_id) REFERENCES cargas(id),
    FOREIGN KEY (estivador_codigo) REFERENCES funcionarios(codigo_individual)
);

-- -----------------------------------------------------------------------------
-- 15. TABELA DE HISTÓRICO DE MANUTENÇÕES (RF 2, RF 3, RN 11, RN 12)
-- Registro de serviços de manutenção para navios, contêineres e guindastes.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historico_manutencoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entidade_tipo TEXT NOT NULL CHECK (
        entidade_tipo IN ('NAVIO', 'CONTEINER', 'GUINDASTE')
    ),
    entidade_id INTEGER NOT NULL, -- ID da entidade correspondente
    solicitado_por_codigo TEXT NOT NULL,
    aprovado_por_codigo TEXT,
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP,
    descricao_servico TEXT NOT NULL,
    status_manutencao TEXT NOT NULL CHECK (
        status_manutencao IN ('SOLICITADA', 'APROVADA', 'RECUSADA', 'EM_ANDAMENTO', 'CONCLUIDA')
    ) DEFAULT 'SOLICITADA',
    FOREIGN KEY (solicitado_por_codigo) REFERENCES funcionarios(codigo_individual),
    FOREIGN KEY (aprovado_por_codigo) REFERENCES funcionarios(codigo_individual)
);

-- -----------------------------------------------------------------------------
-- 16. TABELA DE LOG DE ALTERAÇÕES (RF 12, RF 17.2, RF 17.4)
-- Registro de rastreabilidade do sistema por cargo e código individual.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs_alteracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_codigo TEXT NOT NULL,
    usuario_cargo TEXT NOT NULL,
    entidade TEXT NOT NULL, -- Ex: 'Cargas', 'Navios', 'Conteineres', 'Etiqueta'
    entidade_id TEXT NOT NULL,
    tipo_alteracao TEXT NOT NULL CHECK (
        tipo_alteracao IN (
            'CRIACAO',
            'EDICAO',
            'EXCLUSAO',
            'REIMPRESSAO_ETIQUETA',
            'SCAN_QRCODE'
        )
    ),
    detalhes TEXT,
    FOREIGN KEY (usuario_codigo) REFERENCES funcionarios(codigo_individual)
);

-- -----------------------------------------------------------------------------
-- 17. TABELA DE TRAIL DE DECISÕES CRÍTICAS (RF 13)
-- Registro imutável de decisões de alto impacto tomaras no sistema.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trail_decisoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_codigo TEXT NOT NULL,
    usuario_cargo TEXT NOT NULL,
    decisao TEXT NOT NULL CHECK (
        decisao IN (
            'APROVOU_CARGA',
            'RECUSOU_CARGA',
            'SOLICITOU_MANUTENCAO',
            'LIBEROU_NAVIO',
            'CANCELOU_ENTREGA',
            'APROVOU_MANUTENCAO',
            'RECUSOU_MANUTENCAO',
            'DESIGNOU_SUBSTITUTO'
        )
    ),
    entidade TEXT NOT NULL,
    entidade_id TEXT NOT NULL,
    detalhes TEXT NOT NULL,
    imutavel BOOLEAN NOT NULL DEFAULT 1, -- Registro imutável (RF 13)
    FOREIGN KEY (usuario_codigo) REFERENCES funcionarios(codigo_individual)
);

-- -----------------------------------------------------------------------------
-- 18. TABELA DE RETIFICAÇÕES DO TRAIL DE DECISÕES (RF 13)
-- Permite adicionar retificação vinculada ao registro imutável do trail.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trail_retificacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trail_id INTEGER NOT NULL,
    usuario_codigo TEXT NOT NULL,
    justificativa_retificacao TEXT NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trail_id) REFERENCES trail_decisoes(id),
    FOREIGN KEY (usuario_codigo) REFERENCES funcionarios(codigo_individual)
);

-- -----------------------------------------------------------------------------
-- 19. TABELA DE REGISTROS DE SCAN DE QR CODE (RF 17.4)
-- Registro de auditoria de leituras de QR Code via dispositivos móveis.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registros_scan_qrcode (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_codigo TEXT NOT NULL,
    entidade_tipo TEXT NOT NULL CHECK (entidade_tipo IN ('CARGA', 'CONTEINER')),
    qrcode_id TEXT NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_codigo) REFERENCES funcionarios(codigo_individual)
);

-- =============================================================================
-- ÍNDICES PARA OTIMIZAÇÃO DE PESQUISAS E CONSULTAS (RF 10)
-- RF 10: O sistema deve permitir pesquisa com os campos: nome do navio,
-- número do contêiner, tipo de carga, período de data e status do fluxo.
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_cargas_status_fluxo ON cargas(status_fluxo);
CREATE INDEX IF NOT EXISTS idx_cargas_tipo_carga ON cargas(tipo_carga_id);
CREATE INDEX IF NOT EXISTS idx_cargas_data_entrada ON cargas(data_entrada_porto);
CREATE INDEX IF NOT EXISTS idx_cargas_data_saida ON cargas(data_saida_porto);
CREATE INDEX IF NOT EXISTS idx_cargas_qrcode ON cargas(qrcode_id);

CREATE INDEX IF NOT EXISTS idx_navios_nome ON navios(nome);
CREATE INDEX IF NOT EXISTS idx_navios_imo ON navios(numero_imo);
CREATE INDEX IF NOT EXISTS idx_navios_estado ON navios(estado_operacional);

CREATE INDEX IF NOT EXISTS idx_conteineres_numero ON conteineres(numero_identificacao);
CREATE INDEX IF NOT EXISTS idx_conteineres_navio ON conteineres(navio_id);
CREATE INDEX IF NOT EXISTS idx_conteineres_qrcode ON conteineres(qrcode_id);

CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_alteracoes(usuario_codigo);
CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_alteracoes(data_hora);

CREATE INDEX IF NOT EXISTS idx_trail_usuario ON trail_decisoes(usuario_codigo);
CREATE INDEX IF NOT EXISTS idx_trail_decisao ON trail_decisoes(decisao);

-- ============================================================
-- NEXUSPORT - POPULAÇÃO INICIAL DE DADOS DE TESTE (SEED.SQL)
-- ============================================================

-- 1. FUNCIONÁRIOS DE TESTE (Cobrindo os 9 Cargos)
-- ============================================================
INSERT INTO funcionarios (id, matricula, codigo_individual, nome, cargo, email, ativo) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'MAT-1001', 'NX-1001-ES', 'Carlos Estivador', 'ESTIVADOR', 'estivador@porto.interno', true),
  ('a1000000-0000-0000-0000-000000000002', 'MAT-2002', 'NX-2002-CF', 'Clara Conferente', 'CONFERENTE_CARGA', 'conferente@porto.interno', true),
  ('a1000000-0000-0000-0000-000000000003', 'MAT-3003', 'NX-3003-AR', 'Artur Arrumador', 'ARRUMADOR_CONSERTADOR', 'arrumador@porto.interno', true),
  ('a1000000-0000-0000-0000-000000000004', 'MAT-4004', 'NX-4004-PL', 'Patricia Planejadora', 'PLANEJADOR_PATIO_NAVIOS', 'planejador@porto.interno', true),
  ('a1000000-0000-0000-0000-000000000005', 'MAT-5005', 'NX-5005-TP', 'Thiago Técnico', 'TECNICO_PORTOS', 'tecnico@porto.interno', true),
  ('a1000000-0000-0000-0000-000000000006', 'MAT-6006', 'NX-8821-SP', 'Sergio Supervisor', 'SUPERVISOR_GERENTE_OPERACOES', 'supervisor@porto.interno', true),
  ('a1000000-0000-0000-0000-000000000007', 'MAT-7007', 'NX-7007-IN', 'Igor Inspetor', 'INSPETOR', 'inspetor@porto.interno', true),
  ('a1000000-0000-0000-0000-000000000008', 'MAT-8008', 'NX-8008-DL', 'Daniela Diretora', 'DIRETOR_OPERACOES_LOGISTICA', 'diretor.ops@porto.interno', true),
  ('a1000000-0000-0000-0000-000000000009', 'MAT-9009', 'NX-9009-DP', 'Paulo Presidente', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'presidente@porto.interno', true)
ON CONFLICT (matricula) DO NOTHING;

-- 2. TIPOS DE CARGA DE EXEMPLO
-- ============================================================
INSERT INTO tipos_carga (id, nome, categoria_risco, requisitos_especiais) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Grãos a Granel (Soja/Milho)', 'Baixo Risco', 'Controle rigoroso de umidade e vespas'),
  ('b1000000-0000-0000-0000-000000000002', 'Carga Refrigerada (Carnes/Frutas)', 'Médio Risco', 'Refrigeração contínua a -18°C'),
  ('b1000000-0000-0000-0000-000000000003', 'Produtos Químicos Industriais', 'Alto Risco (HAZMAT)', 'Isolamento térmico e ventilação especial')
ON CONFLICT (nome) DO NOTHING;

-- 3. MODELOS DE CHECKLIST E ITENS
-- ============================================================
INSERT INTO checklist_modelos (id, tipo_carga_id, nome, descricao, criado_por) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Checklist Padrão Grãos', 'Verificação técnica para grãos agrícolas', 'a1000000-0000-0000-0000-000000000006'),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'Checklist Padrão Refrigerados', 'Verificação de sistemas de refrigeração e vedação', 'a1000000-0000-0000-0000-000000000006')
ON CONFLICT (tipo_carga_id) DO NOTHING;

INSERT INTO checklist_itens (id, checklist_modelo_id, descricao, critico, ordem) VALUES
  ('c2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Lacre do Contêiner Intacto e Sem Avarias Visíveis', true, 1),
  ('c2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Nível de Umidade do Grão dentro do Limite Aceitável (<14%)', true, 2),
  ('c2000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Limpeza Externa das Paredes Laterais', false, 3),
  ('c2000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 'Temperatura Interna Registrada <= -18°C', true, 1),
  ('c2000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'Funcionamento do Gerador Auxiliar de Refrigeração', true, 2)
ON CONFLICT DO NOTHING;

-- 4. ROTAS MARÍTIMAS
-- ============================================================
INSERT INTO rotas_maritimas (id, origem, destino, distancia_km) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Porto de Santos', 'Porto de Roterdã', 10400.00),
  ('d1000000-0000-0000-0000-000000000002', 'Porto de Santos', 'Porto de Xangai', 18500.00),
  ('d1000000-0000-0000-0000-000000000003', 'Porto de Paranaguá', 'Porto de Hamburgo', 10100.00)
ON CONFLICT (origem, destino) DO NOTHING;

-- 5. NAVIOS DE TESTE
-- ============================================================
INSERT INTO navios (id, nome, numero_imo, data_registro_sistema, quantidade_cargas_realizadas, estado_operacional, coordenadas_gps, porto_origem, porto_destino, localizacao, qr_code_url) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'MV SANTOS STAR', 'IMO-9812341', CURRENT_DATE - INTERVAL '1 year', 14, 'OPERANTE', '-23.96, -46.30', 'Porto de Santos', 'Porto de Roterdã', 'DENTRO_DO_PORTO', 'porto.interno/navio?id=e1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000002', 'MV ATLANTIC PACIFIC', 'IMO-9234123', CURRENT_DATE - INTERVAL '4 years', 42, 'OPERANTE', '-23.98, -46.28', 'Porto de Santos', 'Porto de Xangai', 'FORA_DO_PORTO', 'porto.interno/navio?id=e1000000-0000-0000-0000-000000000002')
ON CONFLICT (numero_imo) DO NOTHING;

-- 6. GUINDASTES DE TESTE
-- ============================================================
INSERT INTO guindastes (id, numero_identificacao, estado, data_ultima_manutencao, qr_code_url) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'GND-01-PATIO', 'OPERANTE', CURRENT_DATE - INTERVAL '3 months', 'porto.interno/guindaste?id=f1000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000002', 'GND-02-PATIO', 'EM_MANUTENCAO', CURRENT_DATE - INTERVAL '12 months', 'porto.interno/guindaste?id=f1000000-0000-0000-0000-000000000002')
ON CONFLICT (numero_identificacao) DO NOTHING;

-- 7. CONTÊINERES DE TESTE
-- ============================================================
INSERT INTO containers (id, numero_identificacao, tipo_carga_id, material_carregado, data_fabricacao, data_ultima_manutencao, tempo_uso_referencia, estado, navio_id, qr_code_url) VALUES
  ('g1000000-0000-0000-0000-000000000001', 'CT-9901-GRAOS', 'b1000000-0000-0000-0000-000000000001', 'Soja em grão', '2022-01-15', '2025-06-10', 'DATA_FABRICACAO', 'OPERANTE', 'e1000000-0000-0000-0000-000000000001', 'porto.interno/container?id=g1000000-0000-0000-0000-000000000001'),
  ('g1000000-0000-0000-0000-000000000002', 'CT-9902-REFRIG', 'b1000000-0000-0000-0000-000000000002', 'Carne bovina congelada', '2023-03-20', '2025-08-01', 'DATA_ULTIMA_MANUTENCAO', 'OPERANTE', 'e1000000-0000-0000-0000-000000000001', 'porto.interno/container?id=g1000000-0000-0000-0000-000000000002')
ON CONFLICT (numero_identificacao) DO NOTHING;

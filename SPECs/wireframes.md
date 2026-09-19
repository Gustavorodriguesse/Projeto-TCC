# Protótipos de Tela e Wireframes — NexusPort

Este documento consolida os wireframes e especificações visuais de interface para o sistema **NexusPort**, alinhados ao Design System (`SPECs/design/design.md`), às especificações de `SPECs/agents.md` e aos protótipos de referência em `THEME/`.

---

## 1. Tela de Login e Autenticação (T2.1 / T2.2)

### Especificações Visuais & Comportamentais
- **Fundo:** Dark `#1E293B` (`nexus-900`).
- **Entrada:** Campo de texto centralizado em fonte monoespaçada (`JetBrains Mono`) para digitação do **Código Individual Único** (ex.: `NX-8821-SP`).
- **Confirmação de Cargo:** Após digitação válida, o sistema resolve o cargo automaticamente e exibe o campo de **Cargo** desabilitado/travado, apenas para confirmação visual do usuário.

```
+-----------------------------------------------------------------------+
|                                                                       |
|                           [ LOGO NEXUSPORT ]                          |
|                     Sistema Operacional Portuário                     |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  Acesso Operacional ao Sistema                                  |  |
|  |                                                                 |  |
|  |  Código Individual Único (Matrícula)                            |  |
|  |  [ NX-8821-SP                                              ]    |  |
|  |                                                                 |  |
|  |  Cargo Identificado (Confirmação)                               |  |
|  |  [ SUPERVISOR / GERENTE DE OPERAÇÕES                   ] (LOCK) |  |
|  |                                                                 |  |
|  |  [ ENTRAM NO SISTEMA -> ] (Botão Primário #445987)              |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 2. Dashboard por Cargo (T7.1 - T7.6)

### Especificações Visuais & Comportamentais
- **Barra Superior:** Identificação do Usuário, Cargo e Código Monoespaçado.
- **Menu Lateral:** Retrátil (240px -> 64px), filtrado conforme as permissões do cargo.
- **Grid de Cards Operacionais:** Exibição em formato de cards simples com contagem e ícone.

```
+---------------------------------------------------------------------------------------+
| NEXUSPORT | Contexto: Visão Geral Operacional       [ Supervisor: NX-8821-SP ] [ Sair ] |
+-----------+---------------------------------------------------------------------------+
| (Sidebar) |                                                                           |
| [x] Inicio|  [ Card 1: Navios em Manutenção ]   [ Card 2: Cargas Armazenadas ]        |
| [ ] Cargas|  |  2                              |   |  142                           | |
| [ ] Navios|  +---------------------------------+   +--------------------------------+ |
| [ ] Patio |                                                                           |
| [ ] Trail |  [ Card 3: Aguardando Liberação ]   [ Card 4: Alerta Manut. > 3 anos ]    |
| [ ] QR    |  |  18                             |   |  1 (IMO 9234123)               | |
|           |  +---------------------------------+   +--------------------------------+ |
|           |                                                                           |
|           |  +---------------------------------------------------------------------+  |
|           |  | Tabela: Cargas Recentes em Processamento                        |  |
|           |  | ID       | Tipo    | Status             | Destino  | Ações          |  |
|           |  | CG-0042  | Grãos   | PRONTA_PRA_ENTREGA | Santos   | [ Detalhes ]   |  |
|           |  +---------------------------------------------------------------------+  |
+-----------+---------------------------------------------------------------------------+
```

---

## 3. Cadastro e Ficha de Carga com Agendamento (T3.x / T4.1)

```
+---------------------------------------------------------------------------------------+
| Cadastrar Nova Carga                                                                  |
+---------------------------------------------------------------------------------------+
|  Tipo de Carga:         [ Grãos de Soja (Selecione)               v ]                 |
|  Quantidade (t):        [ 2500.00                                   ]                 |
|  Peso Total (kg):       [ 2500000                                   ]                 |
|  Volume (m³):           [ 3200                                      ]                 |
|  Valor Declarado (R$):  [ 1250000.00                                  ]                 |
|  Natureza / Categoria:  [ Carga Agrícola / A Granel                 ]                 |
|  Porto de Descarga:     [ Porto de Tubarão - ES                     ]                 |
|  Data Prevista Entrega: [ 25/10/2026                                ]                 |
|                                                                                       |
|  [ SALVAR E GERAR ETIQUETA QR CODE ]                                                  |
+---------------------------------------------------------------------------------------+
```

---

## 4. Tela de Inspeção Técnica com Checklist (T4.7 - T4.10)

```
+---------------------------------------------------------------------------------------+
| Inspeção Técnica Formal — Carga #CG-2026-0042                                         |
+---------------------------------------------------------------------------------------+
| Tipo de Carga: Grãos | Inspetor: INSP-3312                                            |
|                                                                                       |
| Modelo de Checklist Aplicado: Checklist Padrão Granel v1.2                            |
|                                                                                       |
| [x] Item 1 (CRÍTICO): Lacre do Contêiner Intacto e Sem Avarias Visíveis  (Conforme)   |
| [x] Item 2 (CRÍTICO): Umidade e Temperatura dentro do Limite Aceitável    (Conforme)   |
| [ ] Item 3 (NÃO CRÍTICO): Limpeza Externa das Paredes Laterais          (Observação) |
|                                                                                       |
| Observações do Inspetor:                                                              |
| [ Ausência de contaminação visível. Lacre nº 992813 conferido.                     ]  |
|                                                                                       |
| [ APROVAR INSPEÇÃO ] (Verde)      [ RECUSAR CARGA ] (Vermelho - Exige Motivo)         |
+---------------------------------------------------------------------------------------+
```

---

## 5. Tela de Liberação pelo Supervisor (Despacho) (T4.15 / T4.16)

```
+---------------------------------------------------------------------------------------+
| Regulação de Saída e Liberação de Embarcações                                         |
+---------------------------------------------------------------------------------------+
| Navio: MV SANTOS STAR (IMO: 9812341) | Destino: Porto de Roterdã                      |
| Localização Atual: DENTRO_DO_PORTO   | Rota Cadastrada: Santos -> Roterdã (10.400 km) |
| Tempo Estimado de Viagem (33 km/h): 13 dias e 3 horas                                 |
|                                                                                       |
| Cargas e Contêineres Vinculados ao Navio (12 Contêineres / 48 Cargas):                 |
| - Contêiner CT-9901 -> 4 Cargas [Prontas para Entrega]                                |
| - Contêiner CT-9902 -> 4 Cargas [Prontas para Entrega]                                |
|                                                                                       |
| [ LIBERAR SAÍDA DO NAVIO E CARGAS ] (Ação Crítica - Abre Modal de Confirmação)        |
+---------------------------------------------------------------------------------------+
```

---

## 6. Modal de Confirmação e Registro no Trail de Decisões (T8.3)

```
+---------------------------------------------------------------------------------------+
| MODAL DE CONFIRMAÇÃO: LIBERAÇÃO DE NAVIO                                              |
+---------------------------------------------------------------------------------------+
| ATENÇÃO: Esta ação é imutável e registrará a decisão no Trail do Sistema.             |
|                                                                                       |
| Impacto da Ação:                                                                      |
| - Liberação automática de 12 contêineres e 48 cargas vinculadas.                      |
| - Alteração de status das cargas para "EM TRÂNSITO".                                  |
| - Atualização da localização do navio para "FORA_DO_PORTO".                            |
|                                                                                       |
| Justificativa / Observações (Opcional):                                               |
| [ Documentação aduaneira conferida e liberada pela Inspetoria.                    ]   |
|                                                                                       |
| [ CONFIRMAR LIBERAÇÃO IMUTÁVEL ]             [ CANCELAR ]                             |
+---------------------------------------------------------------------------------------+
```

---

## 7. Geração e Impressão de Etiqueta com QR Code (T6.1 - T6.5)

### Formato de Etiqueta Térmica PDF (10x10 cm ou 10x15 cm)

```
+---------------------------------------------------+
|  NEXUSPORT — ETIQUETA DE IDENTIFICAÇÃO           |
|  -----------------------------------------------  |
|                                                   |
|           +-----------------------+               |
|           |  [ QR CODE GERADO ]   |               |
|           |  URL: porto.interno/  |               |
|           |  carga?id=CG-0042     |               |
|           +-----------------------+               |
|                                                   |
|  IDENTIFICADOR: CG-2026-0042                      |
|  TIPO DE CARGA: Grãos de Soja                     |
|  PESO: 25.000 kg | VOLUME: 32 m³                   |
|  PORTO DE DESCARGA: Santos - SP                   |
|  DATA RECEBIMENTO: 19/09/2026 14:30               |
|                                                   |
|  [ IMPRIMIR ETIQUETA (PDF) ]  [ REIMPRIMIR ]      |
+---------------------------------------------------+
```

---

## 8. Interface Mobile para Operação de Pátio / Leitor de QR Code (T6.6 / T6.7)

### Layout Mobile (< 768px)
- **Navegação:** Barra inferior (Bottom Navigation) com botão central destacado para escanear QR Code.

```
+-----------------------------------+
| NEXUSPORT MOBILE   [INSP-3312]    |
+-----------------------------------+
| Câmera Ativa / Leitor de QR Code  |
| +-------------------------------+ |
| |                               | |
| |       [ MÁSCARA SCAN ]        | |
| |                               | |
| +-------------------------------+ |
| Aponta a câmera para a etiqueta  |
|                                   |
| Redirecionando para:              |
| Tela de Inspeção da Carga #CG-0042|
+-----------------------------------+
| [Inicio]  [ SCANNER ]  [Perfil]   |
+-----------------------------------+
```

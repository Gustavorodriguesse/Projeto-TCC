# Manual Operacional - NexusPort (STS-01 Santos)

Este manual destina-se aos operadores do Terminal STS-01 do Porto de Santos.

---

## 1. Perfis e Níveis de Acesso (RLS)

### Técnico em Portos (TÁTICO / OPERACIONAL - Nível 1)
- **Acesso Exclusivo:** Gestão e cadastro de funcionários e cadastro de visitantes do terminal.
- **Operações:** Agendamento de cargas, recebimento com inspeção de checklist, alocação em baias do pátio e emissão de etiquetas QR Code.

### Supervisor de Operações (TÁTICO / GESTÃO - Nível 2)
- **Acesso Operacional:** Visualização e acompanhamento de cargas, navios, checklist e manutenção.
- **Delegação:** Cadastro e ativação de Supervisor Substituto (regra de substituto único).
- **Trilha de Decisão:** Registro e consulta de decisões críticas operacionais.

### Gerente de Operações (ESTRATÉGICO / EXECUTIVO - Nível 3)
- **Acesso Global:** Visão estratégica de relatórios, produtividade da equipe e indicadores de desempenho (KPIs).
- **Aprovações:** Assinatura e retificação em decisões críticas gravadas na trilha auditável.

---

## 2. Fluxo Principal de Cargas (Core Business)

1. **Agendamento:** A carga é inserida com número de contêiner, tipo de carga, navio e data limite de liberação.
2. **Recebimento & Inspeção:** Verificação de integridade e preenchimento de checklist de avarias no portal do terminal.
3. **Armazenamento:** Atribuição da baia física no pátio (Ex: `PÁTIO-A1`, `PÁTIO-B3`).
4. **Vinculação:** Associação da carga ao navio atracado ou em espera.
5. **Etiqueta QR Code:** Geração da etiqueta física (10x10cm) para colagem no contêiner e escaneamento no pátio.
6. **Liberação & Trânsito:** Autorização de movimentação para embarque ou saída rodoviária.

---

## 3. QR Code e Scanner
- **Leitura via Câmera:** Na seção **Scanner QR**, aponte a câmera do dispositivo móvel para o código impresso na etiqueta.
- **Simulação Manual:** Em computadores sem câmera ativada, digite o código (ex: `QR-CRG-2026-001`) no campo de simulação para abrir as ações operacionais correspondentes ao seu perfil.

---

## 4. Localização e Estimativas (ETA)
- O status de cada navio é classificado automaticamente entre `DENTRO_DO_PORTO`, `FORA_DO_PORTO` e `NO_PORTO_DE_DESTINO`.
- A estimativa de chegada (ETA) é calculada considerando a distância restante e a velocidade constante regulamentar de **33 km/h (17.8 nós)**.

/**
 * Lógica do Módulo Scanner QR Code (scanner.html) - NexusPort
 * Integra leitura via câmera (html5-qrcode) ou simulação e redireciona
 * para a ação específica do cargo do usuário logado (RF 17.3 / RN 19 / T5.7 / T5.8).
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) return;

  const iniciarCameraBtn = document.getElementById('iniciarCameraBtn');
  const simulatedInput = document.getElementById('simulatedQrInput');
  const simulateBtn = document.getElementById('simulateScanBtn');

  const resultCard = document.getElementById('qrResultCard');
  const resultCodeTag = document.getElementById('resultCodeTag');
  const resEntityId = document.getElementById('resEntityId');
  const resTipo = document.getElementById('resTipo');
  const resPeso = document.getElementById('resPeso');
  const resNavio = document.getElementById('resNavio');
  const resRoleTitle = document.getElementById('resRoleTitle');
  const resRoleMsg = document.getElementById('resRoleMsg');
  const executarBtn = document.getElementById('executarAcaoScanBtn');

  let html5QrCodeScanner = null;
  let targetRedirectUrl = 'cargas.html';

  if (iniciarCameraBtn) {
    iniciarCameraBtn.addEventListener('click', () => {
      iniciarCamera();
    });
  }

  function iniciarCamera() {
    if (typeof Html5Qrcode !== 'undefined') {
      const elem = document.getElementById('qrReader');
      if (elem) elem.innerHTML = '';

      html5QrCodeScanner = new Html5Qrcode("qrReader");
      html5QrCodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          processarScan(decodedText);
          html5QrCodeScanner.stop();
        },
        () => {}
      ).catch(err => {
        console.warn("Câmera indisponível ou permissão negada:", err);
        alert("Câmera indisponível. Utilize o campo de simulação manual abaixo para testar a leitura de QR Code.");
      });
    }
  }

  if (simulateBtn && simulatedInput) {
    simulateBtn.addEventListener('click', () => {
      const val = simulatedInput.value.trim();
      if (!val) {
        alert('Informe o texto do QR Code para simular.');
        return;
      }
      processarScan(val);
      simulatedInput.value = '';
    });
  }

  function processarScan(qrCodeText) {
    let rawCode = qrCodeText;
    if (rawCode.includes('?scan=') || rawCode.includes('?qr=')) {
      try {
        const url = new URL(rawCode, window.location.origin);
        rawCode = url.searchParams.get('scan') || url.searchParams.get('qr') || rawCode;
      } catch (e) {}
    }

    const localCargas = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');
    const match = localCargas.find(c => c.id === rawCode || c.qrCode === rawCode || c.id === rawCode.replace('QR-', ''));

    const displayId = match ? match.id : rawCode;
    const displayTipo = match ? match.tipo : 'Carga Geral / Contêiner';
    const displayPeso = match ? `${match.peso} / ${match.volume}` : '25.5 t / 40 m³';
    const displayNavio = match ? (match.navio || 'MV Santos Star') : 'MV Santos Star';

    // Grava log de leitura QR Code no pátio (T5.8)
    const logs = JSON.parse(localStorage.getItem('nexus_audit_logs') || '[]');
    logs.unshift({
      data_hora: new Date().toISOString(),
      cargo: session.cargo_nome || session.cargo,
      codigo_usuario: session.codigo_individual || session.codigo,
      entidade: displayId,
      tipo_alteracao: 'Leitura QR Code no Pátio (Scan)'
    });
    localStorage.setItem('nexus_audit_logs', JSON.stringify(logs));

    // Define direcionamento por cargo (T5.7)
    const cargo = session.cargo;
    let msgAcao = '';

    if (cargo === 'ESTIVADOR') {
      msgAcao = 'Redirecionamento para a Ficha de Movimentação no Pátio.';
      targetRedirectUrl = `cargas.html?carga=${displayId}`;
    } else if (cargo === 'CONFERENTE_CARGA') {
      msgAcao = 'Redirecionamento para Ficha de Recebimento Físico e Condições de Saída.';
      targetRedirectUrl = `cargas.html?carga=${displayId}`;
    } else if (cargo === 'INSPETOR') {
      msgAcao = 'Redirecionamento para o Checklist Técnico de Inspeção.';
      targetRedirectUrl = `inspecao.html?carga=${displayId}`;
    } else if (cargo === 'ARRUMADOR_CONSERTADOR') {
      msgAcao = 'Redirecionamento para Alteração do Status "Pronta para Entrega".';
      targetRedirectUrl = `cargas.html?carga=${displayId}`;
    } else if (cargo === 'SUPERVISOR_GERENTE_OPERACOES') {
      msgAcao = 'Redirecionamento para o Painel de Cargas Vinculadas do Contêiner.';
      targetRedirectUrl = `cargas.html?carga=${displayId}`;
    } else {
      msgAcao = 'Redirecionamento para o Painel Geral de Cargas.';
      targetRedirectUrl = `cargas.html?carga=${displayId}`;
    }

    if (resultCodeTag) resultCodeTag.textContent = `Código Lido: ${rawCode}`;
    if (resEntityId) resEntityId.textContent = displayId;
    if (resTipo) resTipo.textContent = displayTipo;
    if (resPeso) resPeso.textContent = displayPeso;
    if (resNavio) resNavio.textContent = displayNavio;
    if (resRoleTitle) resRoleTitle.textContent = `Direcionamento para ${session.cargo_nome || session.cargo}:`;
    if (resRoleMsg) resRoleMsg.textContent = msgAcao;

    if (resultCard) resultCard.classList.remove('hidden');
  }

  if (executarBtn) {
    executarBtn.addEventListener('click', () => {
      window.location.href = targetRedirectUrl;
    });
  }
});

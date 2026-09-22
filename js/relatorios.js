/**
 * Lógica do Módulo Relatórios & PDF (relatorios.html) - NexusPort
 * Gera relatórios PDF A4 em 4 seções sequenciais (RF 11 & 16) e exibe
 * a tabela de produtividade operacional por cargo e funcionário (T6.9, T6.10).
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) return;

  const selectCarga = document.getElementById('relatorioCargaSelect');
  const gerarPdfBtn = document.getElementById('gerarPdfBtn');
  const prodTableBody = document.getElementById('produtividadeTableBody');

  const cargas = JSON.parse(localStorage.getItem('nexus_cargas_fluxo') || '[]');

  function popularCargas() {
    if (!selectCarga) return;
    selectCarga.innerHTML = '<option value="">Selecione a Carga para Emitir PDF A4...</option>';
    cargas.forEach(c => {
      selectCarga.innerHTML += `<option value="${c.id}">${c.id} — ${c.tipo} (${c.status})</option>`;
    });
  }

  popularCargas();

  if (gerarPdfBtn) {
    gerarPdfBtn.addEventListener('click', () => {
      const idCarga = selectCarga ? selectCarga.value : '';
      if (!idCarga) {
        alert('Por favor, selecione uma carga para gerar o relatório PDF A4.');
        return;
      }
      gerarRelatorioPdfA4(idCarga);
    });
  }

  function gerarRelatorioPdfA4(idCarga) {
    const c = cargas.find(item => item.id === idCarga) || {
      id: idCarga, tipo: 'Grãos Soltos', peso: '25.5 t', volume: '40 m³', valor: 'R$ 80.000', natureza: 'Agrícola',
      portoDescarga: 'Porto de Roterdã', destino: 'Amsterdã', status: 'ARMAZENAGEM', container: 'CONT-991', navio: 'MV Santos Star'
    };

    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ format: 'a4' });

      // Cabeçalho Institucional
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('NEXUSPORT - SISTEMA DE AUTOMAÇÃO PORTUÁRIA', 14, 12);
      doc.setFontSize(10);
      doc.text('RELATÓRIO OPERACIONAL INTEGRADO DE CARGA (FORMATO A4)', 14, 18);

      let y = 35;

      // Seção 1: Dados da Carga
      doc.setFillColor(245, 247, 250);
      doc.rect(14, y, 182, 8, 'F');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.text('1. DADOS DA CARGA', 16, y + 6);
      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Código da Carga: ${c.id}`, 16, y);
      doc.text(`Tipo de Carga: ${c.tipo}`, 110, y);
      y += 6;
      doc.text(`Peso Declarado: ${c.peso}`, 16, y);
      doc.text(`Volume: ${c.volume}`, 110, y);
      y += 6;
      doc.text(`Valor Declarado: ${c.valor || 'R$ 0,00'}`, 16, y);
      doc.text(`Natureza da Mercadoria: ${c.natureza || 'Geral'}`, 110, y);
      y += 12;

      // Seção 2: Dados do Navio
      doc.setFillColor(245, 247, 250);
      doc.rect(14, y, 182, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('2. DADOS DO NAVIO', 16, y + 6);
      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Nome da Embarcação: ${c.navio || 'Não Vinculado'}`, 16, y);
      doc.text(`Número IMO: IMO-9821034`, 110, y);
      y += 6;
      doc.text(`Porto de Origem: Porto de Santos (STS-01)`, 16, y);
      doc.text(`Porto de Destino da Viagem: ${c.destino || 'Destino Internacional'}`, 110, y);
      y += 12;

      // Seção 3: Dados do Contêiner
      doc.setFillColor(245, 247, 250);
      doc.rect(14, y, 182, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('3. DADOS DO CONTÊINER', 16, y + 6);
      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Identificação do Contêiner: ${c.container || 'Não Alocado'}`, 16, y);
      doc.text(`Tipo de Carga Vinculada: ${c.tipo}`, 110, y);
      y += 6;
      doc.text(`Estado Operacional: OPERANTE`, 16, y);
      doc.text(`Referência Temp. Uso: Data de Fabricação`, 110, y);
      y += 12;

      // Seção 4: Resumo do Fluxo
      doc.setFillColor(245, 247, 250);
      doc.rect(14, y, 182, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('4. RESUMO DO FLUXO OPERACIONAL', 16, y + 6);
      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Status Atual no Fluxo: ${c.status}`, 16, y);
      doc.text(`Porto de Descarga Individual: ${c.portoDescarga}`, 110, y);
      y += 6;
      doc.text(`Data/Hora de Entrada: ${new Date().toLocaleDateString('pt-BR')} 08:00`, 16, y);
      doc.text(`Data/Hora Prevista Saída: ${new Date().toLocaleDateString('pt-BR')} 18:00`, 110, y);

      doc.save(`Relatorio_A4_${c.id}.pdf`);
      alert(`Relatório PDF A4 em 4 seções gerado com sucesso para a carga ${c.id}!`);
    } else {
      alert(`Relatório A4 Gerado:\n1. Carga: ${c.id}\n2. Navio: ${c.navio}\n3. Contêiner: ${c.container}\n4. Status: ${c.status}`);
    }
  }

  // Tabela de Produtividade (T6.9, T6.10)
  function renderProdutividadeTable() {
    if (!prodTableBody) return;

    const fullList = [
      { matricula: 'MAT-8821', nome: 'Carlos Silva', cargo: 'Supervisor', volume: '142 Liberações / Despachos', ultima: 'Hoje às 14:30' },
      { matricula: 'MAT-6090', nome: 'Patricia Rocha', cargo: 'Inspetora', volume: '98 Vistorias com Checklist', ultima: 'Hoje às 11:15' },
      { matricula: 'MAT-2050', nome: 'Mariana Souza', cargo: 'Conferente', volume: '210 Registros de Recebimento', ultima: 'Ontem às 16:45' },
      { matricula: 'MAT-1040', nome: 'João Pedro', cargo: 'Estivador', volume: '320 Movimentações de Pátio', ultima: 'Hoje às 09:10' }
    ];

    const isDiretor = ['DIRETOR_OPERACOES_LOGISTICA', 'DIRETOR_PRESIDENTE_SUPERINTENDENTE', 'CONSELHO_ADMINISTRACAO'].includes(session.cargo);
    const isInspetor = session.cargo === 'INSPETOR';

    let list = fullList;
    if (!isDiretor && !isInspetor) {
      list = fullList.filter(f => f.matricula === session.matricula);
      if (list.length === 0) {
        list = [{ matricula: session.matricula, nome: session.nome || 'Operador', cargo: session.cargo_nome || session.cargo, volume: '15 Operações Realizadas', ultima: 'Hoje' }];
      }
    }

    prodTableBody.innerHTML = list.map(item => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <td class="p-3 font-mono font-bold text-nexus-500">${item.matricula}</td>
        <td class="p-3 font-bold">${item.nome}</td>
        <td class="p-3 text-slate-500">${item.cargo}</td>
        <td class="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">${item.volume}</td>
        <td class="p-3 text-slate-400 font-mono text-[11px]">${item.ultima}</td>
      </tr>
    `).join('');
  }

  renderProdutividadeTable();
});

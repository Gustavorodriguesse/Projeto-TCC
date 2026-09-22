/**
 * Lógica do Módulo Delegação de Supervisor (delegacao.html) - NexusPort
 * Gerencia a substituição temporária do Supervisor Titular garantindo o limite
 * rígido de apenas 1 substituto ativo por vez e suporte a revogação (RF 14 / T7.6 - T7.9).
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = window.currentUserSession || NexusAuth.getSession();
  if (!session) return;

  const substitutoNome = document.getElementById('substitutoNome');
  const substitutoVigencia = document.getElementById('substitutoVigencia');
  const revogarBtn = document.getElementById('revogarDelegacaoBtn');
  const delegForm = document.getElementById('delegacaoForm');

  function updateDelegacaoUI() {
    const activeDeleg = JSON.parse(localStorage.getItem('nexus_active_delegation') || 'null');
    if (activeDeleg) {
      if (substitutoNome) substitutoNome.textContent = `Substituto Ativo: ${activeDeleg.substitutoMatricula}`;
      if (substitutoVigencia) substitutoVigencia.textContent = `Vigência: de ${new Date(activeDeleg.inicio).toLocaleString('pt-BR')} até ${new Date(activeDeleg.fim).toLocaleString('pt-BR')} (Designado por ${activeDeleg.supervisor})`;
      if (revogarBtn) revogarBtn.classList.remove('hidden');
    } else {
      if (substitutoNome) substitutoNome.textContent = 'Nenhum Substituto Ativo';
      if (substitutoVigencia) substitutoVigencia.textContent = 'Cada Supervisor Titular pode ter no máximo 1 substituto ativo por vez (RF 14).';
      if (revogarBtn) revogarBtn.classList.add('hidden');
    }
  }

  updateDelegacaoUI();

  if (delegForm) {
    delegForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const activeDeleg = JSON.parse(localStorage.getItem('nexus_active_delegation') || 'null');
      if (activeDeleg) {
        alert('REGRA DE NEGÓCIO (RF 14): Apenas 1 substituto ativo por Supervisor é permitido! Revogue a delegação atual antes de designar um novo.');
        return;
      }

      const substitutoMatricula = document.getElementById('delegSubstitutoMatricula').value.trim();
      const inicio = document.getElementById('delegDataInicio').value;
      const fim = document.getElementById('delegDataFim').value;

      const newDeleg = {
        supervisor: session.codigo_individual || session.codigo,
        substitutoMatricula, inicio, fim, dataDesignacao: new Date().toISOString()
      };

      localStorage.setItem('nexus_active_delegation', JSON.stringify(newDeleg));
      updateDelegacaoUI();

      if (window.registrarTrailDecisao) {
        window.registrarTrailDecisao(`Designou Substituto ${substitutoMatricula}`, 'SISTEMA_DELEGACAO', `Período de ${inicio} até ${fim}`);
      }

      alert(`Sucesso! Funcionário ${substitutoMatricula} designado temporariamente como substituto do Supervisor com poderes de liberação.`);
    });
  }

  if (revogarBtn) {
    revogarBtn.addEventListener('click', () => {
      if (confirm('ATENÇÃO: Deseja REVOGAR IMEDIATAMENTE os poderes do substituto temporário?')) {
        const activeDeleg = JSON.parse(localStorage.getItem('nexus_active_delegation') || '{}');
        localStorage.removeItem('nexus_active_delegation');
        updateDelegacaoUI();

        if (window.registrarTrailDecisao) {
          window.registrarTrailDecisao(`Revogou Substituto ${activeDeleg.substitutoMatricula || ''}`, 'SISTEMA_DELEGACAO', 'Revogação antecipada pelo Supervisor Titular');
        }

        alert('Delegação revogada com sucesso! Poderes de liberação do substituto encerrados imediatamente.');
      }
    });
  }
});

'use client';

import React, { useState } from 'react';

// Mapeamento de perfis cadastrados para simulação de resolução automática por código
const ROLE_DATABASE: Record<string, { roleName: string; roleCode: string; department: string }> = {
  'NX-8821-SP': {
    roleName: 'Supervisor / Gerente de Operações',
    roleCode: 'SUP',
    department: 'Controle Pátio STS-01',
  },
  'NX-1040-OP': {
    roleName: 'Estivador',
    roleCode: 'EST',
    department: 'Movimentação de Pátio',
  },
  'NX-2015-CF': {
    roleName: 'Conferente de Carga',
    roleCode: 'CONF',
    department: 'Recebimento & Gate',
  },
  'NX-3390-TC': {
    roleName: 'Técnico em Portos',
    roleCode: 'TEC',
    department: 'Documentação & Visitantes',
  },
  'NX-5501-IN': {
    roleName: 'Inspetor',
    roleCode: 'INSP',
    department: 'Vistoria Técnica & Manutenção',
  },
  'NX-9900-DIR': {
    roleName: 'Diretor de Operações e Logística',
    roleCode: 'DIR',
    department: 'Diretoria Executiva',
  },
};

export default function LoginPage() {
  const [operatorCode, setOperatorCode] = useState('NX-8821-SP');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  // Resolução do cargo com base no código digitado
  const resolvedRole = ROLE_DATABASE[operatorCode.trim().toUpperCase()];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorCode.trim()) {
      setErrorNotice('Por favor, informe um código individual válido.');
      return;
    }
    if (!resolvedRole) {
      setErrorNotice('Código individual não reconhecido no cadastro do porto.');
      return;
    }
    setErrorNotice(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#222222] flex flex-col justify-between items-center px-4 py-8">
      {/* Header / Branding */}
      <header className="flex flex-col items-center text-center max-w-lg mb-6">
        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
          <span className="font-bold text-[#1E293B] text-xl">NP</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E1E5ED]/50 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse"></span>
          <span className="font-mono text-[11px] font-semibold text-[#545F73] uppercase tracking-wider">
            Gateway STS-01 • v4.8.2-PROD
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">NexusPort</h1>
        <p className="text-sm text-[#545F73] mt-1">
          Sistema Integrado de Automação e Controle Portuário
        </p>
      </header>

      {/* Main Authentication Bento Card */}
      <main className="w-full max-w-[460px]">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden p-6 sm:p-8 border border-[#E1E5ED]">
          <div className="flex items-start justify-between pb-4 mb-4 border-b border-[#E1E5ED]">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#445987] uppercase tracking-wider mb-1">
                Controle de Acesso Físico-Lógico
              </span>
              <h2 className="text-xl font-bold text-[#1E293B]">Autenticação do Operador</h2>
              <p className="text-sm text-[#545F73] mt-0.5">
                Insira sua credencial nominal para acesso operacional.
              </p>
            </div>
          </div>

          {errorNotice && (
            <div className="mb-4 p-3 rounded bg-[#C62828]/10 text-[#C62828] text-xs font-medium">
              {errorNotice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Campo 1: Código Individual Único */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="operatorCode"
                  className="text-xs font-bold text-[#1E293B] flex items-center gap-1"
                >
                  <span>Código Individual Único (Matrícula)</span>
                  <span className="text-[#C62828]">*</span>
                </label>
                <span className="font-mono text-[10px] text-[#545F73] bg-[#F5F7FA] px-1.5 py-0.5 rounded border border-[#E1E5ED]">
                  SHA-256
                </span>
              </div>

              <div className="relative flex items-center">
                <input
                  id="operatorCode"
                  type="text"
                  maxLength={12}
                  value={operatorCode}
                  onChange={(e) => setOperatorCode(e.target.value.toUpperCase())}
                  placeholder="Ex: NX-8821-SP"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full h-12 px-4 rounded bg-[#F5F7FA] text-[#1E293B] font-mono text-base tracking-wider placeholder:text-[#757780] border border-[#E1E5ED] focus:outline-none focus:border-[#445987] transition-all"
                />
              </div>

              <p className="text-[11px] text-[#545F73] mt-0.5 leading-snug">
                Código individual intransferível vinculado à matrícula do funcionário.
              </p>
            </div>

            {/* Campo 2: Carregamento Automático e Exibição Travada do Cargo */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1E293B]">
                  Cargo Identificado pelo Sistema
                </label>
                <span className="px-1.5 py-0.5 rounded bg-[#E1E5ED] text-[#545F73] font-mono text-[10px] font-bold uppercase tracking-wider">
                  Trava Ativa
                </span>
              </div>

              <div className="w-full rounded bg-[#F5F7FA] p-3 flex flex-col gap-1.5 border border-[#E1E5ED]">
                {resolvedRole ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-[#445987] text-white flex items-center justify-center flex-shrink-0 font-mono text-[11px] font-bold">
                        {resolvedRole.roleCode}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-[#1E293B] truncate">
                          {resolvedRole.roleName}
                        </span>
                        <span className="text-[11px] text-[#545F73] font-medium truncate">
                          Lotação: {resolvedRole.department}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] text-[10px] font-bold whitespace-nowrap">
                      Confirmado
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[#545F73] text-xs py-1">
                    <span>
                      {operatorCode.trim()
                        ? 'Consultando cadastro de funcionários...'
                        : 'Aguardando inserção do código...'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-[#545F73] pt-1 border-t border-[#E1E5ED]/60 mt-1">
                  <span className="text-[11px] leading-tight">
                    Cargo resolvido automaticamente pelo código. Autosseleção desativada.
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={!resolvedRole}
              className={`w-full h-12 rounded text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-md mt-2 ${
                resolvedRole
                  ? 'bg-[#445987] hover:bg-[#1E293B]'
                  : 'bg-[#545F73]/50 cursor-not-allowed'
              }`}
            >
              <span>Acessar Sistema Portuário</span>
            </button>

            {/* Contingência de Perda/Esquecimento (T2.8 / RN 15) */}
            <div className="pt-2 text-center">
              <div className="bg-[#F5F7FA] rounded p-2.5 flex items-center justify-between gap-2 text-left border border-[#E1E5ED]">
                <span className="text-[11px] text-[#545F73] leading-tight truncate">
                  Perdeu ou esqueceu o código?
                </span>
                <button
                  type="button"
                  onClick={() => setIsRecoveryModalOpen(true)}
                  className="text-[11px] font-bold text-[#445987] hover:text-[#1E293B] underline flex-shrink-0"
                >
                  Solicitar Reemissão
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Modal de Reemissão pelo Técnico em Portos (T2.8 / RN 15) */}
      {isRecoveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E293B]/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 flex flex-col gap-4 border border-[#E1E5ED]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1E293B]">Protocolo de Contingência</h3>
                <p className="text-xs text-[#545F73]">Reemissão de Credencial Operacional</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecoveryModalOpen(false)}
                className="text-[#545F73] hover:text-[#1E293B] text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#F5F7FA] p-3 rounded flex flex-col gap-2 border border-[#E1E5ED]">
              <span className="text-xs font-bold text-[#1E293B]">Procedimento Obrigatório (RN 15):</span>
              <p className="text-xs text-[#545F73] leading-relaxed">
                Em caso de perda ou esquecimento, o código anterior deve ser invalidado e um novo código gerado e vinculado à mesma matrícula exclusivamente pelo <strong className="text-[#1E293B]">Técnico em Portos credenciado</strong> na Guarita Central STS-01.
              </p>
            </div>

            <div className="flex flex-col gap-1 font-mono text-xs text-[#545F73]">
              <div className="flex justify-between py-1 bg-[#F5F7FA] px-2 rounded">
                <span>Canal Rádio VHF:</span>
                <span className="font-bold text-[#1E293B]">CH-16 Operacional</span>
              </div>
              <div className="flex justify-between py-1 bg-[#F5F7FA] px-2 rounded">
                <span>Ramal Guarita Central:</span>
                <span className="font-bold text-[#1E293B]">#4412 / Ramal 88</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRecoveryModalOpen(false)}
              className="w-full h-10 rounded bg-[#E1E5ED] hover:bg-[#545F73]/20 text-[#1E293B] font-semibold text-xs mt-2 transition-colors"
            >
              Entendido, retornar à tela de acesso
            </button>
          </div>
        </div>
      )}

      {/* Institutional Footer */}
      <footer className="w-full max-w-2xl mt-8 flex flex-col items-center text-center gap-2">
        <p className="text-xs text-[#545F73] leading-relaxed">
          Acesso restrito e monitorado a colaboradores autorizados no terminal.
        </p>
        <span className="font-mono text-[10px] text-[#757780]">
          Autoridade Portuária Santos • Estação STS-01 • © 2026 NexusPort
        </span>
      </footer>
    </div>
  );
}

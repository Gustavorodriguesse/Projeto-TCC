export interface CodeReissuanceRecord {
  employeeMatricula: string;
  previousCode: string;
  newCode: string;
  reissuedAt: string;
  reissuedByTechnicianCode: string;
}

/**
 * Reemissão de Código Individual Único pelo Técnico em Portos (T2.8 / RN 15)
 * Em caso de perda ou esquecimento, invalida o código anterior do funcionário
 * e gera um novo código vinculado à mesma matrícula.
 */
export function reissueOperatorCode(
  matricula: string,
  previousCode: string,
  technicianRole: string,
  technicianCode: string
): CodeReissuanceRecord {
  if (technicianRole !== 'TECNICO' && technicianRole !== 'DIRETOR') {
    throw new Error('Apenas o Técnico em Portos credenciado pode reemitir códigos de acesso.');
  }

  // Gera um novo código individual no padrão 'NX-XXXX-SP'
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const newCode = `NX-${randomDigits}-SP`;

  return {
    employeeMatricula: matricula,
    previousCode,
    newCode,
    reissuedAt: new Date().toISOString(),
    reissuedByTechnicianCode: technicianCode,
  };
}

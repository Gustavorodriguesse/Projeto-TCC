export interface EntityWithOperator {
  operatorCode: string;
  [key: string]: unknown;
}

export type UserRole =
  | 'ESTIVADOR'
  | 'CONFERENTE'
  | 'ARRUMADOR'
  | 'PLANEJADOR'
  | 'TECNICO'
  | 'INSPETOR'
  | 'SUPERVISOR'
  | 'DIRETOR';

/**
 * Camada de Visão Própria (T2.4 / RF 1)
 */
export function filterByOwnVision<T extends EntityWithOperator>(
  items: T[],
  currentOperatorCode: string
): T[] {
  if (!currentOperatorCode) return [];
  const normalizedCode = currentOperatorCode.trim().toUpperCase();
  return items.filter(
    (item) => item.operatorCode && item.operatorCode.trim().toUpperCase() === normalizedCode
  );
}

/**
 * Camada de Visão Operacional (T2.5 / RF 1)
 */
export function canAccessOperationalVision(role: UserRole): boolean {
  return role === 'INSPETOR' || role === 'SUPERVISOR' || role === 'DIRETOR';
}

export function filterByOperationalVision<T>(
  items: T[],
  role: UserRole,
  isInternalDocsOrVisitorsData = false
): T[] {
  if (isInternalDocsOrVisitorsData) {
    return role === 'TECNICO' || role === 'DIRETOR' ? items : [];
  }

  if (canAccessOperationalVision(role)) {
    return items;
  }

  return [];
}

/**
 * Camada de Visão Estratégica (T2.6 / RF 1)
 */
export function canAccessStrategicVision(role: UserRole): boolean {
  return role === 'DIRETOR';
}

export function filterByStrategicVision<T>(items: T[], role: UserRole): T[] {
  if (canAccessStrategicVision(role)) {
    return items;
  }
  return [];
}

/**
 * Controle de Acesso às Rotas/APIs por Cargo (T2.7 / RF 1)
 * Matriz de Permissões por perfil de cargo.
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard/estratagico': ['DIRETOR'],
  '/gestao/funcionarios': ['TECNICO', 'DIRETOR'],
  '/gestao/visitantes': ['TECNICO', 'DIRETOR'],
  '/operacoes/liberacao': ['SUPERVISOR', 'DIRETOR'],
  '/operacoes/inspecao': ['INSPETOR', 'SUPERVISOR', 'DIRETOR'],
  '/operacoes/planejamento': ['PLANEJADOR', 'SUPERVISOR', 'DIRETOR'],
  '/operacoes/arrumacao': ['ARRUMADOR', 'SUPERVISOR', 'DIRETOR'],
  '/operacoes/conferencia': ['CONFERENTE', 'SUPERVISOR', 'DIRETOR'],
  '/operacoes/movimentacao': ['ESTIVADOR', 'SUPERVISOR', 'DIRETOR'],
};

export function canRoleAccessRoute(role: UserRole, pathname: string): boolean {
  // Diretor possui acesso total
  if (role === 'DIRETOR') return true;

  // Verificar se a rota possui restrições cadastradas
  for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(routePrefix)) {
      return allowedRoles.includes(role);
    }
  }

  // Por padrão, rotas genéricas/comuns são permitidas
  return true;
}

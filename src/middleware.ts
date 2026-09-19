import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canRoleAccessRoute, UserRole } from '@/lib/permissions';

// Mapeamento de códigos ativos para simulação de resolução de cargo no middleware
const OPERATOR_ROLE_MAP: Record<string, UserRole> = {
  'NX-8821-SP': 'SUPERVISOR',
  'NX-1040-OP': 'ESTIVADOR',
  'NX-2015-CF': 'CONFERENTE',
  'NX-3390-TC': 'TECNICO',
  'NX-5501-IN': 'INSPETOR',
  'NX-9900-DIR': 'DIRETOR',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso livre a ativos estáticos e rota de login
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Obter o cookie contendo o código individual ativo
  const activeCode = request.cookies.get('nexus_operator_code')?.value;

  // Redireciona para o login se o código não for encontrado ou for inválido
  if (!activeCode || !OPERATOR_ROLE_MAP[activeCode.toUpperCase()]) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = OPERATOR_ROLE_MAP[activeCode.toUpperCase()];

  // Verificar permissão de acesso à rota por cargo (T2.7)
  if (!canRoleAccessRoute(role, pathname)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

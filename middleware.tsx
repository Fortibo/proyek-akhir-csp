import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token');
  const path = request.nextUrl.pathname;

  const isProtectedPath =
    path.startsWith('/dashboard') ||
    path.startsWith('/tasks') ||
    path.startsWith('/requests') ||
    path.startsWith('/members') ||
    path.startsWith('/profile') ||
    path.startsWith('/settings');
  
  const isAuthPath =
    path.startsWith('/auth') ||
    path.startsWith('/login') || 
    path.startsWith('/register');
  
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl);
  }

  if(isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();

}

export const config = {
   matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
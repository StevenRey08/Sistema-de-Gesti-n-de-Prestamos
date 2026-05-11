import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/api']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (request.headers.get('rsc') === '1') return NextResponse.next()
  if (request.headers.get('next-router-prefetch') === '1') return NextResponse.next()

  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r))
  if (isPublic) return NextResponse.next()

  const token = request.cookies.get('sgp_token')?.value

  if (!token) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

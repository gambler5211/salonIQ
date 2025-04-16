import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Log the request URL for debugging (this uses the parameter)
  console.log('Middleware processing:', request.nextUrl.pathname);
  
  const response = NextResponse.next();
  
  // Add key performance headers
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

// Trigger this middleware only on specific routes
export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard',
  ],
}; 
/**
 * Next.js Middleware for Authentication
 * 
 * This middleware protects routes by checking if the user is authenticated.
 * Public routes are accessible without authentication, while protected routes
 * redirect to the login page if the user is not authenticated.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Route configuration
 */
const ROUTE_CONFIG = {
  // Routes that don't require authentication
  publicRoutes: [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/error",
  ],
  
  // Routes that should redirect to dashboard if user is already authenticated
  authOnlyRoutes: [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
  ],
  
  // Default redirect paths
  redirects: {
    // Where to redirect authenticated users trying to access auth pages
    authenticatedDefault: "/dashboard",
    
    // Where to redirect unauthenticated users trying to access protected pages
    unauthenticatedDefault: "/auth/login",
  },
  
  // Session validation settings
  session: {
    // Maximum session age in seconds (30 days)
    // This should match the session maxAge in the NextAuth config
    maxAge: 30 * 24 * 60 * 60,
  }
};

/**
 * Check if a route matches any in the provided list
 * @param pathname - Current path
 * @param routeList - List of routes to check against
 * @returns True if the path matches any route in the list
 */
function matchesRoute(pathname: string, routeList: string[]): boolean {
  return routeList.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Middleware function to protect routes
 * @param request - The incoming request
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if the user is authenticated and the token is valid
  const isAuthenticated = !!token;
  
  // Check if the current route is public or auth-only
  const isPublicRoute = matchesRoute(pathname, ROUTE_CONFIG.publicRoutes);
  const isAuthOnlyRoute = matchesRoute(pathname, ROUTE_CONFIG.authOnlyRoutes);

  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Set security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthOnlyRoute) {
    // Get the callback URL if provided, otherwise use the default
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    const redirectUrl = callbackUrl ? decodeURIComponent(callbackUrl) : ROUTE_CONFIG.redirects.authenticatedDefault;
    
    // Validate the callback URL to prevent open redirect vulnerabilities
    const redirectUrlObj = new URL(redirectUrl, request.url);
    const isSameOrigin = redirectUrlObj.origin === new URL(request.url).origin;
    
    // Only redirect to same-origin URLs
    const safeRedirectUrl = isSameOrigin ? redirectUrl : ROUTE_CONFIG.redirects.authenticatedDefault;
    
    return NextResponse.redirect(new URL(safeRedirectUrl, request.url));
  }

  // Redirect unauthenticated users to login from protected routes
  if (!isAuthenticated && !isPublicRoute) {
    const url = new URL(ROUTE_CONFIG.redirects.unauthenticatedDefault, request.url);
    
    // Add the current URL as a callback parameter
    url.searchParams.set("callbackUrl", encodeURIComponent(request.url));
    
    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  // Match all routes except for API routes, static files, and Next.js internals
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
"use client";

import React from "react";
import { useAuth } from "./auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

/**
 * Protected route component props
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Protected route component
 * 
 * This component protects routes from unauthenticated access by checking
 * the authentication status and redirecting unauthenticated users to the login page.
 * 
 * @param children - The content to render if authenticated
 * @param redirectTo - The URL to redirect to if not authenticated (default: "/auth/login")
 * @param fallback - Custom loading component to show while checking authentication
 */
export function ProtectedRoute({ 
  children, 
  redirectTo = "/auth/login",
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not loading and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Render children if authenticated
  return <>{children}</>;
}

/**
 * Higher-order component version of ProtectedRoute
 * 
 * @param Component - The component to protect
 * @param redirectTo - The URL to redirect to if not authenticated
 * @returns Protected component
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo?: string
) {
  const ProtectedComponent = (props: P) => {
    return (
      <ProtectedRoute redirectTo={redirectTo}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  ProtectedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;
  
  return ProtectedComponent;
}
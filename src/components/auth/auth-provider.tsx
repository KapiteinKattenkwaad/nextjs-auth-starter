"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Session } from "next-auth";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Authentication context type definition
 */
interface AuthContextType {
  // Session state
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  user: Session["user"] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Authentication methods
  login: (credentials: { email: string; password: string }, redirectTo?: string) => Promise<boolean>;
  logout: (redirectTo?: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  
  // Session management
  refreshSession: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

/**
 * Registration data interface
 */
interface RegisterData {
  name: string;
  email: string;
  password: string;
}

/**
 * Create the authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication provider component
 * 
 * This component provides authentication state and methods to all child components.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status, update: updateSession } = useSession();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Derived state
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const user = session?.user || null;

  /**
   * Handle authentication errors
   */
  const handleAuthError = useCallback((error: unknown): string => {
    console.error("Authentication error:", error);
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return "An unexpected error occurred";
  }, []);

  /**
   * Sign in with email and password
   * @param credentials - User credentials
   * @param redirectTo - Optional URL to redirect to after successful login
   * @returns True if sign in was successful, false otherwise
   */
  const login = async (
    credentials: { email: string; password: string },
    redirectTo?: string
  ) => {
    try {
      clearError();
      
      const result = await signIn("credentials", {
        redirect: false,
        email: credentials.email,
        password: credentials.password,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return false;
      }

      // Refresh the session to get the latest user data
      await updateSession();
      
      // Redirect if specified
      if (redirectTo) {
        router.push(redirectTo);
      }
      
      return true;
    } catch (error) {
      setError(handleAuthError(error));
      return false;
    }
  };

  /**
   * Sign out the current user
   * @param redirectTo - Optional URL to redirect to after logout
   */
  const logout = async (redirectTo = "/auth/login") => {
    try {
      await signOut({ 
        redirect: false,
      });
      
      // Manual redirect to allow for custom logic
      router.push(redirectTo);
    } catch (error) {
      setError(handleAuthError(error));
    }
  };

  /**
   * Register a new user
   * @param userData - User registration data
   * @returns Object indicating success or failure with error message
   */
  const register = async (userData: RegisterData) => {
    try {
      clearError();
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Request a password reset
   * @param email - User email
   * @returns Object indicating success or failure with error message
   */
  const forgotPassword = async (email: string) => {
    try {
      clearError();
      
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to request password reset");
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Reset password with token
   * @param token - Password reset token
   * @param password - New password
   * @returns Object indicating success or failure with error message
   */
  const resetPassword = async (token: string, password: string) => {
    try {
      clearError();
      
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token, 
          password, 
          confirmPassword: password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || data.error || "Failed to reset password");
        return { success: false, error: data.error?.message || data.error };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = handleAuthError(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Refresh the user session
   */
  const refreshSession = async () => {
    try {
      await updateSession();
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }
  };

  /**
   * Clear any authentication errors
   */
  const clearError = () => {
    setError(null);
  };

  // Clear error when status changes
  useEffect(() => {
    if (status !== "loading") {
      clearError();
    }
  }, [status]);

  // Auto-refresh session when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      refreshSession();
    };

    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Set up session expiry check
  useEffect(() => {
    if (!session) return;
    
    // Check session expiry every minute
    const interval = setInterval(() => {
      refreshSession();
    }, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [session]);

  // Context value
  const value: AuthContextType = {
    session,
    status,
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    refreshSession,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use the authentication context
 * @returns Authentication context
 * @throws Error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}

/**
 * Hook to protect client components
 * Redirects to login if user is not authenticated
 * @param redirectTo - URL to redirect to if not authenticated
 */
export function useRequireAuth(redirectTo = "/auth/login") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);
  
  return { isAuthenticated, isLoading };
}

/**
 * Hook to prevent authenticated users from accessing certain pages
 * Redirects to dashboard if user is authenticated
 * @param redirectTo - URL to redirect to if authenticated
 */
export function useRedirectIfAuthenticated(redirectTo = "/dashboard") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);
  
  return { isAuthenticated, isLoading };
}
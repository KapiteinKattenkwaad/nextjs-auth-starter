"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useAuth, useRedirectIfAuthenticated } from "@/components/auth/auth-provider";
import { useLoginForm } from "@/hooks/use-form-validation";
import type { LoginFormData } from "@/lib/validation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const { login, error: authError, clearError } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Redirect if already authenticated
  useRedirectIfAuthenticated();
  
  // Get redirect URL from query params
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  
  // Check for success message from registration
  const message = searchParams.get("message");
  const showRegistrationSuccess = message === "registration-success";
  
  // Form validation
  const {
    register,
    handleSubmit,
    formState: { isValid },
    isSubmitting,
    getFieldError,
    isFieldInvalid,
  } = useLoginForm();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setSubmitError(null);
      clearError();
      
      const success = await login(data, redirectTo);
      
      if (success) {
        // Redirect is handled by the login function
        return;
      }
      
      // If login failed, the error will be set in the auth context
      // We don't need to set submitError here as authError will be displayed
    } catch (error) {
      console.error("Login error:", error);
      setSubmitError("An unexpected error occurred. Please try again.");
    }
  };

  // Display error from auth context or local submit error
  const displayError = authError || submitError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link
              href="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {showRegistrationSuccess && (
                <Alert variant="success" title="Registration Successful">
                  Your account has been created successfully. Please sign in with your credentials.
                </Alert>
              )}

              {displayError && (
                <Alert variant="error" title="Login Failed">
                  {displayError}
                </Alert>
              )}

              <div>
                <Input
                  {...register("email")}
                  type="email"
                  label="Email address"
                  placeholder="Enter your email"
                  error={getFieldError("email")}
                  variant={isFieldInvalid("email") ? "error" : "default"}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div>
                <Input
                  {...register("password")}
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  error={getFieldError("password")}
                  variant={isFieldInvalid("password") ? "error" : "default"}
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
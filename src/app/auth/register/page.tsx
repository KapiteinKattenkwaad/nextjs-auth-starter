"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useAuth, useRedirectIfAuthenticated } from "@/components/auth/auth-provider";
import { useRegisterForm } from "@/hooks/use-form-validation";
import type { RegisterFormData } from "@/lib/validation";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, error: authError, clearError } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Redirect if already authenticated
  useRedirectIfAuthenticated();
  
  // Form validation
  const {
    register,
    handleSubmit,
    formState: { isValid },
    isSubmitting,
    getFieldError,
    isFieldInvalid,
    watch,
  } = useRegisterForm();

  // Watch password field for confirmation validation
  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setSubmitError(null);
      setSuccessMessage(null);
      clearError();
      
      const result = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      
      if (result.success) {
        setSuccessMessage("Account created successfully! Redirecting to login...");
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push("/auth/login?message=registration-success");
        }, 2000);
        
        return;
      }
      
      // If registration failed, the error will be set in the auth context
      // We don't need to set submitError here as authError will be displayed
    } catch (error) {
      console.error("Registration error:", error);
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Create your account to access all features
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {successMessage && (
                <Alert variant="success" title="Success">
                  {successMessage}
                </Alert>
              )}

              {displayError && (
                <Alert variant="error" title="Registration Failed">
                  {displayError}
                </Alert>
              )}

              <div>
                <Input
                  {...register("name")}
                  type="text"
                  label="Full name"
                  placeholder="Enter your full name"
                  error={getFieldError("name")}
                  variant={isFieldInvalid("name") ? "error" : "default"}
                  autoComplete="name"
                  autoFocus
                />
              </div>

              <div>
                <Input
                  {...register("email")}
                  type="email"
                  label="Email address"
                  placeholder="Enter your email"
                  error={getFieldError("email")}
                  variant={isFieldInvalid("email") ? "error" : "default"}
                  autoComplete="email"
                />
              </div>

              <div>
                <Input
                  {...register("password")}
                  type="password"
                  label="Password"
                  placeholder="Create a strong password"
                  error={getFieldError("password")}
                  variant={isFieldInvalid("password") ? "error" : "default"}
                  autoComplete="new-password"
                />
                <div className="mt-1 text-xs text-gray-500">
                  Password must contain at least 8 characters with uppercase, lowercase, numbers, and special characters.
                </div>
              </div>

              <div>
                <Input
                  {...register("confirmPassword")}
                  type="password"
                  label="Confirm password"
                  placeholder="Confirm your password"
                  error={getFieldError("confirmPassword")}
                  variant={isFieldInvalid("confirmPassword") ? "error" : "default"}
                  autoComplete="new-password"
                />
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                disabled={isSubmitting || !isValid || !!successMessage}
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
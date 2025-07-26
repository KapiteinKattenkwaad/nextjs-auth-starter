"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useAuth, useRedirectIfAuthenticated } from "@/components/auth/auth-provider";
import { useForgotPasswordForm } from "@/hooks/use-form-validation";
import type { ForgotPasswordFormData } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const { forgotPassword, error: authError, clearError } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
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
  } = useForgotPasswordForm();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setSubmitError(null);
      clearError();
      
      const result = await forgotPassword(data.email);
      
      if (result.success) {
        setIsSuccess(true);
      } else {
        setSubmitError(result.error || "Failed to send password reset email");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setSubmitError("An unexpected error occurred. Please try again.");
    }
  };

  // Display error from auth context or local submit error
  const displayError = authError || submitError;

  // Show success message if email was sent
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent password reset instructions to your email address
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Alert variant="success" title="Email sent successfully">
                If your email is registered with us, you will receive a password reset link shortly. 
                Please check your inbox and follow the instructions to reset your password.
              </Alert>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Link
                href="/auth/login"
                className="w-full"
              >
                <Button variant="outline" className="w-full">
                  Back to login
                </Button>
              </Link>
              
              <div className="text-center">
                <button
                  onClick={() => setIsSuccess(false)}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Try a different email address
                </button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>
              We'll send you an email with instructions to reset your password
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {displayError && (
                <Alert variant="error" title="Error">
                  {displayError}
                </Alert>
              )}

              <div>
                <Input
                  {...register("email")}
                  type="email"
                  label="Email address"
                  placeholder="Enter your email address"
                  error={getFieldError("email")}
                  variant={isFieldInvalid("email") ? "error" : "default"}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? "Sending..." : "Send reset link"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
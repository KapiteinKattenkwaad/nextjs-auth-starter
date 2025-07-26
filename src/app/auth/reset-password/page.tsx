"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useAuth, useRedirectIfAuthenticated } from "@/components/auth/auth-provider";
import { useResetPasswordForm } from "@/hooks/use-form-validation";
import type { ResetPasswordFormData } from "@/lib/validation";

export default function ResetPasswordPage() {
  const { resetPassword, error: authError, clearError } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
  } = useResetPasswordForm();

  // Extract token from URL parameters
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    
    if (!tokenParam) {
      setTokenError("Invalid or missing password reset token");
      return;
    }
    
    setToken(tokenParam);
    setTokenError(null);
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setSubmitError("Invalid password reset token");
      return;
    }

    try {
      setSubmitError(null);
      clearError();
      
      const result = await resetPassword(token, data.password);
      
      if (result.success) {
        setIsSuccess(true);
      } else {
        setSubmitError(result.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setSubmitError("An unexpected error occurred. Please try again.");
    }
  };

  // Display error from auth context, local submit error, or token error
  const displayError = authError || submitError || tokenError;

  // Show success message if password was reset
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Password reset successful
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been successfully updated
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Alert variant="success" title="Password updated">
                Your password has been successfully reset. You can now sign in with your new password.
              </Alert>
            </CardContent>

            <CardFooter>
              <Button 
                onClick={() => router.push("/auth/login")}
                className="w-full"
              >
                Continue to login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state if token is invalid
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Invalid reset link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This password reset link is invalid or has expired
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Alert variant="error" title="Invalid or expired link">
                The password reset link you clicked is invalid or has expired. 
                Please request a new password reset link.
              </Alert>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Link href="/auth/forgot-password" className="w-full">
                <Button className="w-full">
                  Request new reset link
                </Button>
              </Link>
              
              <Link href="/auth/login" className="w-full">
                <Button variant="outline" className="w-full">
                  Back to login
                </Button>
              </Link>
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
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set new password</CardTitle>
            <CardDescription>
              Choose a strong password for your account
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
                  {...register("password")}
                  type="password"
                  label="New password"
                  placeholder="Enter your new password"
                  error={getFieldError("password")}
                  variant={isFieldInvalid("password") ? "error" : "default"}
                  autoComplete="new-password"
                  autoFocus
                />
              </div>

              <div>
                <Input
                  {...register("confirmPassword")}
                  type="password"
                  label="Confirm new password"
                  placeholder="Confirm your new password"
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
                disabled={isSubmitting || !isValid || !token}
              >
                {isSubmitting ? "Resetting password..." : "Reset password"}
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
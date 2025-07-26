import React from 'react';
import Link from 'next/link';
import { Container } from './container';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackToHome?: boolean;
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle,
  showBackToHome = true 
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <Container size="sm" padding="md">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo/Brand */}
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h2 className="text-2xl font-bold text-gray-900">
                Auth Starter
              </h2>
            </Link>
          </div>

          {/* Title and subtitle */}
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10 border border-gray-200">
            {children}
          </div>

          {/* Back to home link */}
          {showBackToHome && (
            <div className="mt-6 text-center">
              <Link 
                href="/" 
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
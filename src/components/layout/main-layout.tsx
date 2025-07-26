'use client';

import React from 'react';
import { Navigation } from './navigation';
import { Footer } from './footer';

interface MainLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
}

export function MainLayout({ 
  children, 
  showNavigation = true, 
  showFooter = true 
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showNavigation && <Navigation />}
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
}
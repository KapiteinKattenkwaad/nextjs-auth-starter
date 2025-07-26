import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children?: React.ReactNode;
  centered?: boolean;
}

export function PageHeader({ 
  title, 
  description, 
  children, 
  className, 
  centered = false,
  ...props 
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'space-y-4',
        centered && 'text-center',
        className
      )}
      {...props}
    >
      <div className="space-y-2">
        <h1 className={cn(
          'text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl',
          centered && 'mx-auto'
        )}>
          {title}
        </h1>
        {description && (
          <p className={cn(
            'text-lg text-gray-600 max-w-3xl',
            centered && 'mx-auto'
          )}>
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className={cn(
          'flex flex-col sm:flex-row gap-4',
          centered && 'justify-center'
        )}>
          {children}
        </div>
      )}
    </div>
  );
}
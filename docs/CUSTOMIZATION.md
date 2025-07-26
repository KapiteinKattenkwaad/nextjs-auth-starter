# Customization Guide

This guide provides detailed instructions for customizing the Next.js Authentication Starter to fit your specific needs.

## Table of Contents

- [Theme Customization](#theme-customization)
- [Adding OAuth Providers](#adding-oauth-providers)
- [Database Switching](#database-switching)
- [Email Provider Configuration](#email-provider-configuration)
- [Custom Components](#custom-components)
- [Environment Configuration](#environment-configuration)

## Theme Customization

The starter uses Tailwind CSS for styling, making it easy to customize the appearance of your application.

### Customizing Colors

Edit `tailwind.config.js` to modify the color palette:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Main primary color
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Secondary colors
        secondary: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Success colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Error colors
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
    },
  },
}
```

### Customizing Typography

Add custom fonts and typography scales:

```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
    },
  },
}
```

### Customizing Components

Override component styles by modifying the component files in `src/components/ui/`:

#### Button Customization

```typescript
// src/components/ui/button.tsx
const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus-visible:ring-secondary-500',
  outline: 'border border-secondary-300 bg-transparent text-secondary-700 hover:bg-secondary-50 focus-visible:ring-secondary-500',
  ghost: 'text-secondary-700 hover:bg-secondary-100 focus-visible:ring-secondary-500',
  destructive: 'bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-500'
};
```

#### Input Customization

```typescript
// src/components/ui/input.tsx
const variants = {
  default: 'border-secondary-300 bg-white focus-visible:ring-primary-500 focus-visible:border-primary-500',
  error: 'border-error-500 bg-white focus-visible:ring-error-500 focus-visible:border-error-500',
  success: 'border-success-500 bg-white focus-visible:ring-success-500 focus-visible:border-success-500'
};
```

### Dark Mode Support

Add dark mode support by extending the Tailwind configuration:

```javascript
module.exports = {
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        // Add dark mode variants
        background: {
          light: '#ffffff',
          dark: '#0f172a',
        },
        foreground: {
          light: '#0f172a',
          dark: '#f8fafc',
        },
      },
    },
  },
}
```

Then create a dark mode toggle component:

```typescript
// src/components/ui/theme-toggle.tsx
'use client';

import { useTheme } from 'next-themes';
import { Button } from './button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </Button>
  );
}
```

## Adding OAuth Providers

The starter supports adding OAuth providers like Google, GitHub, and others using NextAuth.js.

### Google OAuth

1. **Set up Google OAuth credentials:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Create OAuth 2.0 credentials
   - Add your domain to authorized origins

2. **Install the Google provider:**
   ```bash
   npm install @auth/google-provider
   ```

3. **Add environment variables:**
   ```bash
   # .env.local
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Update the auth configuration:**
   ```typescript
   // src/lib/auth.ts
   import GoogleProvider from '@auth/google-provider';

   export const authOptions: NextAuthOptions = {
     providers: [
       GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID!,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
       }),
       // ... existing providers
     ],
     // ... rest of configuration
   };
   ```

5. **Update the login page:**
   ```typescript
   // src/app/auth/login/page.tsx
   import { signIn } from 'next-auth/react';

   export default function LoginPage() {
     return (
       <div>
         {/* Existing login form */}
         
         <div className="mt-6">
           <div className="relative">
             <div className="absolute inset-0 flex items-center">
               <div className="w-full border-t border-gray-300" />
             </div>
             <div className="relative flex justify-center text-sm">
               <span className="px-2 bg-white text-gray-500">Or continue with</span>
             </div>
           </div>

           <div className="mt-6">
             <Button
               variant="outline"
               className="w-full"
               onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
             >
               <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                 {/* Google icon SVG */}
               </svg>
               Continue with Google
             </Button>
           </div>
         </div>
       </div>
     );
   }
   ```

### GitHub OAuth

1. **Set up GitHub OAuth app:**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL to `http://localhost:3000/api/auth/callback/github`

2. **Install the GitHub provider:**
   ```bash
   npm install @auth/github-provider
   ```

3. **Add environment variables:**
   ```bash
   # .env.local
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

4. **Update the auth configuration:**
   ```typescript
   // src/lib/auth.ts
   import GitHubProvider from '@auth/github-provider';

   export const authOptions: NextAuthOptions = {
     providers: [
       GitHubProvider({
         clientId: process.env.GITHUB_CLIENT_ID!,
         clientSecret: process.env.GITHUB_CLIENT_SECRET!,
       }),
       // ... existing providers
     ],
   };
   ```

### Custom OAuth Provider

For other OAuth providers, follow this pattern:

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "custom-provider",
      name: "Custom Provider",
      type: "oauth",
      authorization: "https://provider.com/oauth/authorize",
      token: "https://provider.com/oauth/token",
      userinfo: "https://provider.com/oauth/userinfo",
      clientId: process.env.CUSTOM_CLIENT_ID,
      clientSecret: process.env.CUSTOM_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
};
```

## Database Switching

The starter uses SQLite by default but can be easily switched to other databases.

### PostgreSQL

1. **Install PostgreSQL adapter:**
   ```bash
   npm install pg @types/pg
   ```

2. **Update Prisma schema:**
   ```prisma
   // prisma/schema.prisma
   generator client {
     provider = "prisma-client-js"
     output   = "../src/generated/prisma"
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   model User {
     id            String    @id @default(cuid())
     name          String?
     email         String    @unique
     password      String
     emailVerified DateTime?
     image         String?
     createdAt     DateTime  @default(now())
     updatedAt     DateTime  @updatedAt

     @@map("users")
   }

   model VerificationToken {
     identifier String
     token      String   @unique
     expires    DateTime

     @@unique([identifier, token])
     @@map("verification_tokens")
   }
   ```

3. **Update environment variables:**
   ```bash
   # .env.local
   DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"
   ```

4. **Run migrations:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

### MySQL

1. **Install MySQL adapter:**
   ```bash
   npm install mysql2
   ```

2. **Update Prisma schema:**
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Update environment variables:**
   ```bash
   # .env.local
   DATABASE_URL="mysql://username:password@localhost:3306/mydb"
   ```

### MongoDB

1. **Install MongoDB adapter:**
   ```bash
   npm install @prisma/adapter-mongodb
   ```

2. **Update Prisma schema:**
   ```prisma
   // prisma/schema.prisma
   generator client {
     provider = "prisma-client-js"
     output   = "../src/generated/prisma"
   }

   datasource db {
     provider = "mongodb"
     url      = env("DATABASE_URL")
   }

   model User {
     id            String    @id @default(auto()) @map("_id") @db.ObjectId
     name          String?
     email         String    @unique
     password      String
     emailVerified DateTime?
     image         String?
     createdAt     DateTime  @default(now())
     updatedAt     DateTime  @updatedAt

     @@map("users")
   }
   ```

3. **Update environment variables:**
   ```bash
   # .env.local
   DATABASE_URL="mongodb://username:password@localhost:27017/mydb"
   ```

## Email Provider Configuration

### SendGrid

1. **Install SendGrid:**
   ```bash
   npm install @sendgrid/mail
   ```

2. **Create email service:**
   ```typescript
   // src/lib/email.ts
   import sgMail from '@sendgrid/mail';

   sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

   export async function sendPasswordResetEmail(email: string, resetUrl: string) {
     const msg = {
       to: email,
       from: process.env.EMAIL_FROM!,
       subject: 'Reset your password',
       html: `
         <div>
           <h1>Reset your password</h1>
           <p>Click the link below to reset your password:</p>
           <a href="${resetUrl}">Reset Password</a>
         </div>
       `,
     };

     await sgMail.send(msg);
   }
   ```

3. **Update environment variables:**
   ```bash
   # .env.local
   SENDGRID_API_KEY=your-sendgrid-api-key
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Mailgun

1. **Install Mailgun:**
   ```bash
   npm install mailgun.js
   ```

2. **Create email service:**
   ```typescript
   // src/lib/email.ts
   import Mailgun from 'mailgun.js';
   import formData from 'form-data';

   const mailgun = new Mailgun(formData);
   const mg = mailgun.client({
     username: 'api',
     key: process.env.MAILGUN_API_KEY!,
   });

   export async function sendPasswordResetEmail(email: string, resetUrl: string) {
     await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
       from: process.env.EMAIL_FROM!,
       to: email,
       subject: 'Reset your password',
       html: `
         <div>
           <h1>Reset your password</h1>
           <p>Click the link below to reset your password:</p>
           <a href="${resetUrl}">Reset Password</a>
         </div>
       `,
     });
   }
   ```

## Custom Components

### Creating Custom Form Components

```typescript
// src/components/forms/custom-login-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

export function CustomLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <Button type="submit" isLoading={isLoading} className="w-full">
        Sign In
      </Button>
    </form>
  );
}
```

### Creating Custom Layout Components

```typescript
// src/components/layout/custom-layout.tsx
import { ReactNode } from 'react';
import { Navigation } from './navigation';
import { Footer } from './footer';

interface CustomLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
}

export function CustomLayout({ 
  children, 
  showNavigation = true, 
  showFooter = true 
}: CustomLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showNavigation && <Navigation />}
      
      <main className="flex-1">
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
}
```

## Environment Configuration

### Development Environment

```bash
# .env.local
NODE_ENV=development
NEXTAUTH_SECRET=your-development-secret
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"

# Email (use Ethereal for testing)
EMAIL_SERVER_HOST=smtp.ethereal.email
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-ethereal-user
EMAIL_SERVER_PASSWORD=your-ethereal-password
EMAIL_FROM=noreply@example.com

# Security
SESSION_EXPIRY=2592000
RESET_TOKEN_EXPIRY=86400
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL="postgresql://user:password@host:5432/database"

# Email (use production service)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# Security
SESSION_EXPIRY=2592000
RESET_TOKEN_EXPIRY=86400
```

### Testing Environment

```bash
# .env.test
NODE_ENV=test
NEXTAUTH_SECRET=test-secret
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL="file:./test.db"

# Disable email in tests
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=test@example.com
```

## Advanced Customizations

### Custom Middleware

```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Custom logic before authentication check
  const userAgent = request.headers.get('user-agent') || '';
  
  // Block specific user agents
  if (userAgent.includes('BadBot')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Continue with authentication logic
  const token = await getToken({ req: request });
  
  // Custom role-based access control
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token || token.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}
```

### Custom Error Pages

```typescript
// src/app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
```

This customization guide provides comprehensive examples for modifying the starter to fit your specific needs. Each section includes practical code examples and step-by-step instructions.
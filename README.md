# Next.js Authentication Starter

A complete, production-ready authentication solution for your Next.js projects. This starter template provides a secure, customizable authentication system with user registration, login, password reset functionality, and a personalized dashboard.

## ✨ Features

- **Complete Authentication System**: Registration, login, logout, and password reset
- **Secure by Default**: Password hashing, CSRF protection, secure sessions
- **Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Prisma ORM
- **Responsive Design**: Mobile-first design that works on all devices
- **Form Validation**: Client and server-side validation with Zod
- **Email Integration**: Password reset emails with customizable templates
- **Protected Routes**: Middleware-based route protection
- **Testing Suite**: Comprehensive test coverage with Vitest and React Testing Library
- **Developer Experience**: ESLint, Prettier, Husky pre-commit hooks
- **Easy Customization**: Modular components and clear documentation

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17.0 or later
- npm, yarn, or pnpm

### Installation

1. **Clone or fork this repository**
   ```bash
   git clone https://github.com/your-username/nextjs-auth-starter.git
   cd nextjs-auth-starter
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and configure the required variables (see [Environment Variables](#environment-variables) section).

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see your application.

## 🔧 Node.js Version Management

This project requires Node.js version 18.17.0 or later. We recommend using [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) to manage your Node.js versions.

### Using NVM

If you have nvm installed, you can automatically use the correct Node.js version:

```bash
nvm use
```

### Installing the Required Node.js Version

If you don't have the required Node.js version installed:

```bash
nvm install
```

## 🌍 Environment Variables

This project uses environment variables for configuration. Copy `.env.example` to `.env.local` and configure the following variables:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Secret key for JWT encryption | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of your application | `http://localhost:3000` |
| `DATABASE_URL` | Database connection string | `file:./dev.db` (SQLite) |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_SERVER_HOST` | SMTP server host | `smtp.ethereal.email` |
| `EMAIL_SERVER_PORT` | SMTP server port | `587` |
| `EMAIL_SERVER_USER` | SMTP username | - |
| `EMAIL_SERVER_PASSWORD` | SMTP password | - |
| `EMAIL_FROM` | From email address | `noreply@example.com` |
| `SESSION_EXPIRY` | Session expiration (seconds) | `2592000` (30 days) |
| `RESET_TOKEN_EXPIRY` | Reset token expiration (seconds) | `86400` (24 hours) |

### Email Configuration

For development, you can use [Ethereal Email](https://ethereal.email/) for testing email functionality:

1. Visit [Ethereal Email](https://ethereal.email/)
2. Click "Create Ethereal Account"
3. Use the provided SMTP credentials in your `.env.local`

For production, consider using services like:
- [SendGrid](https://sendgrid.com/)
- [Mailgun](https://www.mailgun.com/)
- [Amazon SES](https://aws.amazon.com/ses/)

## 📁 Project Structure

```
nextjs-auth-starter/
├── .nvmrc                    # Node version specification
├── .env.example              # Environment variable template
├── prisma/                   # Database schema and migrations
│   ├── schema.prisma         # Prisma schema
│   └── seed.ts               # Database seed file
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/auth/         # Authentication API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Protected dashboard
│   │   └── layout.tsx        # Root layout
│   ├── components/           # Reusable components
│   │   ├── auth/             # Authentication components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # UI components
│   ├── lib/                  # Utility functions
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── db.ts             # Database client
│   │   └── validation.ts     # Form validation
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript definitions
│   └── middleware.ts         # Route protection middleware
└── README.md                 # This file
```

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run db:seed` | Seed database with sample data |

## 🔐 Authentication Features

### User Registration
- Email and password registration
- Password strength validation
- Email uniqueness checking
- Secure password hashing with bcrypt

### User Login
- Email and password authentication
- Session management with NextAuth.js
- Automatic redirect to dashboard
- Remember me functionality

### Password Reset
- Forgot password functionality
- Secure token generation
- Email-based reset links
- Token expiration handling

### Protected Routes
- Middleware-based route protection
- Automatic redirect to login
- Session validation
- Role-based access (extensible)

## 🎨 Customization Guide

### Styling and Theming

This project uses Tailwind CSS for styling. You can customize the theme by editing `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
}
```

### Adding Custom Components

1. Create your component in the appropriate directory under `src/components/`
2. Export it from the relevant index file
3. Import and use it in your pages or other components

### Extending Authentication

To add OAuth providers (Google, GitHub, etc.):

1. Install the required provider package
2. Configure the provider in `src/lib/auth.ts`
3. Add environment variables for the provider
4. Update the login page to include the new provider

Example for Google OAuth:

```bash
npm install @auth/google-provider
```

```typescript
// src/lib/auth.ts
import GoogleProvider from '@auth/google-provider'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // ... existing providers
  ],
}
```

### Database Customization

#### Switching to PostgreSQL

1. Update your `DATABASE_URL` in `.env.local`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/mydb"
   ```

2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

#### Adding New Models

1. Update `prisma/schema.prisma` with your new model
2. Generate Prisma client: `npx prisma generate`
3. Create and run migration: `npx prisma migrate dev`

### Form Validation

Forms use Zod for validation. To customize validation rules, edit the schemas in `src/lib/validation.ts`:

```typescript
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
})
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on every push

### Netlify

1. Build the project: `npm run build`
2. Deploy the `out` folder to Netlify
3. Configure environment variables in Netlify dashboard

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t nextjs-auth-starter .
docker run -p 3000:3000 nextjs-auth-starter
```

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

- `NEXTAUTH_SECRET`: Use a strong, unique secret
- `NEXTAUTH_URL`: Your production domain
- `DATABASE_URL`: Your production database connection
- Email configuration variables for password reset functionality

## 🧪 Testing

This project includes comprehensive test coverage:

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Test Structure

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API route tests
- **E2E Tests**: Full authentication flow tests

### Writing Tests

Tests are located alongside their corresponding files with `.test.ts` or `.test.tsx` extensions. Example:

```typescript
// src/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
})
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/nextjs-auth-starter/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide as much detail as possible, including:
   - Node.js version
   - npm/yarn/pnpm version
   - Error messages
   - Steps to reproduce

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Zod](https://zod.dev/) - TypeScript-first schema validation
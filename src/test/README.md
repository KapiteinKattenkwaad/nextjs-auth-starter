# Testing Setup

This directory contains the testing configuration and utilities for the Next.js Auth Starter project.

## Testing Stack

- **Vitest**: Fast unit test runner with native TypeScript support
- **React Testing Library**: Testing utilities for React components
- **Jest DOM**: Custom Jest matchers for DOM testing
- **User Event**: Utilities for simulating user interactions

## Files

### `setup.ts`
Global test setup file that:
- Configures Jest DOM matchers
- Mocks Next.js router and navigation
- Mocks NextAuth session provider
- Sets up test environment variables

### `utils.tsx`
Testing utilities including:
- Custom render function with providers
- Mock session data
- Helper functions for API mocking
- Utilities for resetting mocks

### `db.ts`
Database testing utilities:
- Test database client configuration
- Database cleanup functions
- Helper functions for creating test data
- Setup/teardown hooks for database tests

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

### Component Tests
```typescript
import { render, screen } from '@/test/utils';
import MyComponent from './MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### API Route Tests
```typescript
import { testDb, setupTestDatabase } from '@/test/db';

describe('API Route', () => {
  setupTestDatabase();
  
  test('handles request', async () => {
    // Test implementation
  });
});
```

### Utility Function Tests
```typescript
import { myUtility } from '@/lib/utils';

test('utility function works', () => {
  expect(myUtility('input')).toBe('expected');
});
```

## Mocking

The test setup includes mocks for:
- Next.js router and navigation
- NextAuth session provider
- Environment variables
- Fetch API (via helper functions)

## Database Testing

Tests use a separate SQLite database (`test.db`) to avoid affecting development data. The database is automatically cleaned between tests.
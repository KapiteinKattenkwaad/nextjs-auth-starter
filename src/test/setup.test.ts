import { describe, it, expect } from 'vitest';

describe('Test Environment Setup', () => {
  it('should have access to vitest globals', () => {
    expect(true).toBe(true);
  });

  it('should have access to environment variables', () => {
    expect(process.env.NEXTAUTH_SECRET).toBe('test-secret');
    expect(process.env.NEXTAUTH_URL).toBe('http://localhost:3000');
    expect(process.env.DATABASE_URL).toBe('file:./test.db');
  });
});
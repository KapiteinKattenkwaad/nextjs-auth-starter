import { PrismaClient } from '@/generated/prisma';
import { beforeEach, afterEach } from 'vitest';

// Create a test database client
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
});

// Helper function to clean up database between tests
export const cleanupDatabase = async () => {
  // Delete all records in reverse order of dependencies
  await testDb.verificationToken.deleteMany();
  await testDb.user.deleteMany();
};

// Helper function to create test user
export const createTestUser = async (overrides = {}) => {
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  return testDb.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      ...overrides,
    },
  });
};

// Helper function to create verification token
export const createVerificationToken = async (identifier: string, token: string, expires: Date) => {
  return testDb.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });
};

// Setup and teardown hooks for tests
export const setupTestDatabase = () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });
};
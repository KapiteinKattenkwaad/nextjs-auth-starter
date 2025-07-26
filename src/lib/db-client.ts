/**
 * Database client utility for use in scripts
 * 
 * This module provides a simple database client for use in scripts
 * like the seed script. It doesn't use the singleton pattern to avoid
 * issues with hot reloading.
 */

import { PrismaClient } from '@prisma/client';

// Create a new PrismaClient instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export { prisma };
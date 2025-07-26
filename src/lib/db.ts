/**
 * Prisma client singleton
 * 
 * This module provides a singleton instance of the Prisma client
 * to ensure efficient database connections throughout the application.
 * It implements proper error handling and connection management.
 * 
 * @module db
 */

import { PrismaClient, Prisma } from '@/generated/prisma';
import * as runtime from '@/generated/prisma/runtime/library.js';

const PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
const PrismaClientValidationError = runtime.PrismaClientValidationError;
const PrismaClientInitializationError = runtime.PrismaClientInitializationError;

/**
 * Custom error types for database operations
 */
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string) {
    super(`Database connection error: ${message}`);
    this.name = 'ConnectionError';
  }
}

export class QueryError extends DatabaseError {
  constructor(message: string) {
    super(`Database query error: ${message}`);
    this.name = 'QueryError';
  }
}

/**
 * Creates a new PrismaClient instance with appropriate logging configuration
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    errorFormat: 'pretty',
  });
};

// Define global type for PrismaClient
declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

/**
 * Singleton instance of PrismaClient
 * Uses globalThis to preserve instance across hot reloads in development
 */
const prisma = globalThis.prisma ?? prismaClientSingleton();

// In development, attach to globalThis to prevent multiple instances during hot reloading
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

/**
 * Database connection status
 */
let isConnected = false;

/**
 * Ensures database connection is established
 * @returns Connected Prisma client
 * @throws ConnectionError if connection fails
 */
export async function connectDatabase() {
  if (isConnected) {
    return prisma;
  }

  try {
    // Test the connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    return prisma;
  } catch (error) {
    isConnected = false;
    console.error('Failed to connect to database:', error);
    throw new ConnectionError(
      error instanceof Error ? error.message : 'Unknown connection error'
    );
  }
}

/**
 * Disconnects from the database
 * Useful for serverless environments or testing
 */
export async function disconnectDatabase() {
  if (!isConnected) {
    return;
  }

  try {
    await prisma.$disconnect();
    isConnected = false;
  } catch (error) {
    console.error('Error disconnecting from database:', error);
    // Don't throw here as this is typically called during cleanup
  }
}

/**
 * Maps Prisma errors to more user-friendly error types
 * @param error - The error to map
 * @returns Mapped error with more descriptive message
 */
function mapPrismaError(error: unknown): Error {
  if (error instanceof PrismaClientKnownRequestError) {
    // Handle known Prisma errors
    switch (error.code) {
      case 'P2002':
        return new QueryError(`Unique constraint violation: ${error.meta?.target || 'unknown field'}`);
      case 'P2025':
        return new QueryError('Record not found');
      case 'P2003':
        return new QueryError(`Foreign key constraint failed: ${error.meta?.field_name || 'unknown field'}`);
      default:
        return new QueryError(`Database error code ${error.code}: ${error.message}`);
    }
  } else if (error instanceof PrismaClientValidationError) {
    return new QueryError('Validation error: Invalid data provided to database query');
  } else if (error instanceof PrismaClientInitializationError) {
    return new ConnectionError(`Database initialization failed: ${error.message}`);
  } else if (error instanceof Error) {
    return new DatabaseError(error.message);
  }
  
  return new DatabaseError('Unknown database error occurred');
}

/**
 * Executes a database operation with comprehensive error handling
 * @param operation - Function that performs a database operation
 * @returns Result of the database operation
 * @throws DatabaseError with detailed message if the operation fails
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    // Ensure database is connected before operation
    await connectDatabase();
    return await operation();
  } catch (error) {
    // Log the error (in a real app, you might want to use a proper logging solution)
    console.error('Database operation failed:', error);
    
    // Map to appropriate error type with user-friendly message
    throw mapPrismaError(error);
  }
}

/**
 * Executes a transaction with error handling
 * @param operations - Function that performs transaction operations
 * @returns Result of the transaction
 * @throws DatabaseError with detailed message if the transaction fails
 */
export async function withTransaction<T>(
  operations: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  try {
    // Ensure database is connected
    await connectDatabase();
    
    // Execute transaction
    return await prisma.$transaction(operations);
  } catch (error) {
    console.error('Transaction failed:', error);
    throw mapPrismaError(error);
  }
}

// Export the singleton instance
export { prisma };
/**
 * Examples of using the database client utility
 * 
 * This file provides examples of how to use the database client utility
 * with proper error handling and connection management.
 */

import { prisma, withErrorHandling, withTransaction, DatabaseError } from './db';
import { User } from '../generated/prisma';

/**
 * Example: Simple query with error handling
 */
export async function findUserById(id: string): Promise<User | null> {
  return withErrorHandling(async () => {
    return await prisma.user.findUnique({
      where: { id }
    });
  });
}

/**
 * Example: Create operation with error handling
 */
export async function createUser(email: string, name: string, hashedPassword: string): Promise<User> {
  return withErrorHandling(async () => {
    return await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword
      }
    });
  });
}

/**
 * Example: Update operation with error handling
 */
export async function updateUserName(id: string, name: string): Promise<User> {
  return withErrorHandling(async () => {
    return await prisma.user.update({
      where: { id },
      data: { name }
    });
  });
}

/**
 * Example: Delete operation with error handling
 */
export async function deleteUser(id: string): Promise<User> {
  return withErrorHandling(async () => {
    return await prisma.user.delete({
      where: { id }
    });
  });
}

/**
 * Example: Transaction with multiple operations
 */
export async function transferUserData(sourceId: string, targetId: string): Promise<void> {
  return withTransaction(async (tx) => {
    // Get source user data
    const sourceUser = await tx.user.findUnique({
      where: { id: sourceId },
      select: { name: true, image: true }
    });
    
    if (!sourceUser) {
      throw new DatabaseError(`Source user with ID ${sourceId} not found`);
    }
    
    // Update target user with source data
    await tx.user.update({
      where: { id: targetId },
      data: {
        name: sourceUser.name,
        image: sourceUser.image
      }
    });
    
    // Additional operations can be added here
    // All operations will be rolled back if any fails
  });
}

/**
 * Example: Complex query with relations
 */
export async function getUserWithVerificationTokens(email: string) {
  return withErrorHandling(async () => {
    // This is just an example - adjust based on your actual schema
    return await prisma.user.findUnique({
      where: { email },
      // include: {
      //   // Include related models based on your schema
      //   // For example, if you have a VerificationToken model related to User:
      //   // verificationTokens: true
      // }
    });
  });
}

/**
 * Example: Error handling demonstration
 */
export async function demonstrateErrorHandling() {
  try {
    // Attempt to create a user with a duplicate email (assuming email is unique)
    await createUser('existing@example.com', 'Test User', 'hashedPassword');
    console.log('User created successfully');
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.log(`Handled database error: ${error.message}`);
      // Handle specific error types
      return { success: false, error: error.message };
    }
    // Handle other errors
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
  
  return { success: true };
}
/**
 * Seed script for development database
 * 
 * This script populates the database with initial data for development purposes.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';

// Initialize Prisma Client directly for the seed script
const prisma = new PrismaClient();

/**
 * Password hashing function using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
async function hashPassword(password: string): Promise<string> {
  // Use 10 salt rounds for a good balance of security and performance
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('Seeding database...');
  
  try {
    // Define test users with different roles
    const users = [
      {
        name: 'Test User',
        email: 'test@example.com',
        plainPassword: 'password123',
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        plainPassword: 'admin123',
      },
      {
        name: 'Developer',
        email: 'dev@example.com',
        plainPassword: 'dev123',
      },
    ];
    
    console.log('Creating test users...');
    
    // Create each user with a hashed password
    for (const user of users) {
      const hashedPassword = await hashPassword(user.plainPassword);
      
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
        },
      });
      
      console.log(`User created: ${user.email}`);
    }
    
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error in seeding operation:', error);
    throw error;
  }
}

// Execute the main function
main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the Prisma client connection
    await prisma.$disconnect();
  });
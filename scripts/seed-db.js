/**
 * Simple script to seed the database with test users
 */

const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

// Initialize Prisma Client
const prisma = new PrismaClient();

/**
 * Password hashing function using bcrypt
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
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
  } finally {
    // Close the Prisma client connection
    await prisma.$disconnect();
  }
}

// Execute the main function
main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  });
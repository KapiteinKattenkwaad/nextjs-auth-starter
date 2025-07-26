/**
 * Script to seed the database with test users
 * 
 * This script can be run independently to add test users to the database.
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

/**
 * Creates test users in the database
 */
async function seedUsers() {
  console.log('Creating test users...');
  
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
  
  console.log('User seeding completed successfully!');
}

// Execute the seeding function
seedUsers()
  .catch((e) => {
    console.error('Error seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Close the Prisma client connection
    await prisma.$disconnect();
  });
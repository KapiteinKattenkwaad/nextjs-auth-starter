/**
 * User Registration API Route
 * 
 * This API endpoint handles user registration with email and password.
 * It validates input, checks for email uniqueness, and creates a new user
 * with a securely hashed password.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { createRateLimitMiddleware, updateRateLimit, rateLimitConfigs } from "@/lib/rate-limit";

// Define validation schema for registration data
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Type for registration request body
type RegisterRequest = z.infer<typeof registerSchema>;

// Create rate limiting middleware for registration
const rateLimitMiddleware = createRateLimitMiddleware(rateLimitConfigs.auth);

/**
 * POST handler for user registration
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limiting
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Validate input against schema
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return NextResponse.json(
        { 
          error: { 
            message: "Invalid input data", 
            details: errors 
          } 
        },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validationResult.data;
    
    // Validate password strength
    const passwordErrors = validatePasswordStrength(password) || [];
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { 
          error: { 
            message: "Password does not meet security requirements", 
            details: passwordErrors 
          } 
        },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    
    if (existingUser) {
      // Update rate limit for failed request
      updateRateLimit(request, rateLimitConfigs.auth, false);
      return NextResponse.json(
        { error: { message: "Email already registered" } },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        // Exclude password for security
      }
    });
    
    // Update rate limit for successful request
    updateRateLimit(request, rateLimitConfigs.auth, true);
    
    // Return success response with user data (excluding password)
    return NextResponse.json(
      { 
        message: "User registered successfully", 
        user 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    
    // Return generic error message to client
    return NextResponse.json(
      { error: { message: "Failed to register user" } },
      { status: 500 }
    );
  }
}
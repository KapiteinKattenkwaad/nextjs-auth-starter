/**
 * Custom Login API Route with Rate Limiting
 * 
 * This API endpoint handles login requests with rate limiting and progressive delays
 * for failed attempts. It works alongside NextAuth for authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { 
  createRateLimitMiddleware, 
  createLoginDelayMiddleware,
  updateRateLimit, 
  recordFailedLogin,
  clearFailedLogins,
  rateLimitConfigs 
} from "@/lib/rate-limit";

// Define validation schema for login request
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  callbackUrl: z.string().optional(),
});

// Type for login request body
type LoginRequest = z.infer<typeof loginSchema>;

// Create rate limiting middleware for login
const rateLimitMiddleware = createRateLimitMiddleware(rateLimitConfigs.login);
const loginDelayMiddleware = createLoginDelayMiddleware();

/**
 * POST handler for login with rate limiting and progressive delays
 */
export async function POST(request: NextRequest) {
  try {
    // Check general rate limiting
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Check progressive delay for failed login attempts
    const delayResponse = loginDelayMiddleware(request);
    if (delayResponse) {
      return delayResponse;
    }
    
    // Parse and validate request body
    const body = await request.json();
    
    // Validate input against schema
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      // Record failed attempt for validation errors
      recordFailedLogin(request);
      updateRateLimit(request, rateLimitConfigs.login, false);
      
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
    
    const { email, password, callbackUrl } = validationResult.data;
    
    // Since we can't directly use NextAuth's signIn in an API route,
    // we'll return the credentials and let the client handle the NextAuth signIn
    // This endpoint primarily serves to enforce rate limiting
    
    // For now, we'll validate the credentials manually to determine success/failure
    // and then let the client call NextAuth
    const { compare } = await import("bcryptjs");
    const { prisma } = await import("@/lib/db");
    
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      // Check if user exists and password matches
      if (!user || !(await compare(password, user.password))) {
        // Record failed login attempt
        recordFailedLogin(request);
        updateRateLimit(request, rateLimitConfigs.login, false);
        
        return NextResponse.json(
          { error: { message: "Invalid email or password" } },
          { status: 401 }
        );
      }
      
      // Clear failed login attempts on successful validation
      clearFailedLogins(request);
      updateRateLimit(request, rateLimitConfigs.login, true);
      
      // Return success - client should now call NextAuth signIn
      return NextResponse.json(
        { 
          message: "Credentials validated successfully",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            emailVerified: user.emailVerified
          }
        },
        { status: 200 }
      );
      
    } catch (dbError) {
      console.error("Database error during login:", dbError);
      
      // Record failed attempt for database errors
      recordFailedLogin(request);
      updateRateLimit(request, rateLimitConfigs.login, false);
      
      return NextResponse.json(
        { error: { message: "Authentication failed" } },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Login error:", error);
    
    // Record failed attempt for any other errors
    recordFailedLogin(request);
    updateRateLimit(request, rateLimitConfigs.login, false);
    
    // Return generic error message to client
    return NextResponse.json(
      { error: { message: "Failed to process login request" } },
      { status: 500 }
    );
  }
}
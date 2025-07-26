/**
 * Reset Password API Route
 * 
 * This API endpoint handles password reset requests.
 * It validates the token, checks if it's expired, and updates the user's password.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { createRateLimitMiddleware, updateRateLimit, rateLimitConfigs } from "@/lib/rate-limit";

// Define validation schema for password reset request
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});



// Create rate limiting middleware for password reset
const rateLimitMiddleware = createRateLimitMiddleware(rateLimitConfigs.passwordReset);

/**
 * POST handler for password reset
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
    const validationResult = resetPasswordSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      // Update rate limit for failed request
      updateRateLimit(request, rateLimitConfigs.passwordReset, false);
      return NextResponse.json(
        { 
          error: { 
            message: "Invalid input data", 
            details: errors.fieldErrors 
          } 
        },
        { status: 400 }
      );
    }
    
    const { token, password } = validationResult.data;
    
    // Validate password strength
    const passwordErrors = validatePasswordStrength(password) || [];
    if (passwordErrors.length > 0) {
      // Update rate limit for failed request
      updateRateLimit(request, rateLimitConfigs.passwordReset, false);
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
    
    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });
    
    // Check if token exists and is valid
    if (!verificationToken) {
      // Update rate limit for failed request
      updateRateLimit(request, rateLimitConfigs.passwordReset, false);
      return NextResponse.json(
        { error: { message: "Invalid or expired password reset token" } },
        { status: 400 }
      );
    }
    
    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      
      // Update rate limit for failed request
      updateRateLimit(request, rateLimitConfigs.passwordReset, false);
      return NextResponse.json(
        { error: { message: "Password reset token has expired" } },
        { status: 400 }
      );
    }
    
    // Find user by identifier (user ID)
    const user = await prisma.user.findUnique({
      where: { id: verificationToken.identifier },
    });
    
    // Check if user exists
    if (!user) {
      // Update rate limit for failed request
      updateRateLimit(request, rateLimitConfigs.passwordReset, false);
      return NextResponse.json(
        { error: { message: "User not found" } },
        { status: 404 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(password);
    
    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });
    
    // Delete the used token
    await prisma.verificationToken.delete({
      where: { token },
    });
    
    // Update rate limit for successful request
    updateRateLimit(request, rateLimitConfigs.passwordReset, true);
    
    // Return success response
    return NextResponse.json(
      { message: "Password has been reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    
    // Return generic error message to client
    return NextResponse.json(
      { error: { message: "Failed to reset password" } },
      { status: 500 }
    );
  }
}
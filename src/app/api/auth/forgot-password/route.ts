/**
 * Forgot Password API Route
 * 
 * This API endpoint handles password reset requests.
 * It validates the email, generates a reset token, and sends an email
 * with a password reset link.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { createRateLimitMiddleware, updateRateLimit, rateLimitConfigs } from "@/lib/rate-limit";

// Define validation schema for forgot password request
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Type for forgot password request body
type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;

// Create rate limiting middleware for password reset
const rateLimitMiddleware = createRateLimitMiddleware(rateLimitConfigs.passwordReset);

/**
 * Generate a secure random token
 * @returns A random token string
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Send password reset email
 * @param email - Recipient email address
 * @param token - Reset token
 * @param userName - User's name
 */
async function sendPasswordResetEmail(email: string, token: string, userName: string): Promise<void> {
  // Create a test account if no email credentials are provided
  let testAccount;
  let transporter;
  
  if (!env.email.serverUser || !env.email.serverPassword) {
    // Create test account for development
    testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    // Use configured email settings
    transporter = nodemailer.createTransport({
      host: env.email.serverHost,
      port: env.email.serverPort,
      secure: env.email.serverPort === 465,
      auth: {
        user: env.email.serverUser,
        pass: env.email.serverPassword,
      },
    });
  }

  // Reset link URL
  const resetUrl = `${env.nextAuth.url}/auth/reset-password?token=${token}`;

  // Email content
  const mailOptions = {
    from: env.email.from,
    to: email,
    subject: "Password Reset Request",
    text: `Hello ${userName},\n\nYou requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not request a password reset, please ignore this email.\n\nRegards,\nThe Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>You requested a password reset. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Regards,<br>The Team</p>
      </div>
    `,
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);

  // Log email preview URL for development
  if (testAccount) {
    console.log("Password reset email sent: %s", nodemailer.getTestMessageUrl(info));
  }
}

/**
 * POST handler for password reset requests
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
    const validationResult = forgotPasswordSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      // Update rate limit for failed request
      updateRateLimit(request, rateLimitConfigs.passwordReset, false);
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
    
    const { email } = validationResult.data;
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true }
    });
    
    // For security reasons, don't reveal whether the email exists or not
    // Always return a success response even if the email doesn't exist
    if (!user) {
      // Update rate limit for successful request (even if user doesn't exist)
      updateRateLimit(request, rateLimitConfigs.passwordReset, true);
      return NextResponse.json(
        { message: "If your email is registered, you will receive a password reset link." },
        { status: 200 }
      );
    }
    
    // Generate reset token
    const token = generateToken();
    const expires = new Date(Date.now() + env.security.resetTokenExpiry * 1000);
    
    // Store token in database
    await prisma.verificationToken.create({
      data: {
        identifier: user.id,
        token,
        expires,
      },
    });
    
    // Send password reset email
    await sendPasswordResetEmail(email, token, user.name || "User");
    
    // Update rate limit for successful request
    updateRateLimit(request, rateLimitConfigs.passwordReset, true);
    
    // Return success response
    return NextResponse.json(
      { message: "If your email is registered, you will receive a password reset link." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset request error:", error);
    
    // Return generic error message to client
    return NextResponse.json(
      { error: { message: "Failed to process password reset request" } },
      { status: 500 }
    );
  }
}
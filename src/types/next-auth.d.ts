import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

/**
 * Extend the NextAuth types to include custom fields
 */
declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    emailVerified?: Date | null;
  }
}

/**
 * Extend the JWT token types
 */
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
  }
}
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth.js API route
 * 
 * This file exports the NextAuth.js API handler with the configuration
 * imported from the auth.ts utility file.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
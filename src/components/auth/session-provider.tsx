"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Session } from "next-auth";

/**
 * Session provider props
 */
interface SessionProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

/**
 * Session provider component
 * 
 * This component wraps the NextAuth SessionProvider to provide session state
 * to client components.
 */
export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
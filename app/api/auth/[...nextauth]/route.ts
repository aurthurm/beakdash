import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Define the Auth Options
export const authOptions: NextAuthOptions = {
  // Configure credentials provider
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Handle username input that could be either username or email
        const usernameOrEmail = credentials?.username;
        const password = credentials?.password;
        
        console.log("Auth attempt with credentials:", { usernameOrEmail });
        
        // Check if credentials are provided
        if (!credentials || !usernameOrEmail || !password) {
          console.log("Missing credentials");
          return null;
        }
        
        try {
          // Check if the input looks like an email
          const isEmail = usernameOrEmail.includes('@');
          console.log("Input type:", isEmail ? "email" : "username");
          
          let userResults;
          
          if (isEmail) {
            // First try to find by exact email match
            userResults = await db.select()
              .from(users)
              .where(eq(users.email, usernameOrEmail));
            console.log("Email search results:", userResults);
          } else {
            // Try to find by exact username match
            userResults = await db.select()
              .from(users)
              .where(eq(users.username, usernameOrEmail));
            console.log("Username search results:", userResults);
          }
          
          // If no results, try the opposite way
          if (!userResults || userResults.length === 0) {
            if (isEmail) {
              // Try username as a fallback
              userResults = await db.select()
                .from(users)
                .where(eq(users.username, usernameOrEmail));
            } else {
              // Try email as a fallback
              userResults = await db.select()
                .from(users)
                .where(eq(users.email, usernameOrEmail));
            }
          }
          
          // If still not found, try case-insensitive search
          if (!userResults || userResults.length === 0) {
            // Get all users (in a real production app, you'd want to limit this or use a DB-level case insensitive search)
            const allUsers = await db.select().from(users);
            
            // Try case-insensitive username match
            const usernameMatch = allUsers.find(u => 
              u.username.toLowerCase() === usernameOrEmail.toLowerCase()
            );
            
            if (usernameMatch) {
              userResults = [usernameMatch];
            } else {
              // Try case-insensitive email match
              const emailMatch = allUsers.find(u => 
                u.email && u.email.toLowerCase() === usernameOrEmail.toLowerCase()
              );
              
              if (emailMatch) {
                userResults = [emailMatch];
              } else {
                return null;
              }
            }
          }
          
          const user = userResults[0];
          console.log("Found user:", { id: user.id, username: user.username, email: user.email });
          
          let passwordMatch = false;
          
          // Console log for debugging
          console.log("Password format:", user.password.startsWith('$2') ? "bcrypt" : "plain");
          
          // Check if the password is a bcrypt hash (starts with $2a$, $2b$, etc.)
          const isBcryptHash = user.password.startsWith('$2');
          
          if (isBcryptHash) {
            try {
              // Try with bcrypt for hashed passwords
              passwordMatch = await bcrypt.compare(password, user.password);
              console.log("Bcrypt comparison result:", passwordMatch);
            } catch (error) {
              console.error("Bcrypt comparison error:", error);
              passwordMatch = false;
            }
          } else {
            // Direct string comparison for plain text passwords
            passwordMatch = password === user.password;
            console.log("Direct comparison result:", passwordMatch);
            
            // If it matched with direct comparison, we should update to bcrypt
            // Disabling this for now to make testing easier
            /* 
            if (passwordMatch) {
              const hashedPassword = await bcrypt.hash(password, 10);
              await db.update(users)
                .set({ password: hashedPassword })
                .where(eq(users.id, user.id));
            }
            */
          }
          
          if (passwordMatch) {
            // Return user without password
            return {
              id: user.id.toString(),
              name: user.displayName || user.username,
              email: user.email || undefined,
              image: user.avatarUrl || undefined,
              role: user.role || undefined
            };
          }
          
          return null;
        } catch (error) {
          console.error("Error during authentication:", error);
          return null;
        }
      }
    }),
  ],
  
  // Pages for custom sign in, sign up experiences
  pages: {
    signIn: "/auth",
    newUser: "/auth/sign-up",
  },
  
  // Callbacks to customize session and JWT behavior
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || "";
        // Add additional user properties to session if needed
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Add user data to token
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
  
  // Secret for JWT encryption
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
  
  // Enable JWT sessions by default 
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Enable debug only when explicitly set
  debug: process.env.NEXTAUTH_DEBUG === "true",
};
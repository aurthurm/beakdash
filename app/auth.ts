import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/app/lib/drizzle"
import { 
  accountsTable, usersTable, 
  sessionsTable, verificationTokensTable, 
} from "@/app/lib/drizzle/schemas"
   
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: usersTable,
    accountsTable: accountsTable,
    sessionsTable: sessionsTable,
    verificationTokensTable: verificationTokensTable,
  }),
  providers: [GitHub],
  pages: {
    signIn: "/login",
    error: "/error"
  },  
  callbacks: {
    session: ({ session, user}) => {
        if (session?.user) session.user.id = user.id;
        return session;
    }
}
})
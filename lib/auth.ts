import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { rateLimit, clientIp } from "./rateLimit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = clientIp(request);
        const { allowed } = rateLimit(`login:${ip}:${credentials.email}`, {
          limit: 8,
          windowMs: 15 * 60 * 1000,
        });
        if (!allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        // Only non-sensitive fields go into the session/JWT.
        // "verified" (not "emailVerified") to avoid colliding with next-auth's
        // own AdapterUser.emailVerified: Date | null shape.
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          verified: Boolean(user.emailVerified),
          isAdmin: user.isAdmin,
        } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.verified = (user as unknown as { verified: boolean }).verified;
        token.isAdmin = (user as unknown as { isAdmin: boolean }).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.uid as string;
        (session.user as { verified?: boolean }).verified = Boolean(token.verified);
        (session.user as { isAdmin?: boolean }).isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
});

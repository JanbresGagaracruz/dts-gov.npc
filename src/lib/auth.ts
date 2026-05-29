import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { redis } from "./redis";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit: 10 login attempts per minute per IP
        try {
          const ip =
            (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
            (req?.headers?.["x-real-ip"] as string) ||
            "unknown";
          const key   = `rl:login:${ip}`;
          const count = await redis.incr(key);
          if (count === 1) await redis.expire(key, 60);
          if (count > 10) return null;
        } catch { /* Redis unavailable — fail open */ }

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
          },
        });

        if (!user) return null;

        const passwordField = user.password || "";
        const isValid = await bcrypt.compare(
          credentials.password,
          passwordField,
        );
        if (!isValid) return null;

        const u = user as any;

        let scopeDivisionName:   string | null = null;
        let scopeDepartmentName: string | null = null;
        if (u.scopeDivisionId) {
          const div  = await prisma.division.findUnique({ where: { id: u.scopeDivisionId },   select: { name: true } }).catch(() => null);
          scopeDivisionName = div?.name ?? null;
        }
        if (u.scopeDepartmentId) {
          const dept = await prisma.department.findUnique({ where: { id: u.scopeDepartmentId }, select: { name: true } }).catch(() => null);
          scopeDepartmentName = dept?.name ?? null;
        }

        return {
          id: String(u.id),
          name: u.firstName + " " + u.lastName,
          email: u.email || "",
          accessLevel: u.accessLevel ?? 1,
          role: u.role ?? "VIEWER",
          scopeDepartmentId:   u.scopeDepartmentId   ?? null,
          scopeDivisionId:     u.scopeDivisionId     ?? null,
          scopeDivisionName,
          scopeDepartmentName,
          username: u.username,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id                  = user.id;
        token.accessLevel         = (user as any).accessLevel;
        token.role                = (user as any).role;
        token.scopeDepartmentId   = (user as any).scopeDepartmentId;
        token.scopeDivisionId     = (user as any).scopeDivisionId;
        token.scopeDivisionName   = (user as any).scopeDivisionName;
        token.scopeDepartmentName = (user as any).scopeDepartmentName;
        token.username            = (user as any).username;
        return token;
      }

      // Check if an admin has changed this user's access/scope since they last logged in
      if (token.id) {
        try {
          const flag = await redis.get(`force_logout:${token.id as string}`);
          if (flag) {
            await redis.del(`force_logout:${token.id as string}`);
            return { ...token, requireReauth: true };
          }
        } catch { /* Redis unavailable — fail open */ }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id                  = token.id as string;
        session.user.accessLevel         = token.accessLevel as number;
        session.user.role                = token.role as string;
        session.user.scopeDepartmentId   = token.scopeDepartmentId   as string | null;
        session.user.scopeDivisionId     = token.scopeDivisionId     as string | null;
        session.user.scopeDivisionName   = token.scopeDivisionName   as string | null;
        session.user.scopeDepartmentName = token.scopeDepartmentName as string | null;
        session.user.username            = token.username as string;
        // Signal the client to sign out — admin changed this user's access or scope
        if ((token as any).requireReauth) {
          (session as any).error = "requireReauth";
        }
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};

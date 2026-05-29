// src/lib/auth.ts
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
        email: { label: "Username / Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit: 10 login attempts per minute per IP
        try {
          const ip =
            (req?.headers?.["x-forwarded-for"] as string)
              ?.split(",")[0]
              ?.trim() ||
            (req?.headers?.["x-real-ip"] as string) ||
            "unknown";
          const key = `rl:login:${ip}`;
          const count = await redis.incr(key);
          if (count === 1) await redis.expire(key, 60);
          if (count > 10) return null;
        } catch {
          /* fail open */
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: credentials.email }, { username: credentials.email }],
          },
          include: {
            department: { select: { id: true, name: true, code: true } },
          },
        });

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password || "",
        );
        if (!isValid) return null;

        return {
          id: String(user.id),
          name:
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.username,
          email: user.email || "",
          username: user.username,
          accessLevel: user.accessLevel ?? 1,
          role: user.role ?? "VIEWER",
          departmentId: user.departmentId ?? null,
          department: user.department ?? null,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessLevel = (user as any).accessLevel;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.departmentId = (user as any).departmentId;
        token.department = (user as any).department;
        return token;
      }

      // Force-logout check (admin changed scope)
      if (token.id) {
        try {
          const flag = await redis.get(`force_logout:${token.id as string}`);
          if (flag) {
            await redis.del(`force_logout:${token.id as string}`);
            return { ...token, requireReauth: true };
          }
        } catch {
          /* fail open */
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.accessLevel = token.accessLevel as number;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        (session.user as any).departmentId = token.departmentId;
        (session.user as any).department = token.department;
        if ((token as any).requireReauth)
          (session as any).error = "requireReauth";
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};

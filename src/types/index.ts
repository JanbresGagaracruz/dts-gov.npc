// src/types/index.ts
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    accessLevel: number;
    role: string;
    username: string;
    departmentId: string | null;
    department: { id: string; name: string; code: string } | null;
  }
  interface Session {
    user: User & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accessLevel: number;
    role: string;
    username: string;
    departmentId: string | null;
    department: { id: string; name: string; code: string } | null;
  }
}

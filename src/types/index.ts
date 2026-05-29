import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    accessLevel: number
    role: string
    scopeDepartmentId: string | null
    scopeDivisionId: string | null
    username: string
  }
  interface Session {
    user: User & {
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    accessLevel: number
    role: string
    scopeDepartmentId: string | null
    scopeDivisionId: string | null
    username: string
  }
}
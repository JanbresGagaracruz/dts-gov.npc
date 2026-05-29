// src/proxy.ts  (middleware)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ROUTES = [
  "/analytics",
  "/users",
  "/department",
  "/settings",
  "/activity-trail",
  "/documents/archive",
];

const STAFF_ROUTES = ["/documents/create"];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const level = (token?.accessLevel as number) ?? 1;
    const pathname = req.nextUrl.pathname;

    if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && level < 3) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (STAFF_ROUTES.some((r) => pathname.startsWith(r)) && level < 2) {
      return NextResponse.redirect(new URL("/documents", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/documents/:path*",
    "/track/:path*",
    "/notifications/:path*",
    "/analytics/:path*",
    "/users/:path*",
    "/department/:path*",
    "/settings/:path*",
    "/activity-trail/:path*",
  ],
};

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Routes that require Admin or above (accessLevel ≥ 3)
const ADMIN_ROUTES = [
  "/products/import",
  "/analytics",
  "/users",
  "/roles",
  "/role-mapping",
  "/division",
  "/department",
  "/settings",
  "/product-changes",
  "/activity-trail",
];

// Routes that require Staff or above (accessLevel ≥ 2)
const STAFF_ROUTES = [
  "/products/new",
  "/transfers",
  "/scan",
  "/requisitions/new",
  "/bin-locations/new",
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const level = (token?.accessLevel as number) ?? 1;
    const pathname = req.nextUrl.pathname;

    // Admin-only routes → redirect viewers and staff to their dashboard
    if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && level < 3) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Staff-only routes → redirect viewers to their dashboard
    if (STAFF_ROUTES.some((r) => pathname.startsWith(r)) && level < 2) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Unauthenticated users are always redirected to /login by next-auth
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/master-item/:path*",
    "/scan/:path*",
    "/inventory/:path*",
    "/transfers/:path*",
    "/scan-logs/:path*",
    "/ledger/:path*",
    "/products/:path*",
    "/warehouse/:path*",
    "/analytics/:path*",
    "/powerplant/:path*",
    "/plant-mapping/:path*",
    "/users/:path*",
    "/roles/:path*",
    "/role-mapping/:path*",
    "/division/:path*",
    "/department/:path*",
    "/settings/:path*",
    "/product-changes/:path*",
    "/activity-trail/:path*",
    "/requisitions/:path*",
    "/bin-locations/:path*",
  ],
};

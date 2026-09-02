// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Jika ada token, cek role
    if (token) {
      const role = token.role;

      // Admin routes
      if (path.startsWith("/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Dashboard route untuk admin
      if (path === "/dashboard" && role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }

      // Jika user login dan mengakses root, redirect ke dashboard
      if (path === "/" && token) {
        const redirectUrl = role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
    }

    // Jika tidak ada token dan mencoba akses protected routes
    const protectedPaths = ["/dashboard", "/admin", "/generate"];
    if (!token && protectedPaths.some(p => path.startsWith(p))) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    // Response dengan header anti-cache
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Public paths
        const publicPaths = ["/", "/login", "/api/auth"];
        if (publicPaths.some(p => path.startsWith(p))) {
          return true;
        }

        // Admin paths
        if (path.startsWith("/admin")) {
          return token?.role === "ADMIN";
        }

        // Protected paths lainnya
        const protectedPaths = ["/dashboard", "/generate"];
        if (protectedPaths.some(p => path.startsWith(p))) {
          return !!token;
        }

        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/admin/:path*",
    "/generate/:path*",
    "/login",
  ],
}
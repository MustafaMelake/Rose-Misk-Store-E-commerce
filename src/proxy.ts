import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  const sessionToken =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");
  const isAdminPage = path.startsWith("/admin");
  const isProtectedPage =
    path.startsWith("/checkout") || path.startsWith("/profile") || isAdminPage;

  if (!sessionToken && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionToken && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (sessionToken && isAdminPage) {
    try {
      const response = await fetch(
        `${request.nextUrl.origin}/api/auth/get-session`,
        {
          headers: {
            cookie: request.headers.get("cookie") || "",
          },
        }
      );
      if (response.ok) {
        const session = await response.json();
        if (!session || session.user.role !== "ADMIN") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } else {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch (error) {
      console.error("Middleware Auth Error:", error);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/checkout", "/profile", "/admin/:path*"],
};

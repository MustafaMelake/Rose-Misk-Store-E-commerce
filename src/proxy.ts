import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export default async function proxy(request: NextRequest) {
  // Optimistic check only: is a Better Auth session cookie present?
  // This does NOT verify the session against the database or check the role —
  // it just avoids rendering protected routes for obviously-signed-out users.
  // The real authorization boundary is the admin layout guard plus the
  // per-action / per-page `requireAdmin()` / `requireUser()` DB-backed checks.
  const sessionCookie = getSessionCookie(request);

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");
  const isProtectedPage =
    path.startsWith("/admin") ||
    path.startsWith("/orders") ||
    path.startsWith("/placeorder");

  // Signed-out visitor hitting a protected route → send to login, preserving
  // where they were headed so login can return them there after signing in
  // (G14). The path + original query string round-trips through `callbackUrl`.
  if (!sessionCookie && isProtectedPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", path + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Already signed in but visiting login/signup → send home.
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/admin/:path*",
    "/orders/:path*",
    "/placeorder/:path*",
  ],
};

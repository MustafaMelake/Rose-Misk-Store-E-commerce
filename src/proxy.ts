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

  // 1. حماية الصفحات المحمية (Login Check)
  if (!sessionToken && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. لو مسجل دخول وبيحاول يروح لصفحة Auth
  if (sessionToken && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. حماية مسارات الأدمن (Role Check)
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

      // تأكد أن الرد سليم قبل محاولة تحويله لـ JSON
      if (response.ok) {
        const session = await response.json();
        if (!session || session.user.role !== "ADMIN") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } else {
        // لو الـ API ردت بـ Error، نرجعه للـ login للأمان
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

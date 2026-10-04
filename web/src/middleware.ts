import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that DON'T require authentication
const PUBLIC_ROUTES = ["/login", "/lookup", "/p/", "/api/webhooks/"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Create a response we can modify
  let response = NextResponse.next({ request });

  // Create Supabase client for middleware (cookie-based session refresh)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth session (IMPORTANT: must call getUser, not getSession for security)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Multi-domain routing logic ---
  const isParentDomain =
    hostname.includes("phuhuynh") || hostname.includes("parent");

  // If accessing parent domain root, rewrite to lookup page
  if (isParentDomain && pathname === "/") {
    return NextResponse.rewrite(new URL("/lookup", request.url));
  }

  // If parent domain tries to access admin routes, block
  if (isParentDomain && !isPublicRoute(pathname) && pathname !== "/") {
    return NextResponse.redirect(new URL("/lookup", request.url));
  }

  // --- Authentication guard for Admin routes ---
  if (!isPublicRoute(pathname) && pathname !== "/") {
    // Non-public route: require authentication
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If user is already logged in and visits /login, redirect to dashboard
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

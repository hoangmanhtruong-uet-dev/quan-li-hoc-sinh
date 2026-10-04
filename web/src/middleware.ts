import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Check if accessing Parent domain (e.g. phuhuynh.domain.com or tutortrack-parent.vercel.app)
  const isParentDomain = hostname.includes("phuhuynh") || hostname.includes("parent");

  // If accessing parent domain and visiting root "/", rewrite to "/lookup" page for parents
  if (isParentDomain && pathname === "/") {
    return NextResponse.rewrite(new URL("/lookup", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

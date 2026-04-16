import { NextRequest, NextResponse } from "next/server";

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "kyk2025demo";
const COOKIE_NAME = "kyk_demo_auth";

export function middleware(request: NextRequest) {
  // Login sayfası, API route'ları ve static dosyaları atla
  if (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value === DEMO_PASSWORD) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

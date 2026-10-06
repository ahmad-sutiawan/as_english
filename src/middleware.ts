import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const protectedPrefixes = ["/dashboard", "/learn"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtected && !req.auth) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/learn/:path*"],
};

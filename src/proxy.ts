import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Optimistic: no session cookie on a private page → a real 307 to log in,
// before rendering. The cookie's validity is still checked by each page
// (`requireUser`) and by the backend; this only spares visitors a round trip.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/app/:path*", "/write/:path*"] };

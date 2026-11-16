import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session";

// Database migration, diagnostic and test endpoints change or expose the
// database, so they require a signed-in admin. (Bill add/edit/delete/import
// routes check the session themselves.)
export async function middleware(request: NextRequest) {
  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*", "/api/test-env", "/api/test-db", "/api/test-query"],
};

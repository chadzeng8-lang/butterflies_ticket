import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** 轻量门禁：有 Cookie 才放行；真伪校验在各 admin 页面 / Server Action 内完成。 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (req.cookies.get("mts_admin")?.value) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};

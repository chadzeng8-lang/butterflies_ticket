import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const canonicalSite = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  // Keep auth/email callbacks on the custom domain, not ephemeral Netlify deploy hosts.
  if (
    canonicalSite &&
    host.endsWith(".netlify.app") &&
    !canonicalSite.includes(".netlify.app")
  ) {
    const target = new URL(
      `${pathname}${request.nextUrl.search}`,
      canonicalSite
    );
    return NextResponse.redirect(target, 308);
  }
  const allowedAdminPaths = new Set([
    "/admin/online-orders",
    "/admin/online-orders/export",
    "/admin/online-accounts",
    "/admin/online-checkin",
  ]);
  if (pathname.startsWith("/admin") && !allowedAdminPaths.has(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/online-orders";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

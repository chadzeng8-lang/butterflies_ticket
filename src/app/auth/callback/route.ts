import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicSiteUrl } from "@/lib/site-url";

function getSafeNextPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/account")
    ? value
    : "/account";
}

function redirectToSite(path: string, request: NextRequest) {
  const siteUrl = getPublicSiteUrl();
  return NextResponse.redirect(new URL(path, siteUrl || request.url));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectToSite(
        getSafeNextPath(request.nextUrl.searchParams.get("next")),
        request
      );
    }
  }

  return redirectToSite("/account?error=verification", request);
}

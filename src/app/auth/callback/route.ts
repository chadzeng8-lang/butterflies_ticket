import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/account")
    ? value
    : "/account";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        new URL(getSafeNextPath(request.nextUrl.searchParams.get("next")), request.url)
      );
    }
  }

  return NextResponse.redirect(
    new URL("/account?error=verification", request.url)
  );
}

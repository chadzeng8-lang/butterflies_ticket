import Link from "next/link";
import { AccountForm } from "@/components/AccountForm";
import { SiteHeader } from "@/components/SiteHeader";
import { signOutAction } from "@/app/actions/account";
import {
  createSupabaseServerClient,
  getSupabaseUser,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const candidate = params.next || "";
  const nextPath =
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.startsWith("/account")
      ? candidate
      : "/account";
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  let isAdmin = false;
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw new Error("PROFILE_LOOKUP_FAILED");
    isAdmin = profile?.role === "admin";
  }

  return (
    <main className="shell shell-narrow">
      <SiteHeader />
      <section className="hero">
        <h1>電郵帳號</h1>
        <p>登記場次前請先登入；訂單會安全地關聯至你的帳號。</p>
      </section>
      {user ? (
        <article className="panel">
          <h2>已登入</h2>
          <p className="muted">{user.email}</p>
          <div className="row" style={{ marginTop: "1rem" }}>
            <Link className="btn" href="/">
              選擇場次
            </Link>
            <Link className="btn secondary" href="/tickets">
              我的票夹
            </Link>
            {isAdmin && (
              <Link className="btn secondary" href="/admin/online-orders">
                管理在线订单
              </Link>
            )}
            <form action={signOutAction}>
              <button className="btn secondary" type="submit">
                登出
              </button>
            </form>
          </div>
        </article>
      ) : (
        <AccountForm nextPath={nextPath} />
      )}
    </main>
  );
}

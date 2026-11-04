"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/app/actions/admin";
import { SiteHeader } from "@/components/SiteHeader";

const initial: ActionState = {};

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <main className="shell">
      <SiteHeader />
      <section className="hero">
        <h1>干事登录</h1>
        <p>仅供音乐剧社干事对账、出票与现场核销。</p>
      </section>
      <article className="card" style={{ maxWidth: 420 }}>
        <form action={action} className="form">
          <label>
            管理密码
            <input name="password" type="password" required autoFocus />
          </label>
          {state.error && <div className="error">{state.error}</div>}
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "登录中…" : "进入后台"}
          </button>
        </form>
      </article>
    </main>
  );
}

"use client";

import { useFormStatus } from "react-dom";
import { toggleSignupSkipEmailConfirmAction } from "@/app/actions/account";

function SubmitButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn secondary" type="submit" disabled={pending}>
      {pending
        ? "切换中…"
        : enabled
          ? "关闭免验证（恢复邮箱验证）"
          : "开启免验证（跳过邮箱验证）"}
    </button>
  );
}

export function SignupVerifyToggle({
  enabled,
  canUse,
}: {
  enabled: boolean;
  /** 本地开发且已配置 service role 时才真正能免验证 */
  canUse: boolean;
}) {
  return (
    <article className="panel" style={{ marginTop: "1rem" }}>
      <p className="eyebrow">LOCAL DEV</p>
      <h2>注册邮箱验证</h2>
      <p className="muted" style={{ marginTop: "0.5rem" }}>
        当前：{enabled ? "免验证注册（不发验证信）" : "需要邮箱验证链接"}
        。仅 localhost 生效；关掉后完整走验证信流程。
      </p>
      {!canUse && enabled ? (
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          开关已开，但仍需在 `.env.local` 配置 `SUPABASE_SERVICE_ROLE_KEY` 才能免验证注册。
        </p>
      ) : null}
      <form action={toggleSignupSkipEmailConfirmAction} style={{ marginTop: "1rem" }}>
        <input type="hidden" name="enabled" value={enabled ? "0" : "1"} />
        <SubmitButton enabled={enabled} />
      </form>
    </article>
  );
}

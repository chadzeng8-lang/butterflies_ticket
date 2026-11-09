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
  /** 已配置 SUPABASE_SERVICE_ROLE_KEY 时免验证才会真正生效 */
  canUse: boolean;
}) {
  return (
    <article className="panel" style={{ marginTop: "1rem" }}>
      <p className="eyebrow">ADMIN</p>
      <h2>注册邮箱验证</h2>
      <p className="muted" style={{ marginTop: "0.5rem" }}>
        当前：{enabled ? "免验证注册（不发验证信）" : "需要邮箱验证链接"}
        。管理员可随时切换；关掉后完整走验证信流程。
      </p>
      {!canUse ? (
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          免验证实际生效还需配置环境变量{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>
          （本地写在 `.env.local`，线上写在 Netlify，用完建议删掉）。
        </p>
      ) : null}
      <form action={toggleSignupSkipEmailConfirmAction} style={{ marginTop: "1rem" }}>
        <input type="hidden" name="enabled" value={enabled ? "0" : "1"} />
        <SubmitButton enabled={enabled} />
      </form>
    </article>
  );
}

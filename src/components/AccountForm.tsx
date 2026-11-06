"use client";

import { useActionState } from "react";
import {
  signInAction,
  signUpAction,
  type AccountActionState,
} from "@/app/actions/account";
import { BusyButton } from "@/components/BusyButton";
import { PasswordField } from "@/components/PasswordField";

const initialState: AccountActionState = {};

export function AccountForm({ nextPath }: { nextPath: string }) {
  const [signInState, signIn, signingIn] = useActionState(signInAction, initialState);
  const [signUpState, signUp, signingUp] = useActionState(signUpAction, initialState);

  return (
    <div className="grid">
      <article className="panel">
        <h2>已有账号</h2>
        <form action={signIn} className="form" aria-busy={signingIn}>
          <input type="hidden" name="next" value={nextPath} />
          <label>
            邮箱
            <input name="email" type="email" required autoComplete="email" disabled={signingIn} />
          </label>
          <PasswordField
            label="密码"
            autoComplete="current-password"
            disabled={signingIn}
          />
          {signInState.error && <div className="error">{signInState.error}</div>}
          <BusyButton pending={signingIn} pendingLabel="登录中…">
            登录
          </BusyButton>
          {signingIn && <p className="form-busy-hint">正在登录，请稍候。</p>}
        </form>
      </article>

      <article className="panel">
        <h2>创建账号</h2>
        <form action={signUp} className="form" aria-busy={signingUp}>
          <input type="hidden" name="next" value={nextPath} />
          <label>
            昵称
            <input name="fullName" required autoComplete="nickname" disabled={signingUp} />
          </label>
          <label>
            邮箱
            <input name="email" type="email" required autoComplete="email" disabled={signingUp} />
          </label>
          <PasswordField
            label="密码（至少 8 个字符）"
            minLength={8}
            autoComplete="new-password"
            disabled={signingUp}
          />
          {signUpState.error && <div className="error">{signUpState.error}</div>}
          {signUpState.message && (
            <div className="success" role="status">
              {signUpState.message}
            </div>
          )}
          <BusyButton
            pending={signingUp}
            pendingLabel="注册中…"
            className="btn secondary"
          >
            注册
          </BusyButton>
          {signingUp && <p className="form-busy-hint">正在注册，请稍候。</p>}
        </form>
      </article>
    </div>
  );
}

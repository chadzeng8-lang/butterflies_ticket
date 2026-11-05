"use client";

import { useActionState } from "react";
import {
  signInAction,
  signUpAction,
  type AccountActionState,
} from "@/app/actions/account";
import { BusyButton } from "@/components/BusyButton";

const initialState: AccountActionState = {};

export function AccountForm({ nextPath }: { nextPath: string }) {
  const [signInState, signIn, signingIn] = useActionState(signInAction, initialState);
  const [signUpState, signUp, signingUp] = useActionState(signUpAction, initialState);

  return (
    <div className="grid">
      <article className="panel">
        <h2>已有帳號</h2>
        <form action={signIn} className="form" aria-busy={signingIn}>
          <input type="hidden" name="next" value={nextPath} />
          <label>
            電郵
            <input name="email" type="email" required autoComplete="email" disabled={signingIn} />
          </label>
          <label>
            密碼
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              disabled={signingIn}
            />
          </label>
          {signInState.error && <div className="error">{signInState.error}</div>}
          <BusyButton pending={signingIn} pendingLabel="登入中…">
            登入
          </BusyButton>
          {signingIn && <p className="form-busy-hint">正在登入，请稍候。</p>}
        </form>
      </article>

      <article className="panel">
        <h2>建立帳號</h2>
        <form action={signUp} className="form" aria-busy={signingUp}>
          <input type="hidden" name="next" value={nextPath} />
          <label>
            姓名
            <input name="fullName" required autoComplete="name" disabled={signingUp} />
          </label>
          <label>
            電郵
            <input name="email" type="email" required autoComplete="email" disabled={signingUp} />
          </label>
          <label>
            密碼（至少 8 個字元）
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={signingUp}
            />
          </label>
          {signUpState.error && <div className="error">{signUpState.error}</div>}
          {signUpState.message && (
            <div className="success" role="status">
              {signUpState.message}
            </div>
          )}
          <BusyButton
            pending={signingUp}
            pendingLabel="註冊中…"
            className="btn secondary"
          >
            註冊
          </BusyButton>
          {signingUp && <p className="form-busy-hint">正在註冊，请稍候。</p>}
        </form>
      </article>
    </div>
  );
}

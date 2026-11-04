"use client";

import { useActionState } from "react";
import {
  signInAction,
  signUpAction,
  type AccountActionState,
} from "@/app/actions/account";

const initialState: AccountActionState = {};

export function AccountForm({ nextPath }: { nextPath: string }) {
  const [signInState, signIn, signingIn] = useActionState(signInAction, initialState);
  const [signUpState, signUp, signingUp] = useActionState(signUpAction, initialState);

  return (
    <div className="grid">
      <article className="panel">
        <h2>已有帳號</h2>
        <form action={signIn} className="form">
          <input type="hidden" name="next" value={nextPath} />
          <label>
            電郵
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            密碼
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          {signInState.error && <div className="error">{signInState.error}</div>}
          <button className="btn" type="submit" disabled={signingIn}>
            {signingIn ? "登入中…" : "登入"}
          </button>
        </form>
      </article>

      <article className="panel">
        <h2>建立帳號</h2>
        <form action={signUp} className="form">
          <input type="hidden" name="next" value={nextPath} />
          <label>
            姓名
            <input name="fullName" required autoComplete="name" />
          </label>
          <label>
            電郵
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            密碼（至少 8 個字元）
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          {signUpState.error && <div className="error">{signUpState.error}</div>}
          {signUpState.message && (
            <div className="success" role="status">
              {signUpState.message}
            </div>
          )}
          <button className="btn secondary" type="submit" disabled={signingUp}>
            {signingUp ? "註冊中…" : "註冊"}
          </button>
        </form>
      </article>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { markPaidAction, type ActionState } from "@/app/actions/orders";

const initial: ActionState = {};

export function MarkPaidForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState(markPaidAction, initial);

  return (
    <form action={action} className="form">
      <input type="hidden" name="code" value={code} />
      <label>
        付款截图（可选，便于对账）
        <input type="file" name="proof" accept="image/*" />
      </label>
      {state.error && <div className="error">{state.error}</div>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "提交中…" : "我已付款"}
      </button>
    </form>
  );
}

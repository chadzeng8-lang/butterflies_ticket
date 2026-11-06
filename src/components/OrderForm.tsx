"use client";

import { useActionState } from "react";
import { createOrderAction, type ActionState } from "@/app/actions/orders";
import { BusyButton } from "@/components/BusyButton";

const initial: ActionState = {};

export function OrderForm({
  showId,
  maxQuantity,
  accountEmail,
}: {
  showId: number;
  maxQuantity: number;
  accountEmail: string;
}) {
  const [state, action, pending] = useActionState(createOrderAction, initial);
  const max = Math.min(5, Math.max(1, maxQuantity));

  return (
    <form action={action} className="form" aria-busy={pending}>
      <input type="hidden" name="showId" value={showId} />
      <label>
        手机号
        <input
          name="phone"
          required
          placeholder="用于现场核对与找回电子票"
          inputMode="tel"
          autoComplete="tel"
          disabled={pending}
        />
      </label>
      <label>
        邮箱
        <input
          name="contactExtra"
          type="email"
          required
          defaultValue={accountEmail}
          placeholder="注册账号邮箱"
          autoComplete="email"
          disabled={pending}
        />
      </label>
      <label>
        票数（每人最多 5 张）
        <select name="quantity" defaultValue="1" disabled={pending}>
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} 张
            </option>
          ))}
        </select>
      </label>
      {state.error && <div className="error">{state.error}</div>}
      <BusyButton pending={pending} pendingLabel="提交中…" disabled={max < 1}>
        提交订单
      </BusyButton>
      {pending && <p className="form-busy-hint">正在处理，请稍候，不要重复点击。</p>}
    </form>
  );
}

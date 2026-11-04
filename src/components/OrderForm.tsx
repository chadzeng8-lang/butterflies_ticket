"use client";

import { useActionState } from "react";
import { createOrderAction, type ActionState } from "@/app/actions/orders";

const initial: ActionState = {};

export function OrderForm({
  showId,
  maxQuantity,
}: {
  showId: number;
  maxQuantity: number;
}) {
  const [state, action, pending] = useActionState(createOrderAction, initial);
  const max = Math.min(5, Math.max(1, maxQuantity));

  return (
    <form action={action} className="form">
      <input type="hidden" name="showId" value={showId} />
      <label>
        姓名
        <input name="buyerName" required placeholder="购票人姓名" autoComplete="name" />
      </label>
      <label>
        手机号
        <input
          name="phone"
          required
          placeholder="用于找回电子票"
          inputMode="tel"
          autoComplete="tel"
        />
      </label>
      <label>
        邮箱（可选，可用于找回订单）
        <input name="contactExtra" type="email" placeholder="用于找回订单和电子票" autoComplete="email" />
      </label>
      <label>
        票数（每人最多 5 张）
        <select name="quantity" defaultValue="1">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} 张
            </option>
          ))}
        </select>
      </label>
      {state.error && <div className="error">{state.error}</div>}
      <button className="btn" type="submit" disabled={pending || max < 1}>
        {pending ? "提交中…" : "提交订单"}
      </button>
    </form>
  );
}

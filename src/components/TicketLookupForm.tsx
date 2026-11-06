"use client";

import { useActionState } from "react";
import { lookupTicketsAction, type TicketLookupState } from "@/app/actions/tickets";
import { BusyButton } from "@/components/BusyButton";
import { TicketOrderList } from "@/components/TicketOrderList";

const initialState: TicketLookupState = {};

export function TicketLookupForm() {
  const [state, action, pending] = useActionState(lookupTicketsAction, initialState);

  return (
    <div className="grid">
      <form className="form" action={action} aria-busy={pending}>
        <label>
          购票姓名
          <input name="buyerName" required autoComplete="name" disabled={pending} />
        </label>
        <label>
          下单时使用的手机号码或邮箱
          <input
            name="contact"
            required
            autoComplete="off"
            placeholder="输入完整手机号码或邮箱地址"
            disabled={pending}
          />
        </label>
        {state.error && <div className="error" role="alert">{state.error}</div>}
        <BusyButton pending={pending} pendingLabel="查询中…">
          票务查询
        </BusyButton>
        {pending && <p className="form-busy-hint">正在查询，请稍候。</p>}
      </form>

      {state.orders && state.orders.length > 0 && (
        <TicketOrderList orders={state.orders} />
      )}
    </div>
  );
}

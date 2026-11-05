"use client";

import { useActionState } from "react";
import { lookupTicketsAction, type TicketLookupState } from "@/app/actions/tickets";
import { TicketOrderList } from "@/components/TicketOrderList";

const initialState: TicketLookupState = {};

export function TicketLookupForm() {
  const [state, action, pending] = useActionState(lookupTicketsAction, initialState);

  return (
    <div className="grid">
      <form className="form" action={action}>
        <label>
          購票姓名
          <input name="buyerName" required autoComplete="name" />
        </label>
        <label>
          下單時使用的手機號碼或電郵
          <input
            name="contact"
            required
            autoComplete="off"
            placeholder="輸入完整手機號碼或電郵地址"
          />
        </label>
        {state.error && <div className="error" role="alert">{state.error}</div>}
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "查詢中…" : "找回訂單及電子票"}
        </button>
      </form>

      {state.orders && state.orders.length > 0 && (
        <TicketOrderList orders={state.orders} />
      )}
    </div>
  );
}

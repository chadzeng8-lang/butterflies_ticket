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
          購票姓名
          <input name="buyerName" required autoComplete="name" disabled={pending} />
        </label>
        <label>
          下單時使用的手機號碼或電郵
          <input
            name="contact"
            required
            autoComplete="off"
            placeholder="輸入完整手機號碼或電郵地址"
            disabled={pending}
          />
        </label>
        {state.error && <div className="error" role="alert">{state.error}</div>}
        <BusyButton pending={pending} pendingLabel="查詢中…">
          找回訂單及電子票
        </BusyButton>
        {pending && <p className="form-busy-hint">正在查詢，请稍候。</p>}
      </form>

      {state.orders && state.orders.length > 0 && (
        <TicketOrderList orders={state.orders} />
      )}
    </div>
  );
}

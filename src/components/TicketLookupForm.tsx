"use client";

import Link from "next/link";
import { useActionState } from "react";
import { lookupTicketsAction, type TicketLookupState } from "@/app/actions/tickets";
import { formatShowTime } from "@/lib/format";

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

      {state.orders?.map((order) => (
        <article className="card ticket-order" key={order.id}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <p className="eyebrow">訂單編號</p>
              <h2 className="order-code">{order.code}</h2>
            </div>
            <span className="badge">{order.status}</span>
          </div>
          <div className="meta" style={{ margin: "0.6rem 0 1rem" }}>
            <span>{order.showTitle}</span>
            <span>{formatShowTime(order.showStartsAt)} · {order.showVenue}</span>
            <span>{order.quantity} 張 · 應付 {order.total}</span>
          </div>
          <Link href={`/orders/${order.code}`}>查看訂單詳情</Link>
          {order.tickets.length > 0 ? (
            <div className="ticket-result-grid" style={{ marginTop: "1rem" }}>
              {order.tickets.map((ticket) => (
                <div className="ticket" key={ticket.code}>
                  <h3>{ticket.code}</h3>
                  <img src={ticket.dataUrl} alt={`電子票 ${ticket.code} 二維碼`} />
                  <p className="muted">{ticket.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: "0.8rem" }}>
              尚未出票。若已付款，請等待工作人員確認收款。
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

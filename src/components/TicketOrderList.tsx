import Link from "next/link";
import { formatShowTime } from "@/lib/format";

export type TicketOrderView = {
  id: number;
  code: string;
  status: string;
  showTitle: string;
  showStartsAt: string;
  showVenue: string;
  quantity: number;
  total: string;
  tickets: Array<{
    code: string;
    status: string;
    dataUrl: string;
  }>;
};

export function TicketOrderList({ orders }: { orders: TicketOrderView[] }) {
  return (
    <div className="grid">
      {orders.map((order) => (
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

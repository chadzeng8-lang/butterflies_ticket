import Link from "next/link";
import { formatShowTime } from "@/lib/format";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export type TicketOrderView = {
  id: number;
  code: string;
  statusKey: OrderStatus;
  status: string;
  showTitle: string;
  showStartsAt: string;
  showVenue: string;
  quantity: number;
  total: string;
  phone: string;
  purchaseNo: number | null;
  tickets: Array<{
    code: string;
    status: string;
  }>;
};

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "pending_payment":
    case "pending_confirm":
      return "badge warn";
    case "issued":
    case "checked_in":
    case "deposit_refunded":
      return "badge success";
    case "cancelled":
    case "expired":
      return "badge danger";
    default:
      return "badge";
  }
}

function emptyTicketNote(status: OrderStatus): { text: string; tone: string } {
  switch (status) {
    case "cancelled":
      return {
        text: "此订单已取消，不会出票。若已转账，请联系主办方核对处理。",
        tone: "ticket-order-note is-danger",
      };
    case "expired":
      return {
        text: "此订单已过期失效，不会出票。请重新选择场次登记。",
        tone: "ticket-order-note is-danger",
      };
    case "pending_payment":
      return {
        text: "尚未付款完成。请打开订单详情按指引缴付按金。",
        tone: "ticket-order-note is-warn",
      };
    default:
      return {
        text: "尚未出票。若已付款，请等待工作人员确认收款。",
        tone: "ticket-order-note is-warn",
      };
  }
}

export function TicketOrderList({ orders }: { orders: TicketOrderView[] }) {
  return (
    <div className="grid">
      {orders.map((order) => {
        const statusKey = order.statusKey;
        const label = order.status || ORDER_STATUS_LABEL[statusKey];
        const note = emptyTicketNote(statusKey);
        const issued = order.tickets.length > 0;

        return (
          <article className="card ticket-order" key={order.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <p className="eyebrow">
                  {order.purchaseNo ? "购票编号" : "订单状态"}
                </p>
                <h2 className="order-code">
                  {order.purchaseNo ? order.purchaseNo : label}
                </h2>
              </div>
              <span className={statusBadgeClass(statusKey)}>{label}</span>
            </div>
            <div className="meta" style={{ margin: "0.6rem 0 1rem" }}>
              <span>{order.showTitle}</span>
              <span>
                {formatShowTime(order.showStartsAt)} · {order.showVenue}
              </span>
              <span>
                {order.quantity} 张 · 应付 {order.total}
              </span>
              {order.phone ? <span>登记手机 {order.phone}</span> : null}
            </div>
            <Link href={`/orders/${order.code}`}>查看订单详情</Link>
            {issued ? (
              <div className="ticket-entry-note" style={{ marginTop: "1rem" }}>
                <p>
                  入场时请出示购票编号
                  {order.purchaseNo ? (
                    <>
                      {" "}
                      <strong>{order.purchaseNo}</strong>
                    </>
                  ) : null}
                  ，并核对手机号 <strong>{order.phone || "登记手机"}</strong>
                  ，无需出示二维码。
                </p>
                {order.tickets.length > 1 ? (
                  <p className="muted">本单一共 {order.tickets.length} 张，共用同一购票编号。</p>
                ) : null}
              </div>
            ) : (
              <p className={note.tone}>{note.text}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

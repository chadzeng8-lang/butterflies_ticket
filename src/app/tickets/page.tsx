import Link from "next/link";
import { signOutAction } from "@/app/actions/account";
import { SiteHeader } from "@/components/SiteHeader";
import { TicketLookupForm } from "@/components/TicketLookupForm";
import { TicketOrderList, type TicketOrderView } from "@/components/TicketOrderList";
import { createSupabaseServerClient, getSupabaseUser } from "@/lib/supabase/server";
import { listSupabaseOrdersForCurrentUser } from "@/lib/supabase/orders";
import { centsToCny } from "@/lib/money";
import { toDataUrl } from "@/lib/qr";
import { signTicketCode } from "@/lib/ticket-token";
import { ORDER_STATUS_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getSupabaseUser(supabase);
  let orders: TicketOrderView[] = [];

  if (user) {
    const records = await listSupabaseOrdersForCurrentUser();
    orders = await Promise.all(
      records.map(async ({ order, tickets }) => ({
        id: order.id,
        code: order.code,
        statusKey: order.status,
        status: ORDER_STATUS_LABEL[order.status],
        showTitle: order.showTitle,
        showStartsAt: order.showStartsAt,
        showVenue: order.showVenue,
        quantity: order.quantity,
        total: centsToCny(order.ticketTotalCents + order.depositTotalCents),
        tickets: await Promise.all(
          tickets.map(async (ticket) => ({
            code: ticket.code,
            status: ticket.depositRefundedAt
              ? "按金已退"
              : ticket.checkedInAt
                ? "已核销"
                : "待核销",
            dataUrl: await toDataUrl(signTicketCode(ticket.code)),
          }))
        ),
      }))
    );
  }

  return (
    <main className="shell shell-narrow">
      <SiteHeader />
      <section className="hero">
        <h1>票夹</h1>
        <p>
          {user
            ? `已登录 ${user.email}，以下为关联到此账号的订单与电子票。`
            : "登录账号查看关联订单，或输入购票姓名及下单时使用的手机号码或电邮找回订单。"}
        </p>
      </section>

      {user ? (
        <section className="grid">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2>我的订单与电子票</h2>
            <form action={signOutAction}>
              <button className="btn secondary" type="submit">登出</button>
            </form>
          </div>
          {orders.length > 0 ? (
            <TicketOrderList orders={orders} />
          ) : (
            <article className="panel muted">此账号暂时没有关联订单。</article>
          )}
        </section>
      ) : (
        <div className="grid">
          <article className="panel">
            <h2>登录查看账号订单</h2>
            <p className="muted">登录后可直接查看关联到账号的订单与电子票。</p>
            <Link className="btn" href="/account?next=%2Ftickets">登录或注册</Link>
          </article>
          <article className="panel">
            <h2>不用登录，找回订单</h2>
            <TicketLookupForm />
          </article>
        </div>
      )}
    </main>
  );
}

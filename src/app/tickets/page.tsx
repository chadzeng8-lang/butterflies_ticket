import { SiteHeader } from "@/components/SiteHeader";
import { TicketLookupForm } from "@/components/TicketLookupForm";

export const dynamic = "force-dynamic";

export default function TicketsPage() {
  return (
    <main className="shell shell-narrow">
      <SiteHeader />
      <section className="hero">
        <h1>票夹</h1>
        <p>输入購票姓名，以及下單時使用的完整手機號碼或電郵，即可找回訂單並查看電子票狀態。</p>
      </section>

      <article className="panel">
        <TicketLookupForm />
      </article>
    </main>
  );
}

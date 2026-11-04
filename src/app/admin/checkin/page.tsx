import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { CheckInPanel } from "@/components/CheckInPanel";
import { SiteHeader } from "@/components/SiteHeader";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminCheckInPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  return (
    <main className="shell">
      <SiteHeader />
      <section className="hero">
        <h1>现场核销</h1>
        <p>扫观众电子票，确认后退还按金并在系统登记。现金/FPS 退款由现场完成，系统只做台账。</p>
      </section>
      <AdminNav />
      <CheckInPanel />
    </main>
  );
}

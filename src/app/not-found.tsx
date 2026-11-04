import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <main className="shell">
      <SiteHeader />
      <section className="hero">
        <h1>页面不存在</h1>
        <p>链接可能已失效，或订单号不正确。</p>
      </section>
      <Link className="btn" href="/">
        返回首页
      </Link>
    </main>
  );
}

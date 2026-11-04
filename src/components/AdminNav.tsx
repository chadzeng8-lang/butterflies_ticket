import Link from "next/link";
import { logoutAction } from "@/app/actions/admin";

export function AdminNav() {
  return (
    <div className="admin-nav">
      <Link href="/admin">总览</Link>
      <Link href="/admin/shows">场次</Link>
      <Link href="/admin/orders">订单</Link>
      <Link href="/admin/checkin">现场核销</Link>
      <Link href="/admin/export">导出</Link>
      <form action={logoutAction}>
        <button className="btn secondary" type="submit">
          退出
        </button>
      </form>
    </div>
  );
}

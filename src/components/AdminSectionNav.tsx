import Link from "next/link";

export type AdminSection = "orders" | "accounts";

const TABS: Array<{
  id: AdminSection;
  href: string;
  label: string;
}> = [
  { id: "orders", href: "/admin/online-orders", label: "订单管理" },
  { id: "accounts", href: "/admin/online-accounts", label: "管理账号" },
];

export function AdminSectionNav({ current }: { current: AdminSection }) {
  return (
    <nav className="admin-section-nav" aria-label="管理分区">
      {TABS.map((tab) => {
        const active = tab.id === current;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`admin-tab admin-tab-${tab.id}${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

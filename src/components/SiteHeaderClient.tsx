"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";
import { HeaderNavigationProgress } from "@/components/NavigationProgress";

export function SiteHeaderClient({
  siteName,
  isAdmin,
}: {
  siteName: string;
  isAdmin: boolean;
}) {
  const { locale, toggleLocale } = useLocale();

  return (
    <header className="topbar">
      <div className="topbar-row">
        <Link href="/" className="brand">
          <Image
            className="brand-logo"
            src="/images/cu-musical-logo.jpg"
            alt="CU Musical"
            width={768}
            height={768}
          />
          <span>{siteName}</span>
        </Link>
        <nav className="nav">
          <Link href="/">首页</Link>
          <Link href="/shows">购票</Link>
          <Link href="/tickets">票夹</Link>
          <Link href="/campus-entry">入校指南</Link>
          <Link href="/personality">人格测试</Link>
          <Link href="/account">帳號</Link>
          {isAdmin && <Link href="/admin/online-orders">管理</Link>}
          <button
            className="locale-toggle"
            type="button"
            onClick={toggleLocale}
            aria-label={locale === "cn" ? "切换到繁体中文" : "切換至繁體中文"}
            title={locale === "cn" ? "切换到繁体中文" : "切換至繁體中文"}
          >
            {locale === "cn" ? "繁" : "简"}
          </button>
        </nav>
      </div>
      <HeaderNavigationProgress />
    </header>
  );
}

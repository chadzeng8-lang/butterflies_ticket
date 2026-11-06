"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";
import { HeaderNavigationProgress } from "@/components/NavigationProgress";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function SiteHeaderClient({ siteName }: { siteName: string }) {
  const { locale, toggleLocale } = useLocale();
  const isAdmin = useIsAdmin();

  return (
    <header className="topbar">
      <div className="topbar-row">
        <div className="topbar-main">
          <Link href="/" className="brand">
            <Image
              className="brand-logo"
              src="/images/cu-musical-logo.jpg"
              alt="CU Musical"
              width={96}
              height={96}
              sizes="40px"
              quality={60}
              loading="lazy"
            />
            <span>{siteName}</span>
          </Link>
          <nav className="nav">
            <Link href="/">首页</Link>
            <Link href="/shows">购票</Link>
            <Link href="/tickets">票夹</Link>
            {isAdmin ? (
              <Link href="/campus-entry">入校指南</Link>
            ) : (
              <span className="nav-disabled" title="入校指南暂未开放" aria-disabled="true">
                入校指南
              </span>
            )}
            <Link href="/personality">人格测试</Link>
            <Link href="/account">账号</Link>
            {isAdmin && <Link href="/admin/online-orders">管理</Link>}
          </nav>
        </div>
        <button
          className="locale-toggle"
          type="button"
          onClick={toggleLocale}
          aria-label={locale === "cn" ? "切换到繁体中文" : "切换到简体中文"}
          title={locale === "cn" ? "切换到繁体中文" : "切换到简体中文"}
        >
          {locale === "cn" ? "繁" : "简"}
        </button>
      </div>
      <HeaderNavigationProgress />
    </header>
  );
}

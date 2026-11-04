"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/components/LocaleProvider";

const siteName = process.env.SITE_NAME || "《蝶》沉浸版展演";

export function SiteHeader() {
  const { locale, toggleLocale } = useLocale();

  return (
    <header className="topbar">
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
        <Link href="/">场次</Link>
        <Link href="/tickets">票夹</Link>
        <Link href="/account">帳號</Link>
        <Link href="/admin/online-orders">干事</Link>
        <button
          className="locale-toggle"
          type="button"
          onClick={toggleLocale}
          aria-label={locale === "cn" ? "切换到繁体中文" : "切換至簡體中文"}
          title={locale === "cn" ? "切换到繁体中文" : "切換至簡體中文"}
        >
          {locale === "cn" ? "繁" : "简"}
        </button>
      </nav>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startNavigationBusy } from "@/lib/navigation-busy";

/** 站内跳转按钮：一点击就进入忙碌态，直到路由切换完成。 */
export function PendingLink({
  href,
  children,
  className = "btn",
  pendingLabel = "加载中…",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const busy = pending || isNavigating;

  return (
    <Link
      href={href}
      className={`${className}${busy ? " is-pending" : ""}`}
      aria-busy={busy}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;
        event.preventDefault();
        setPending(true);
        startNavigationBusy(1200);
        startTransition(() => {
          router.push(href);
        });
      }}
    >
      {busy && <span className="btn-spinner" aria-hidden />}
      <span>{busy ? pendingLabel : children}</span>
    </Link>
  );
}

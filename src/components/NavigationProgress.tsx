"use client";

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getNavigationBusy,
  startNavigationBusy,
  stopNavigationBusySoon,
  subscribeNavigationBusy,
} from "@/lib/navigation-busy";

function useNavigationBusy() {
  return useSyncExternalStore(
    subscribeNavigationBusy,
    getNavigationBusy,
    () => false
  );
}

function NavigationClickBinderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    stopNavigationBusySoon(450);
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      if (href.startsWith("#")) {
        startNavigationBusy(600);
        return;
      }

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          !url.hash
        ) {
          return;
        }
      } catch {
        return;
      }

      startNavigationBusy(1200);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

/** 放在 layout：只负责监听点击/路由，不渲染顶栏进度条。 */
export function NavigationBusyBinder() {
  return (
    <Suspense fallback={null}>
      <NavigationClickBinderInner />
    </Suspense>
  );
}

/** 菜单下方的金色进度条。 */
export function HeaderNavigationProgress() {
  const active = useNavigationBusy();

  return (
    <div
      className={`nav-progress nav-progress--header${active ? " is-active" : ""}`}
      role="progressbar"
      aria-hidden={!active}
      aria-busy={active}
      aria-label="页面加载中"
    >
      <span className="nav-progress-bar" />
    </div>
  );
}

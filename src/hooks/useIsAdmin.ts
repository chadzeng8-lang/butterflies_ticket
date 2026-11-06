"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function hasSupabaseAuthCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => {
    const name = part.trim().split("=")[0] || "";
    return name.startsWith("sb-") && name.includes("auth-token");
  });
}

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!hasSupabaseAuthCookie()) return;

    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;

    const run = () => {
      const supabase = createSupabaseBrowserClient();
      void (async () => {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        if (!user) {
          if (!cancelled) setIsAdmin(false);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled) setIsAdmin(profile?.role === "admin");
      })();
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(run, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(run, 200);
    }

    return () => {
      cancelled = true;
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  return isAdmin;
}

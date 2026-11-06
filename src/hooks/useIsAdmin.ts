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
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    const refresh = async () => {
      if (!hasSupabaseAuthCookie()) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
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
    };

    void refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return isAdmin;
}

"use client";

import type { ReactNode } from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function AdminOnly({ children }: { children: ReactNode }) {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  return <>{children}</>;
}

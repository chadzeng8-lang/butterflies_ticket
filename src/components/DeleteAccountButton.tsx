"use client";

import { useTransition } from "react";
import { deleteAccountAction } from "@/app/actions/supabase-admin";

export function DeleteAccountButton({
  userId,
  email,
  orderCount,
  returnTo,
}: {
  userId: string;
  email: string;
  orderCount: number;
  returnTo: string;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    const orderHint =
      orderCount > 0
        ? `该账号下还有 ${orderCount} 笔订单，将一并永久删除。\n`
        : "";
    const ok = window.confirm(
      `${orderHint}确定删除账号 ${email}？此操作不可恢复。`,
    );
    if (!ok) return;

    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("returnTo", returnTo);
    startTransition(() => {
      void deleteAccountAction(formData);
    });
  }

  return (
    <button
      type="button"
      className="btn danger"
      disabled={pending}
      onClick={onDelete}
    >
      {pending ? "删除中…" : "删除账号"}
    </button>
  );
}

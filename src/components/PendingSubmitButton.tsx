"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
};

/** 用于任意 `<form action={serverAction}>`：提交后立刻禁用并显示加载态。 */
export function PendingSubmitButton({
  children,
  pendingLabel = "处理中…",
  className = "btn",
  disabled = false,
}: Props) {
  const { pending } = useFormStatus();
  const busy = pending || disabled;

  return (
    <button
      type="submit"
      className={`${className}${pending ? " is-pending" : ""}`}
      disabled={busy}
      aria-busy={pending}
    >
      {pending && <span className="btn-spinner" aria-hidden />}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}

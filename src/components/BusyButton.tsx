"use client";

/** 配合 useActionState / useTransition 的 pending 布尔值使用。 */
export function BusyButton({
  pending,
  pendingLabel = "处理中…",
  children,
  className = "btn",
  disabled = false,
  type = "submit",
}: {
  pending: boolean;
  pendingLabel?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      className={`${className}${pending ? " is-pending" : ""}`}
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending && <span className="btn-spinner" aria-hidden />}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}

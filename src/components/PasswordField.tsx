"use client";

import { useId, useState } from "react";

type PasswordFieldProps = {
  name?: string;
  label: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  disabled?: boolean;
};

export function PasswordField({
  name = "password",
  label,
  required = true,
  minLength,
  autoComplete = "current-password",
  disabled = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <label className="password-field" htmlFor={inputId}>
      {label}
      <span className="password-field-control">
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          disabled={disabled}
        />
        <button
          type="button"
          className="password-visibility-toggle"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "隐藏密码" : "显示密码"}
          aria-pressed={visible}
          disabled={disabled}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5A2.5 2.5 0 1 0 12 9a2.5 2.5 0 0 0 0 5z"
              />
              <path
                fill="currentColor"
                d="M3.3 4.7 4.7 3.3l16 16-1.4 1.4z"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5A2.5 2.5 0 1 0 12 9a2.5 2.5 0 0 0 0 5z"
              />
            </svg>
          )}
        </button>
      </span>
    </label>
  );
}

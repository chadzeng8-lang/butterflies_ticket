"use client";

import { useEffect, useRef } from "react";

const NOTICE_KEY = "butterflies-privacy-notice-v1";

export function PrivacyNotice() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(NOTICE_KEY) === "seen") return;
    } catch {
      // 浏览器限制本地存储时，仍可显示提示。
    }

    dialogRef.current?.showModal();
  }, []);

  function dismissNotice() {
    try {
      window.localStorage.setItem(NOTICE_KEY, "seen");
    } catch {
      // 本地存储不可用时，仍可关闭提示。
    }

    dialogRef.current?.close();
  }

  return (
    <>
      <div style={{ textAlign: "center", padding: "0 1rem 1.5rem" }}>
        <button
          type="button"
          className="btn secondary"
          style={{ borderRadius: "8px" }}
          onClick={() => dialogRef.current?.showModal()}
        >
          个人信息处理提示
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="privacy-notice-title"
        aria-describedby="privacy-notice-description"
        style={{
          boxSizing: "border-box",
          width: "min(28rem, calc(100% - 2rem))",
          padding: "1.5rem",
          border: "1px solid var(--line-strong)",
          borderRadius: "12px",
          background: "var(--bg-elevated)",
          color: "var(--ink)",
        }}
      >
        <h2 id="privacy-notice-title" style={{ margin: 0, fontSize: "1.25rem" }}>
          个人信息处理提示
        </h2>
        <p id="privacy-notice-description" style={{ lineHeight: 1.7 }}>
          演出在校园内举行，观演可能涉及入校审核。如需在购票网站提交个人信息，
          请在登记前查看对应的个人信息处理说明。你可以先继续浏览演出和场次。
        </p>
        <button
          type="button"
          className="btn"
          style={{ borderRadius: "8px" }}
          onClick={dismissNotice}
        >
          继续浏览
        </button>
      </dialog>
    </>
  );
}

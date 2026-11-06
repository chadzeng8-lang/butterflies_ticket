"use client";

import Image from "next/image";
import { useRef } from "react";

export function FooterWechatQr() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="site-footer-qr-frame site-footer-qr-zoom"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="放大查看微信公众号二维码"
      >
        <Image
          src="/images/wechat-oa.jpg"
          alt="微信公众号「吐露港音乐剧研究中心」二维码"
          width={480}
          height={640}
        />
      </button>
      <dialog
        ref={dialogRef}
        className="site-footer-qr-dialog"
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current.close();
          }
        }}
      >
        <form method="dialog" className="site-footer-qr-dialog-bar">
          <span>微信公众号</span>
          <button type="submit" className="btn secondary">
            关闭
          </button>
        </form>
        <img
          src="/images/wechat-oa.jpg"
          alt="微信公众号「吐露港音乐剧研究中心」二维码"
        />
      </dialog>
    </>
  );
}

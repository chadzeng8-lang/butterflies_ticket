"use client";

import Image from "next/image";
import { useRef } from "react";

export function OrderWechatGroup() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <article className="panel">
      <h2>加入微信观演群</h2>
      <p className="muted" style={{ marginBottom: "0.9rem" }}>
        下单后请用微信扫码加入「🦋 港中深观剧群」，获取演出通知与现场安排。
      </p>
      <figure className="order-wechat-group">
        <button
          type="button"
          className="order-wechat-group-zoom"
          onClick={() => dialogRef.current?.showModal()}
          aria-label="放大查看微信观演群二维码"
        >
          <Image
            src="/images/wechat-audience-group.jpg"
            alt="微信群「港中深观剧群」邀请二维码"
            width={720}
            height={1280}
            className="order-wechat-group-image"
            sizes="(max-width: 720px) 90vw, 320px"
            priority
          />
        </button>
      </figure>
      <dialog
        ref={dialogRef}
        className="site-footer-qr-dialog order-wechat-group-dialog"
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current.close();
          }
        }}
      >
        <form method="dialog" className="site-footer-qr-dialog-bar">
          <span>港中深观剧群</span>
          <button type="submit" className="btn secondary">
            关闭
          </button>
        </form>
        <img
          src="/images/wechat-audience-group.jpg"
          alt="微信群「港中深观剧群」邀请二维码"
        />
      </dialog>
    </article>
  );
}

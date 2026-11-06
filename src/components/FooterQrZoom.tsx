"use client";

import Image from "next/image";
import { useRef } from "react";

export function FooterQrZoom({
  src,
  alt,
  title,
  linkHref,
  linkLabel,
  width = 480,
  height = 480,
}: {
  src: string;
  alt: string;
  title: string;
  linkHref?: string;
  linkLabel?: string;
  width?: number;
  height?: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="site-footer-qr-frame site-footer-qr-zoom"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`放大查看${title}二维码`}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="120px"
          quality={60}
          loading="lazy"
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
          <span>{title}</span>
          <button type="submit" className="btn secondary">
            关闭
          </button>
        </form>
        <img src={src} alt={alt} />
        {linkHref && linkLabel ? (
          <p className="site-footer-qr-dialog-link">
            <a
              className="site-footer-qr-link"
              href={linkHref}
              target="_blank"
              rel="noreferrer"
            >
              {linkLabel}
            </a>
          </p>
        ) : null}
      </dialog>
    </>
  );
}

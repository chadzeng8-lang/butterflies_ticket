"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Portrait = {
  thumb: string;
  full: string;
  alt: string;
};

export function PortraitLightboxButton({
  portrait,
  className,
  sizes,
}: {
  portrait: Portrait;
  className?: string;
  sizes: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        aria-label={`查看高清：${portrait.alt}`}
      >
        <Image
          src={portrait.thumb}
          alt=""
          width={420}
          height={560}
          sizes={sizes}
          loading="lazy"
          unoptimized
        />
      </button>

      <dialog
        ref={dialogRef}
        className="stage-photo-dialog"
        aria-label={portrait.alt}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setOpen(false);
          }
        }}
      >
        <form method="dialog" className="stage-photo-dialog-bar">
          <button type="submit" className="btn secondary">
            关闭
          </button>
        </form>
        {open ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={portrait.full} alt="" />
        ) : null}
      </dialog>
    </>
  );
}

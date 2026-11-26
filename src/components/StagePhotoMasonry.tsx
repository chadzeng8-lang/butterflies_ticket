"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Photo = {
  src: string;
  fullSrc: string;
  alt: string;
};

export function StagePhotoMasonry({ photos }: { photos: Photo[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<Photo | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (active) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [active]);

  return (
    <>
      <div className="stage-photo-masonry">
        {photos.map((photo) => (
          <button
            key={photo.src}
            type="button"
            className="stage-photo-thumb"
            onClick={() => setActive(photo)}
            aria-label={`查看高清：${photo.alt}`}
          >
            <Image
              src={photo.src}
              alt=""
              width={480}
              height={640}
              sizes="(max-width: 720px) 46vw, 220px"
              loading="lazy"
              unoptimized
            />
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="stage-photo-dialog"
        aria-label="舞台剧照"
        onClose={() => setActive(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setActive(null);
          }
        }}
      >
        <form method="dialog" className="stage-photo-dialog-bar">
          <button type="submit" className="btn secondary">
            关闭
          </button>
        </form>
        {active ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.fullSrc} alt="" />
        ) : null}
      </dialog>
    </>
  );
}

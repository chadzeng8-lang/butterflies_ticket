"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const STAGE_PHOTOS = [
  { src: "/images/butterflies-still-1.jpg", alt: "音乐剧《蝶》双人舞台剧照" },
  { src: "/images/butterflies-still-2.jpg", alt: "梁山伯与祝英台的舞台剧照" },
  { src: "/images/butterflies-still-3.jpg", alt: "音乐剧《蝶》群像舞台剧照" },
  { src: "/images/stage-01.jpg", alt: "《蝶》舞台剧照 1" },
  { src: "/images/stage-02.jpg", alt: "《蝶》舞台剧照 2" },
  { src: "/images/stage-03.jpg", alt: "《蝶》舞台剧照 3" },
  { src: "/images/stage-04.jpg", alt: "《蝶》舞台剧照 4" },
  { src: "/images/stage-05.jpg", alt: "《蝶》舞台剧照 5" },
  { src: "/images/stage-06.jpg", alt: "《蝶》舞台剧照 6" },
  { src: "/images/stage-07.jpg", alt: "《蝶》舞台剧照 7" },
  { src: "/images/stage-08.jpg", alt: "《蝶》舞台剧照 8" },
  { src: "/images/stage-09.jpg", alt: "《蝶》舞台剧照 9" },
  { src: "/images/stage-10.jpg", alt: "《蝶》舞台剧照 10" },
  { src: "/images/stage-11.jpg", alt: "《蝶》舞台剧照 11" },
  { src: "/images/stage-12.jpg", alt: "《蝶》舞台剧照 12" },
] as const;

const TOTAL = STAGE_PHOTOS.length;

function wrapIndex(index: number) {
  return ((index % TOTAL) + TOTAL) % TOTAL;
}

export function StageGallery() {
  const [index, setIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const goBy = (direction: -1 | 1) => {
    setIndex((current) => wrapIndex(current + direction));
  };

  const visibleIndexes = hydrated
    ? [wrapIndex(index - 1), index, wrapIndex(index + 1)]
    : [index];

  return (
    <div className="stage-gallery">
      <div className="stage-gallery-frame">
        <div
          className="photo-gallery photo-gallery-indexed"
          tabIndex={0}
          aria-label="演出剧照，可左右切换浏览"
          aria-live="polite"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              goBy(-1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              goBy(1);
            }
          }}
        >
          {STAGE_PHOTOS.map((photo, i) => {
            const isActive = i === index;
            const shouldRender = visibleIndexes.includes(i);
            return (
              <figure
                className={`gallery-photo${isActive ? " is-active" : ""}`}
                key={photo.src}
                aria-hidden={!isActive}
                data-active={isActive ? "true" : undefined}
              >
                {shouldRender ? (
                  <Image
                    src={photo.src}
                    alt={isActive ? photo.alt : ""}
                    fill
                    sizes="(max-width: 720px) 92vw, min(720px, 48vw)"
                    quality={68}
                    className="gallery-photo-img"
                    loading={isActive ? "lazy" : "eager"}
                  />
                ) : null}
              </figure>
            );
          })}
        </div>

        <button
          type="button"
          className="stage-gallery-nav stage-gallery-nav-prev"
          aria-label="上一张"
          onClick={() => goBy(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="stage-gallery-nav stage-gallery-nav-next"
          aria-label="下一张"
          onClick={() => goBy(1)}
        >
          ›
        </button>
      </div>

      <p className="stage-gallery-hint">
        {index + 1} / {TOTAL} · 左右切换查看
      </p>
    </div>
  );
}

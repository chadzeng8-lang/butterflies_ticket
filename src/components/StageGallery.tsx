"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const STAGE_PHOTOS = [
  { src: "/images/stage-v2-01.jpg", alt: "《蝶》舞台剧照 1" },
  { src: "/images/stage-v2-02.jpg", alt: "《蝶》舞台剧照 2" },
  { src: "/images/stage-v2-03.jpg", alt: "《蝶》舞台剧照 3" },
  { src: "/images/stage-v2-04.jpg", alt: "《蝶》舞台剧照 4" },
  { src: "/images/stage-v2-05.jpg", alt: "《蝶》舞台剧照 5" },
  { src: "/images/stage-v2-06.jpg", alt: "《蝶》舞台剧照 6" },
  { src: "/images/stage-v2-07.jpg", alt: "《蝶》舞台剧照 7" },
  { src: "/images/stage-v2-08.jpg", alt: "《蝶》舞台剧照 8" },
  { src: "/images/stage-v2-09.jpg", alt: "《蝶》舞台剧照 9" },
  { src: "/images/stage-v2-10.jpg", alt: "《蝶》舞台剧照 10" },
  { src: "/images/stage-v2-11.jpg", alt: "《蝶》舞台剧照 11" },
  { src: "/images/stage-v2-12.jpg", alt: "《蝶》舞台剧照 12" },
  { src: "/images/stage-v2-13.jpg", alt: "《蝶》舞台剧照 13" },
  { src: "/images/stage-v2-14.jpg", alt: "《蝶》舞台剧照 14" },
  { src: "/images/stage-v2-15.jpg", alt: "《蝶》舞台剧照 15" },
  { src: "/images/stage-v2-16.jpg", alt: "《蝶》舞台剧照 16" },
  { src: "/images/stage-v2-17.jpg", alt: "《蝶》舞台剧照 17" },
  { src: "/images/stage-v2-18.jpg", alt: "《蝶》舞台剧照 18" },
  { src: "/images/stage-v2-19.jpg", alt: "《蝶》舞台剧照 19" },
  { src: "/images/stage-v2-20.jpg", alt: "《蝶》舞台剧照 20" },
  { src: "/images/stage-v2-21.jpg", alt: "《蝶》舞台剧照 21" },
  { src: "/images/stage-v2-22.jpg", alt: "《蝶》舞台剧照 22" },
  { src: "/images/stage-v2-23.jpg", alt: "《蝶》舞台剧照 23" },
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
                    unoptimized={i === 0}
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

"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const STAGE_PHOTOS = [
  { src: "/images/butterflies-still-2.jpg", alt: "梁山伯与祝英台的舞台剧照" },
  { src: "/images/butterflies-still-1.jpg", alt: "音乐剧《蝶》双人舞台剧照" },
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
/** 三段相同内容：停留在中间段，滑到边缘时无感跳回，实现末张接首张 */
const LOOP_PHOTOS = [...STAGE_PHOTOS, ...STAGE_PHOTOS, ...STAGE_PHOTOS];

export function StageGallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const jumpingRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);

  const cards = () =>
    trackRef.current
      ? [...trackRef.current.querySelectorAll<HTMLElement>(".gallery-photo")]
      : [];

  const setOffset = (index: number) => {
    const track = trackRef.current;
    const card = cards()[index];
    if (!track || !card) return;
    track.scrollLeft = card.offsetLeft;
  };

  const nearestIndex = () => {
    const track = trackRef.current;
    const list = cards();
    if (!track || list.length === 0) return TOTAL;
    const left = track.scrollLeft;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    list.forEach((card, i) => {
      const distance = Math.abs(card.offsetLeft - left);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    });
    return nearest;
  };

  const normalizeLoop = () => {
    const track = trackRef.current;
    if (!track || jumpingRef.current) return;
    const current = nearestIndex();
    if (current < TOTAL) {
      jumpingRef.current = true;
      setOffset(current + TOTAL);
      requestAnimationFrame(() => {
        jumpingRef.current = false;
      });
    } else if (current >= TOTAL * 2) {
      jumpingRef.current = true;
      setOffset(current - TOTAL);
      requestAnimationFrame(() => {
        jumpingRef.current = false;
      });
    }
  };

  const goBy = (direction: -1 | 1) => {
    const track = trackRef.current;
    const list = cards();
    if (!track || list.length === 0) return;
    const current = nearestIndex();
    const next = Math.min(Math.max(current + direction, 0), list.length - 1);
    track.scrollTo({ left: list[next].offsetLeft, behavior: "smooth" });
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(normalizeLoop, 380);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const boot = () => setOffset(TOTAL);
    boot();
    const bootTimer = window.setTimeout(boot, 160);

    const onScroll = () => {
      if (jumpingRef.current) return;
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(normalizeLoop, 90);
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", boot);
    return () => {
      window.clearTimeout(bootTimer);
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", boot);
    };
  }, []);

  return (
    <div className="stage-gallery">
      <div className="stage-gallery-frame">
        <div
          ref={trackRef}
          className="photo-gallery photo-gallery-scroll"
          tabIndex={0}
          aria-label="演出剧照，可左右滑动循环浏览"
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
          {LOOP_PHOTOS.map((photo, i) => (
            <figure
              className="gallery-photo gallery-photo-natural"
              key={`${photo.src}-${i}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={1600}
                height={1200}
                sizes="(max-width: 720px) 90vw, 42vw"
                className="gallery-photo-img"
                priority={i >= TOTAL && i < TOTAL + 3}
              />
            </figure>
          ))}
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

      <p className="stage-gallery-hint">左右滑动查看</p>
    </div>
  );
}

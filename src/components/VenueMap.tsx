"use client";

import { useEffect, useRef, useState } from "react";
import { SHOW_VENUE, amapMarkerUrl, baiduMapUrl } from "@/lib/venue";

type AMapNamespace = {
  Map: new (
    container: HTMLElement,
    opts: {
      zoom: number;
      center: [number, number];
      viewMode?: string;
      mapStyle?: string;
    },
  ) => {
    add: (overlay: unknown) => void;
    destroy: () => void;
  };
  Marker: new (opts: { position: [number, number]; title?: string }) => unknown;
};

declare global {
  interface Window {
    _AMapSecurityConfig?: { securityJsCode: string };
    AMap?: AMapNamespace;
  }
}

const AMAP_LOAD_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function loadAmapScript(key: string, securityCode?: string): Promise<AMapNamespace> {
  if (window.AMap) {
    return Promise.resolve(window.AMap);
  }

  if (securityCode) {
    window._AMapSecurityConfig = { securityJsCode: securityCode };
  }

  const loadPromise = new Promise<AMapNamespace>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-amap-js]");
    if (existing) {
      if (window.AMap) {
        resolve(window.AMap);
        return;
      }
      existing.addEventListener("load", () => {
        if (window.AMap) resolve(window.AMap);
        else reject(new Error("AMap missing after load"));
      });
      existing.addEventListener("error", () => reject(new Error("AMap script error")));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
    script.async = true;
    script.dataset.amapJs = "1";
    script.onload = () => {
      if (window.AMap) resolve(window.AMap);
      else reject(new Error("AMap missing after load"));
    };
    script.onerror = () => reject(new Error("AMap script error"));
    document.head.appendChild(script);
  });

  return withTimeout(loadPromise, AMAP_LOAD_TIMEOUT_MS, "AMap load timeout");
}

export function VenueMap() {
  const blockRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ destroy: () => void } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "fallback">("idle");
  const [shouldLoad, setShouldLoad] = useState(false);

  const key = process.env.NEXT_PUBLIC_AMAP_KEY?.trim();
  const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE?.trim();

  useEffect(() => {
    const node = blockRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    if (!key || !containerRef.current) {
      setStatus("fallback");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    loadAmapScript(key, securityCode)
      .then((AMap) => {
        if (cancelled || !containerRef.current) return;

        const center: [number, number] = [SHOW_VENUE.lng, SHOW_VENUE.lat];
        const map = new AMap.Map(containerRef.current, {
          zoom: 16,
          center,
          viewMode: "2D",
          mapStyle: "amap://styles/normal",
        });

        map.add(
          new AMap.Marker({
            position: center,
            title: SHOW_VENUE.name,
          }),
        );

        mapRef.current = map;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("fallback");
      });

    return () => {
      cancelled = true;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [key, securityCode, shouldLoad]);

  return (
    <aside className="venue-map-block" aria-label="演出地点" ref={blockRef}>
      <div className="venue-map-copy">
        <p className="eyebrow">Venue</p>
        <h3>{SHOW_VENUE.name}</h3>
        <p className="venue-map-address">{SHOW_VENUE.location}</p>
        <div className="venue-map-actions">
          <a className="btn secondary" href={amapMarkerUrl()} target="_blank" rel="noreferrer">
            在高德地图打开
          </a>
          <a className="btn secondary" href={baiduMapUrl()} target="_blank" rel="noreferrer">
            在百度地图打开
          </a>
        </div>
      </div>

      <div className="venue-map-frame">
        <div
          ref={containerRef}
          className="venue-map-canvas"
          role="img"
          aria-label={`${SHOW_VENUE.name}位置地图`}
        />
        {status !== "ready" && (
          <div className="venue-map-fallback">
            {status === "idle" || status === "loading"
              ? "地图加载中…"
              : "地图暂不可用，请使用上方导航链接。"}
          </div>
        )}
      </div>
    </aside>
  );
}
